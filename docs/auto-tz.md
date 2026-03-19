# 自動タイムゾーン取得仕様

## 目的
- サーバ実行環境のタイムゾーン設定に依存せず、ユーザのタイムゾーンを自動推定できるようにする。
- 一度取得できた GeoIP location はキャッシュし、毎回外部問い合わせしなくてよいようにする。
- GeoIP や外部 API の実装詳細をアプリケーション層へ漏らさず、将来的に取得手段を差し替えやすくする。

## 背景
- 従来の `when-is-now` はサーバ実行環境のローカルタイムゾーンに従う前提だった。
- ただし Docker やリモート実行では、実行環境のタイムゾーンがユーザの期待と一致しない場合がある。
- 当面は `curl ipinfo.io` や `curl https://ipapi.co/json/` のような外部情報からタイムゾーンを推定する想定だが、この依存を直接埋め込むと将来の差し替えが難しくなる。
- Node.js v24 系でも `Temporal` を前提にせず、日時処理は当面 `date-fns` ベースで統一する。

## 位置づけ
- この機能は公開 tool そのものではなく、タイムゾーン決定のための内部基盤機能として導入する。
- 永続化には既存の store facade を利用する。
- GeoIP 取得には専用 facade を用意し、各 provider へのアクセスは facade 配下の provider 実装として扱う。
- 日時生成や duration 計算は共通の `datetimeUtils` に集約する。
- キャッシュ TTL は通常仕様で 1 日とし、期限判定も `datetimeUtils` に集約する。

## 用語
- `自動取得`: 外部情報を使ってタイムゾーンを推定すること。
- `キャッシュ`: 自動取得で得た `GeoIpLocation` を store に保存し、次回以降に再利用すること。
- `GeoIP facade`: location 候補を取得するための抽象インターフェース。
- `provider adapter`: provider ごとのレスポンス形式を共通形式へ正規化する内部アダプター。
- `GeoIpLocation`: provider adapter が返す共通 location 形式。

## 基本方針
- タイムゾーン決定は 1 箇所に集約する。
- 呼び出し側は `ipinfo.io`、`ipapi.co`、`curl` を直接知らない。
- provider ごとのキー名や値型の差は、すべて adapter で吸収する。
- 日時処理は `Date` や `Date.now()` を各所で直接扱わず、`datetimeUtils` に集約する。
- 自動取得に成功したら、その `GeoIpLocation` を store に保存する。
- 以後は `geoIpClient` がキャッシュと TTL を解釈し、不要な外部アクセスを避ける。
- 自動取得に失敗しても、最低限 `when-is-now` が動作不能にならない構成にする。
- adapter や facade の異常系は例外を投げず、失敗時は `undefined` を返す。
- GeoIP 由来の location は取得できない場合がある前提で扱う。
- GeoIP 由来の location は取得できても精度が低く、国や都市レベルでも大きく誤る場合がある前提で扱う。
- そのため、この基盤は会話文脈共有や補助的な推定に限定して利用し、厳密な所在地判定には使わない。

## タイムゾーン決定順序
1. 明示設定のタイムゾーンを確認する。
2. `geoIpClient.getLocation({ useCache: true })` で GeoIP cache を確認し、必要なら再取得する。
3. `location?.timezone` を使う。
4. どれも使えない場合は、サーバ実行環境のローカルタイムゾーンを使う。

## 利用上の注意
- 自動取得は best effort とする。
- GeoIP provider の応答がなく、location を取得できないことがある。
- location を取得できても、VPN、プロキシ、モバイル回線、provider 側のデータ品質などにより、実際の利用者位置とかけ離れることがある。
- 特に `country`、`region`、`city` は参考情報であり、常に正しいことを前提にしない。
- 正確さや再現性が必要な場合は、自動取得に依存せず `TZ` などの明示設定を優先する。

## 明示設定
- 明示設定の具体的な入力手段は別途実装で定義してよい。
- 例として環境変数 `TZ` や将来の設定ファイルを想定してよい。
- 明示設定がある場合、それを最優先とし、自動取得やキャッシュ参照は不要とする。
- 明示設定の値を自動取得キャッシュとして上書き保存するかどうかは、当面は保存しない方針とする。
- 理由は、ユーザの一時的な override と自動検出結果を分離したいためである。

