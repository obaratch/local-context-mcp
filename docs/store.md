# ストア仕様

## 目的
- `conf` ライブラリを使い、サーバの再起動後も key-value データを保持できるようにする。
- 値の型は不自然に絞り込まず、JSON として自然に表現できる範囲をそのまま扱う。
- 特に Docker 利用時に、コンテナの作り直しや再起動でデータが失われないことを重視する。

## 位置づけ
- ストアは内部実装用の補助機能として導入する。
- アプリケーションコードからは `conf` を直接触らず、`storeUtils` 相当の facade を経由して利用する。
- 永続化層の差し替えや保存先の制御は facade 側に閉じ込める。
- auto-tz の GeoIP cache も同じストアを利用するため、store 永続化を有効にすると GeoIP 取得結果も再利用される。

## 保存対象
- キーは `string` とする。
- キー中の `.` はパス区切りとして解釈せず、文字列キーの一部として扱う。
- 値は JSON として自然に表現できる値とする。
- 最低限サポートする値は以下とする。
  - `string`
  - `number`
  - `boolean`
  - `string[]`
  - `number[]`
  - `boolean[]`
- 当面は object の活用を前提にしないが、`conf` と facade の設計上は JSON 値を保存できる構成にしておく。
- 未保存キーの読み出し結果は `undefined` とする。

## facade 方針

### 想定ファイル
- `src/utils/storeUtils.ts`

### 型方針
- facade では JSON 値を表す共通型を定義する。
- `StoreValue` は `JsonValue` とする。
- 例:
  - `type JsonPrimitive = string | number | boolean | null`
  - `type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }`
  - `type StoreValue = JsonValue`
- 現時点で主に使うのは primitive と primitive 配列だが、facade と tool の入出力は JSON として自然な値をそのまま扱える構成にする。
- API は primitive ごとの専用メソッドに分けすぎない。

### 公開 API
- `getValue(key: string): StoreValue | undefined`
- `setValue(key: string, value: StoreValue): void`
- `deleteKey(key: string): void`
- テスト専用 export として `resetStoreForTest(): void` を持ってよい。
- 必要であれば実装補助として型ガードを別 export する。

### API ルール
- facade は `conf` インスタンスを内部に 1 つだけ持つ。
- 呼び出し側は保存先のパスや `conf` のオプションを意識しない。
- `getValue` は保存された JSON 値をそのまま返す。
- `setValue` は JSON として保存可能な値だけを受け付ける。
- 型ごとの `getString` / `setNumber` のような専用メソッドは、現時点では設けない。
- 呼び出し側で型を絞りたい場合は、利用箇所ごとに型ガードで扱う。
- キーが不正な場合の扱いは `conf` に委ねるが、アプリ側では空文字キーを使わない。
- `resetStoreForTest` は単体テストからシングルトン状態を初期化するための補助であり、本番利用の API とはみなさない。

## `conf` 利用方針
- `conf` はこのプロジェクト専用の名前空間で初期化する。
- 保存ファイル名は固定にし、実装ごとにぶれないようにする。
- Docker で保存先を外部ボリュームに向けられるよう、保存ディレクトリは環境変数で上書き可能にする。

### 推奨設定
- `projectName`: `local-context-mcp`
- `configName`: `store`
- `cwd`: `process.env.LOCAL_CONTEXT_STORE_DIR ?? undefined`

### 保存先の考え方
- ローカル実行では `LOCAL_CONTEXT_STORE_DIR` 未設定なら、`conf` の標準保存先を使う。
- Docker 実行では、イメージ既定の `LOCAL_CONTEXT_STORE_DIR=/data` を使い、`/data` にボリュームをマウントする。
- これにより、コンテナ自体を削除してもボリューム上の保存データを再利用できる。
- 現在の設定では保存ファイル名は `store.json` になり、内容は JSON テキストとして保存される。

## Docker 永続化方針

### 目的
- `docker run --rm` の使い捨て起動でも、保存データだけはコンテナ外に残す。

### ランタイム要件
- Docker イメージは `LOCAL_CONTEXT_STORE_DIR=/data` を既定で持つ。
- `/data` は named volume または bind mount でホスト側に接続する。
- ストア永続化を使う実行例では、`--rm` の有無にかかわらずボリューム指定を必須とする。
- 利用者が保存先を変えたい場合だけ、`LOCAL_CONTEXT_STORE_DIR` を明示 override してよい。

