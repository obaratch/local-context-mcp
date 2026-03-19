# where-are-we

## 目的
- AI とユーザが同じ環境にいる前提で、現在地の大まかな文脈を共有するための基本機能。
- 厳密な測位ではなく、LLM が扱いやすい粗い位置表現を返すことを優先する。

## 概要
- `where-are-we` は、GeoIP 由来の情報から「それっぽい場所文字列」を返す。
- 返す値は厳密でなくてよく、国から都市くらいまでの大まかな粒度を想定する。
- GeoIP 由来の location は取得できない場合がある。
- GeoIP 由来の location は精度が低く、国や都市レベルでも大きく誤る場合がある。
- 例:
  - `Tokyo, Tokyo-to`
  - `Tokyo, JP`
  - `JP, Japan`
  - `Japan`
- GeoIP の取得自体は `when-is-now` のタイムゾーン解決と同じ基盤を使う。
- GeoIP cache も `when-is-now` と共有し、二重取得や別キャッシュは持たない。

## 位置づけ
- この tool は、人間向けの厳密な所在地表示や住所解決を目的としない。
- この tool は、会話文脈共有のための補助情報を返す公開 tool として扱う。
- `structuredContent` には補助的な項目を返してよいが、主目的は `content[0].text` の自然な場所文字列とする。
- MCP クライアントや LLM は、この返却値を推定的な参考情報として扱う。
- 認証、課金、法令対応、地域制御のような厳密判定には使わない。

## 入力
- なし

## 返却方針
- `content[0].text` には、大まかな位置を表す短い文字列を入れる。
- 文字列は厳密な正規化を必須としない。
- 国名、国コード、地域名、都市名のどの表記を使ってもよい。
- 利用可能な情報が多いほど具体的な文字列を優先する。
- 同じ意味なら、自然な見た目を優先してよい。
- `structuredContent.locationText` には `content[0].text` と同じ文字列を入れる。
- `structuredContent` には、生成に使えた元データを補助的に含めてよい。

## 文字列生成方針

### 基本原則
- 返却値は「厳密性」より「それっぽさ」を優先する。
- LLM が読んで場所の文脈をつかめるなら成功としてよい。
- 文字列は 1 つに決め打ちせず、得られた情報量に応じて柔軟に構成してよい。
- location が取れないことや、取れても大きく外れていることを前提に設計する。

### 優先して使う候補
- `city`
- `region`
- `country`

### 構成ルール
- `city` と `region` があれば、`City, Region` を優先してよい。
- `city` があり `region` が使いにくい場合、`City, Country` でもよい。
- `city` がなく `region` と `country` があれば、`Region, Country` でもよい。
- `country` しかなければ、`Country` だけでもよい。
- `country` は alpha-2 コードでも国名でもよい。
- `region` は都道府県名、州名、県名、行政区名など、provider が返した値をそのまま使ってよい。
- `city` や `region` の表記ゆれは、そのまま許容する。
- 前後空白は除去して扱う。
- 空文字や空白だけの値は「未取得」とみなして使わない。
- 同じ値が重複する場合は、簡素な表現を優先する。
- `city` と `region` が同じなら `City, Region` は作らず、`City, Country` を優先してよい。
- `region` と `country` が同じなら `Region, Country` は作らず、単独値を優先してよい。
- `city` と `country` が同じなら `City, Country` は作らず、単独値を優先してよい。
- 同値判定は、少なくとも前後空白除去後の完全一致で扱えばよい。
- 区切り文字は `, ` を基本とする。

### 正規化の最小要件
- `city`、`region`、`country` は文字列であっても、そのまま無条件には使わない。
- 値の前後空白を除去したうえで、空になった値は捨てる。
- 組み立て時は、先に具体度の高い候補を試し、重複で不自然になる場合だけ次候補へ落とす。
- provider ごとの細かな地名正規化や翻訳は行わなくてよい。

### 成功条件
- 少なくとも以下のいずれかが文字列として得られれば成功としてよい。
  - `city`
  - `region`
  - `country`
- `timezone` は `where-are-we` 単体の成功条件には含めない。
- ただし実装上の GeoIP 取得基盤は `when-is-now` と共有するため、同じ location object を利用してよい。

## データソース方針
- location の取得には、既存の GeoIP facade を利用する。
- `geoIpClient.getLocation({ useCache: true })` を使い、既存 cache を再利用する。
- `where-are-we` 専用の保存キーや専用 TTL は持たない。
- cache の保存形式、TTL、provider fallback は `docs/auto-tz.md` の方針に従う。

## 共通基盤との関係
- `when-is-now` と `where-are-we` は、同じ GeoIP cache を共有する。
- 一方が先に location を取得した場合、他方は同じ cache を再利用してよい。
- location 取得ロジック、cache 更新、TTL 判定は tool ごとに重複実装しない。
- 位置文字列の組み立てだけを `where-are-we` 側の責務とする。

## 返却例
```json
{
  "content": [
    {
      "type": "text",
      "text": "Tokyo, Tokyo-to"
    }
  ],
  "structuredContent": {
    "locationText": "Tokyo, Tokyo-to",
    "country": "JP",
    "region": "Tokyo-to",
    "city": "Tokyo",
    "timezone": "Asia/Tokyo"
  }
}
```

```json
{
  "content": [
    {
      "type": "text",
      "text": "JP, Japan"
    }
  ],
  "structuredContent": {
    "locationText": "JP, Japan",
    "country": "JP"
  }
}
```

## 失敗時方針
- location をまったく得られなかった場合は、tool error にはせず、曖昧な不明文字列を返してよい。
- 例:
  - `Unknown location`
  - `Somewhere on Earth`
- ただし実装時に別方針を取る場合でも、`when-is-now` の正常動作を妨げないことを優先する。
- 失敗時の固定文言は実装で調整してよいが、会話文脈として破綻しない短い文字列にする。

## 実装メモ
- 文字列組み立ては小さな専用 helper に閉じ込めてよい。
- helper は `GeoIpLocation` の optional 項目欠落を前提に設計する。
- `rawData` や `providerUrl` のような内部メタデータは、返却文字列の生成には必須としない。
- 将来 provider が増えても、adapter 側で `city`、`region`、`country` に正規化されていれば tool 側の仕様は維持できる。

## 非要件
- 緯度経度の返却
- 正確な住所解決
- 郵便番号や行政コードの返却
- 地図サービス連携
- 国コードから国名への厳密変換
- `country -> timezone` の逆引き補完
- 曖昧さのない唯一の地名表現

## 補足
- GeoIP と cache の詳細は `docs/auto-tz.md` を参照する。
- store 永続化の詳細は `docs/store.md` を参照する。
- `where-are-we` は会話補助用であり、認可、課金、法令対応などの厳密な所在地判定には使わない。