## facade 方針

### 想定ファイル
- `src/utils/timezoneResolver.ts`
- `src/utils/geoIpClient.ts`
- `src/utils/geoIpProviders/`
- `src/utils/datetimeUtils.ts`

### 責務分離
- `timezoneResolver` はタイムゾーン決定順序全体を扱う。
- `geoIpClient` は GeoIP cache、TTL 判定、外部ソースからの location 取得を扱う。
- `geoIpClient` の内部では、優先順位付き provider 一覧を上から順に試行してよい。
- provider ごとのレスポンス差異は adapter に閉じ込め、`geoIpClient` の外へ漏らさない。
- 日時文字列の生成、ISO 8601 との相互変換、duration 計算は `datetimeUtils` に閉じ込める。
- store への保存・読取は既存 `storeUtils` facade を通す。

## 日時ユーティリティ方針

### 基本方針
- 日時処理ライブラリは当面 `date-fns` を採用する。
- ただし `date-fns` への依存は `datetimeUtils` の内部へ閉じ込める。
- アプリケーションコードから `new Date()`、`Date.now()`、`date-fns` 関数を直接散在させない。
- 将来 `Temporal` や別ライブラリへ差し替える余地を残す。

### `datetimeUtils` の責務
- 現在時刻の取得
- ISO 8601 文字列の生成
- ISO 8601 文字列からの読込
- duration 計算
- TTL ベースの有効期限判定
- 必要に応じた比較や有効期限判定

### 保存形式
- `fetchedAt` の保存形式は ISO 8601 文字列とする。
- `datetimeUtils` は `date-fns` の `formatISO` や `parseISO` 相当を内部で使ってよい。
- epoch ms を内部計算に使うこと自体は許容するが、永続化や共通データ構造では ISO 8601 を優先する。
- 理由は、JSON 保存時の可読性とデバッグ容易性を優先するためである。

## `GeoIpLocation` の共通形式
- adapter は、表記ゆれや値型の差を吸収したうえで、共通形式へ正規化する。
- 必須項目は以下とする。
  - `timezone: string`
  - `country: string`
  - 値は原則として ISO 3166-1 alpha-2 の 2 文字コードに正規化する。
- 任意項目は以下とする。
  - `region?: string`
  - `ip?: string`
  - `city?: string`
  - `latitude?: number`
  - `longitude?: number`
- メタデータ項目は以下とする。
  - `fetchedAt: string`
  - `providerName: string`
  - `providerUrl: string`
  - `rawData: string`
- `fetchedAt` は取得日時を表す ISO 8601 文字列とする。
- `fetchedAt` の生成は `datetimeUtils` を通して行う。
- `rawData` は provider から受け取った生レスポンスを文字列として保持する。
- 初期仕様では `timezone` を主目的とし、`country` は補助情報として必須とする。
- provider ごとに国名と国コードの両方が返りうる場合は、adapter で alpha-2 の 2 文字コードを優先して採用する。
- `region` は取得できれば保持するが、成功判定の必須条件には含めない。
- 必要になれば将来 `GeoIpLocation` に項目を追加してよい。

### `geoIpClient` の公開 API
- `getLocation(options?: { useCache?: boolean }): Promise<GeoIpLocation | undefined>`
- facade 利用側は取得元 URL やレスポンス形式を意識しない。
- provider ごとの優先順位や fallback 判定は facade 内部に閉じ込める。
- `useCache` の既定値は `true` とする。
- `useCache: true` のときは、TTL 内 cache があればそれを返し、期限切れまたは未保存なら再取得する。
- `useCache: false` のときは、cache を参照せず再取得する。
- 再取得成功時は cache を更新する。
- 再取得失敗時は `undefined` を返す。

### `timezoneResolver` の公開 API
- `resolveTimezone(): Promise<string>`

## GeoIP 実装方針

### 初期実装
- 初期候補 provider は複数持てる構成とする。
- 例として以下を優先順位付きで持ってよい。
  - 1. `ipinfo.io`
  - 2. `ipapi.co`
  - 3. `ipwho.is`
  - 4. `ifconfig.co`
  - 5. `ident.me`
  - 6. `cloudflare trace`