### 実行例
```bash
docker run -i --rm \
  -e TZ=Asia/Tokyo \
  --mount source=local-context-store,target=/data \
  obaratch/local-context-mcp-server
```

```bash
docker run -i --rm \
  -e TZ=Asia/Tokyo \
  -v "$(pwd)/data:/data" \
  obaratch/local-context-mcp-server
```

- bind mount を使う場合、実行後は `[project-root]/data/store.json` を直接確認できる。
- `store.json` はバイナリではなく JSON テキストファイルである。

### 非要件
- コンテナ内の一時ファイルシステムだけでの永続化は保証しない。
- 複数コンテナからの同時書き込み整合性までは当面扱わない。

## テスト方針

### 単体テスト
- `storeUtils` の単体テストを追加する。
- テストごとに専用ディレクトリを使い、保存と再読込を検証する。
- `string`、`number`、`boolean`、配列を保存して、そのまま読めることを確認する。
- `deleteKey` で値が消えることを確認する。
- 型絞り込み用の型ガードを用意する場合は、その判定もテストする。

### 結合テスト
- 既存の `dist/index.js` 直接起動テストに加え、Docker イメージ経由の結合テストを追加する。
- 目的は「MCP 経由で保存した値が、コンテナを作り直しても読めること」の確認に置く。

### Docker 結合テストの前提
- テストでは専用 Docker イメージをビルドする。
- テストでは `[project-root]/data/` 配下の専用ディレクトリを bind mount して使う。
- Docker イメージ既定の `LOCAL_CONTEXT_STORE_DIR=/data` をそのまま使う。
- ストア操作を MCP 越しに確認するため、開発者向けのテスト用 tool を用意する。

### テスト用 tool 方針
- 公開用途ではなく結合テスト専用として `dev-*` 系にストア確認用 tool を追加する。
- `dev-*` の公開制御は `docs/dev-mode.md` の方針に従う。
- 最小構成は以下のいずれかとする。
  - `dev-store-set`: キーと JSON 値を受け取り保存する。
  - `dev-store-get`: キーを受け取り値を返す。
- 既存の `dev-*` と同様に、一般向け機能とは分離して扱う。

### テスト用 tool のレスポンス方針
- `dev-store-*` は `content` と `structuredContent` を返す。
- 機械可読な主データは `structuredContent` を正とし、`content` は短い補助メッセージにとどめる。
- `content` に JSON 文字列全体を埋め込むことは前提にしない。

#### `dev-store-set`
- 入力:
  - `key: string`
  - `value: JsonValue`
- 出力:
  - `content[0].text`: `stored`
  - `structuredContent`:
    - `key: string`
    - `value: JsonValue`

#### `dev-store-get`
- 入力:
  - `key: string`
- 出力:
  - `content[0].text`: `found` または `not found`
  - `structuredContent`:
    - `key: string`
    - `found: boolean`
    - `value?: JsonValue`
- 未保存キーは `value: undefined` をそのまま返さず、`found: false` で表現する。
- 保存済みキーは `found: true` と `value` を返す。

### Docker 結合テストの最小シナリオ
1. テスト専用ディレクトリを `[project-root]/data/` 配下に作成する。
2. そのディレクトリを `/data` に bind mount したコンテナ A を起動する。
3. MCP 経由で `dev-store-set` を呼び、値を保存する。
4. コンテナ A を終了し、同じディレクトリを使ってコンテナ B を起動する。
5. MCP 経由で `dev-store-get` を呼び、保存した値を取得できることを確認する。
6. テスト終了後も保存ファイルを確認できるよう、必要ならディレクトリを残す。

### 受け入れ条件
- `storeUtils` 経由で JSON として自然な値を保存・読取できること。
- 少なくとも `string`、`number`、`boolean`、primitive 配列を保存・読取できること。
- サーバ再起動後も同一保存先で値を読めること。
- Docker で同一 bind mount 先を再利用した場合、別コンテナでも同じ値を読めること。
- ボリュームを使わない Docker 実行では永続化保証の対象外であることが文書化されていること。

## 関連ドキュメント
- `docs/auto-tz.md`
- `docs/dev-mode.md`
- `docs/docker.md`
- `docs/testing.md`
