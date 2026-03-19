# when-is-now

## 目的
- AI とユーザが同じ環境にいる前提で、現在日時の文脈を共有するための基本機能。

## 概要
- `when-is-now` は、現在日時を ISO 8601 形式で返す。
- 返却時に使うタイムゾーンは、`timezoneResolver` が解決した値に従う。
- 解決順序は以下とする。
  1. 明示設定された `TZ`
  2. GeoIP cache 付きの `getLocation({ useCache: true })`
  3. サーバ実行環境のローカルタイムゾーン
- UTC 固定ではない。

## 入力
- なし

## 返却方針
- 現在日時を ISO 8601 形式の文字列で返す。
- タイムゾーンのオフセットを含める。
- `content[0].text` と `structuredContent.now` には同じ日時文字列を入れる。
- `structuredContent.timezone` には、解決に使った IANA タイムゾーン名を入れる。

## 返却例
```json
{
  "content": [
    {
      "type": "text",
      "text": "2026-03-18T15:21:00+09:00"
    }
  ],
  "structuredContent": {
    "now": "2026-03-18T15:21:00+09:00",
    "timezone": "Asia/Tokyo"
  }
}
```

## 補足
- タイムゾーン自動取得と cache の詳細は `docs/auto-tz.md` を参照する。
- 確実性が必要な環境では、引き続き `TZ` 明示設定を推奨する。