- provider ごとに専用 adapter を用意し、レスポンス形式の差異を吸収する。
- HTTP クライアント実装は将来差し替え可能であればよく、`curl` 呼び出しそのものを API 契約にはしない。

### provider adapter 方針
- adapter は provider ごとのレスポンス本文を受け取り、`GeoIpLocation | undefined` に正規化する責務を持つ。
- provider のレスポンスが JSON とは限らない前提で設計する。
- たとえば `timezone` が `time_zone` や `tz` のような別キー名で返る差異は adapter で吸収する。
- 値が string とは限らず object の場合も、adapter 側で必要情報を抽出して正規化する。
- JSON の場合は JSON パース後に必要項目を抽出する。
- JSON でない場合でも、adapter が必要項目を抽出できるなら成功としてよい。
- adapter が必要項目を抽出できない場合は、その provider は失敗として扱う。
- 呼び出し側は provider ごとのキー名、ネスト構造、レスポンス形式の差を知らなくてよい。
- adapter は正規化結果に `providerName`、`providerUrl`、`fetchedAt`、`rawData` を必ず設定する。
- `fetchedAt` は `datetimeUtils` 経由で生成する。

### provider fallback 方針
- provider は優先順位付きリストとして定義する。
- 上位 provider が失敗した場合のみ、次の provider を試す。
- 各 provider の成否判定は adapter が担う。
- 成功条件は以下をすべて満たすこととする。
  - `timezone` を取得できること
  - `country` を取得できること
  - `timezone` が有効な IANA タイムゾーン名であること
  - `fetchedAt`、`providerName`、`providerUrl`、`rawData` を設定できること
- `region` は取得できれば保持するが、成功条件には含めない。
- `ip`、`city`、`latitude`、`longitude` は optional とする。
- 失敗には以下を含む。
  - ネットワーク到達不可
  - タイムアウト
  - 非成功レスポンス
  - adapter が解釈できないレスポンス形式
  - JSON パース失敗
  - JSON 以外のレスポンスで adapter が必要情報を抽出できない
  - `timezone` または `country` の欠落
  - `timezone` が不正値
  - required metadata を構成できない
- optional 項目が欠落しても失敗にはしない。
- ある provider で有効な location 情報が取得できた時点で、その時点の結果を採用し、下位 provider は呼ばない。
- provider ごとの失敗は最終失敗になるまで外へ漏らさず、`geoIpClient` は `undefined` を返してよい。

### provider ごとの位置づけ
- `ipinfo.io`、`ipapi.co`、`ipwho.is`、`ifconfig.co` は現時点の主候補とする。
- `ident.me` は `region` がなくても成功候補になりうる。
- `cloudflare trace` は provider 一覧には含めてよいが、現時点では `timezone` を直接返さないため成功しにくい。
- `cloudflare trace` を成功候補にするには、将来的に `country -> timezone` 補完のような別ルールが必要になる。
- 当面は `cloudflare trace` を実質的な保留候補として扱う。

### facade に閉じ込める内容
- URL
- HTTP 呼び出し方法
- タイムアウト
- provider ごとのレスポンス形式
- JSON / 非 JSON の判定
- パース方法
- キー名の表記ゆれ吸収
- ネストされた値や object 値からの抽出
- `timezone`、`country` 抽出と `country` の alpha-2 正規化
- optional 項目の抽出
- metadata 生成
- provider ごとの優先順位
- provider 追加・削除
- 将来的な別プロバイダへの切り替え

### 非要件
- `region` は当面 optional とし、未取得でも失敗理由にしない。
- 緯度経度や都市名の保持は optional 項目として扱い、存在しない場合に必須化しない。
- provider のヘルスチェックや重み付きルーティングまでは当面扱わない。
- `country -> timezone` 補完ロジックは当面実装しない。
- IP アドレス自体の保存は `rawData` を除き必須としない。

## GeoIP cache 仕様

### 保存先
- 既存の store を使う。
- アプリケーションコードから `conf` を直接触らない。
- キー名は明示的な固定値とする。
- 例: `system.geoip.last`

### 保存値
- キャッシュ保存値は `GeoIpLocation` と同じ構造を基本とする。
- `timezone` は IANA タイムゾーン名とする。
- `fetchedAt` は TTL 判定に使う ISO 8601 文字列とする。
- 当面は `rawData` も保存する。
- `rawData` は将来除外する可能性があるが、当面は provider ごとの想定外データ観測のため保持する。

### 保存タイミング
- GeoIP facade による自動取得が成功したときに保存する。
- TTL 内 cache を再利用しただけでは保存し直さない。
- 明示設定を使ったときは、自動取得キャッシュを更新しない。

### 読み出しタイミング
- `geoIpClient.getLocation({ useCache: true })` の中で参照する。
- キャッシュが存在し、`GeoIpLocation` として解釈可能で、`timezone` が有効な IANA タイムゾーン名であり、かつ TTL 内であればそれを返す。
- TTL を超過したキャッシュは再取得対象として扱う。
- 期限切れ cache があり再取得に失敗した場合は stale cache を返さず、`undefined` を返す。

### キャッシュ TTL
- 通常仕様でのデフォルト TTL は 1 日とする。
- ミリ秒換算では `86_400_000` とする。
- TTL 判定は `fetchedAt + TTL > now` を基準とする。
- 判定ロジックは `datetimeUtils` に集約する。
- 設定値の入力手段は実装で定義してよいが、環境変数 `LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS` での上書きを許容してよい。
- テストでは TTL を `0` または負値に設定してよい。
- TTL が `0` の場合は常に期限切れ扱いとする。
- TTL が負値の場合も期限切れ扱いとし、強制再取得のためのテスト用途に使ってよい。
- 通常運用では負値を前提にしない。

### 将来の duration 利用
- TTL 判定や再取得制御が必要になった場合も、計算は `datetimeUtils` に集約する。
- 呼び出し側で `fetchedAt` を直接パースして duration を計算しない。

## バリデーション方針
- 保存前または利用前に、値が `GeoIpLocation` として解釈可能か、および `timezone` が IANA タイムゾーン名として解釈可能かを確認する。
- 不正な値は cache として使わない。
- 不正キャッシュを検出した場合は削除してよい。
- 判定方法は `Intl.DateTimeFormat` など、Node.js 標準で完結する方法を優先する。

## エラー時の扱い
- GeoIP facade の失敗は致命エラーにしない。
- 例:
  - ネットワーク到達不可
  - タイムアウト
  - レスポンス形式不正
  - `timezone` または `country` の欠落
  - metadata を構成できない
- これらの場合はキャッシュ更新を行わず、次の候補へフォールバックする。
- `when-is-now` 自体は、最終的に実行環境ローカルタイムゾーンで応答できる状態を維持する。

## `when-is-now` への反映方針
- `when-is-now` は直接 `new Date()` と実行環境のローカルタイムゾーンだけに依存しない構成へ寄せる。
- 返却する日時文字列のタイムゾーンは、`timezoneResolver` が解決した値に従う。
- これにより、Docker コンテナの既定タイムゾーンが UTC でも、ユーザ推定タイムゾーンで日時を返せるようにする。
- ただし、最終フォールバックとしては従来どおり実行環境ローカルタイムゾーンを許容する。

## Docker との関係
- Docker 利用時でも、`TZ` 明示設定は引き続き最優先手段として有効とする。
- `TZ` が未設定でも、自動取得とキャッシュによりユーザ期待に近いタイムゾーンを使えるようにする。
- ただしネットワーク制限下では自動取得できない場合があるため、確実性が必要な環境では `TZ` 明示設定を推奨する。
- store 永続化を有効にした Docker 実行では、自動取得した GeoIP cache もコンテナ再作成後に再利用できる。

## プライバシー方針
- 外部問い合わせはタイムゾーン推定のためにのみ使う。
- 将来 `where-are-we` のような位置情報利用機能を見据え、当面は `GeoIpLocation` を store に保存する。
- `rawData` も当面は保存するが、将来除外する可能性がある。
- 将来 README や運用ドキュメントで、外部サービスに問い合わせる可能性があることを明記する余地を残す。

## テスト方針

### 単体テスト
- `timezoneResolver` の単体テストを追加する。
- 少なくとも以下を確認する。
  - 明示設定がある場合はそれを返すこと。
  - GeoIP 取得に成功した場合は `location.timezone` を返すこと。
  - すべての provider が失敗したときにローカルタイムゾーンへフォールバックすること。
  - GeoIP 取得結果の `timezone` が不正なときはローカルタイムゾーンへフォールバックすること。
- `geoIpClient` は HTTP 呼び出しをモックして単体テストする。
- 少なくとも以下を確認する。
  - TTL 内 cache がある場合は provider を呼ばずに返すこと。
  - TTL 切れ cache は再取得し、成功時は cache を更新して返すこと。
  - TTL 切れ cache で再取得に失敗した場合は `undefined` を返すこと。
  - `useCache: false` の場合は cache を見ずに再取得すること。
  - 上位 provider が失敗しても下位 provider で成功すればその値を返すこと。
  - 不正な cache 値を使わず削除すること。
- provider adapter ごとに、表記ゆれや値型の差を吸収して `timezone` と `country` を正規化できることを確認する。
- `country` が最終的に alpha-2 の 2 文字コードへ正規化されることを確認する。
- provider adapter ごとに、optional 項目と metadata を期待どおり構成できることを確認する。
- `region` 欠落は失敗条件ではないことを確認する。
- `datetimeUtils` の単体テストを追加する。
- `datetimeUtils` では、ISO 8601 の生成、読込、duration 計算、TTL 判定が期待どおりであることを確認する。
- TTL デフォルト 1 日、TTL `0`、TTL 負値の挙動を確認する。
- JSON 以外のレスポンス形式でも adapter が必要情報を抽出できる場合だけ成功とし、できない場合は失敗になることを確認する。
- 壊れた JSON、必須項目欠落、不正な `timezone` では例外ではなく `undefined` を返すことを確認する。

### 結合テスト
- `when-is-now` が解決済みタイムゾーンに従って返却することを確認する。
- store 永続化が有効な環境では、初回自動取得後に再起動しても外部取得なしで同じタイムゾーンを使えることを確認する。
- provider 優先順位と fallback の挙動は、実サービスではなくモックまたはスタブで固定的に検証する。
- GeoIP 実サービス依存のテストは不安定になりやすいため、通常の CI ではモックまたはスタブを使う。

## 将来拡張
- GeoIP provider の優先順位設定変更
- GeoIP プロバイダ差し替え
- `rawData` の cache 保存除外
- TTL の設定入力手段拡張
- 最終更新時刻の保存
- 手動再取得用の内部 dev tool 追加
- タイムゾーン以外の locale 情報取得
- `datetimeUtils` の実装を `Temporal` などへ差し替え
- `country -> timezone` 補完ルールの導入

## 受け入れ条件
- タイムゾーン決定ロジックが 1 箇所に集約されていること。
- GeoIP の取得元詳細と provider ごとのレスポンス差異が facade の外に漏れていないこと。
- provider 成功条件が `timezone` と `country` の取得で定義されていること。
- provider adapter がキー名の表記ゆれや値型の差を吸収できること。
- `GeoIpLocation` に optional 項目と metadata を保持できること。
- `fetchedAt` が ISO 8601 文字列として統一されていること。
- 日時生成や duration 計算、TTL 判定が `datetimeUtils` に集約されていること。
- デフォルト TTL 1 日が仕様として定義され、テストでは `0` や負値を使えること。
- 自動取得に成功した `GeoIpLocation` を store に保存できること。
- 次回以降は GeoIP cache を優先し、外部取得なしでも同じタイムゾーンを使えること。
- 自動取得に失敗しても `when-is-now` が利用不能にならないこと。
- Docker で store 永続化を有効にした場合、コンテナ再作成後も cache 済み GeoIP location を再利用できること。

## 関連ドキュメント
- `docs/tools/when-is-now.md`
- `docs/store.md`
- `docs/docker.md`
- `docs/testing.md`
