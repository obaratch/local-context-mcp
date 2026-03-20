# local-context-mcp

日本語 [English](README.en.md)

`local-context-mcp` は、MCP サーバ実装の習作として作ったミニプロジェクトです。
AIとユーザが同じ環境にいる前提で、現在の文脈を共有するために便利、かもしれない、機能を提供します。

## 機能説明
- ローカルで動く MCP サーバ
- AIとユーザが同じ場所にある前提で、現在日時を共有するための tool を提供
- GeoIP 由来の位置情報は補助用途に限る。取得できない場合があり、取得できても精度は低く、国や都市レベルでも大きく外すことがある

### `when-is-now`
- 現在日時(ISO 8601形式)を返します
- タイムゾーンは `TZ`、GeoIP cache 付き自動取得、ローカル環境の順で解決します
- 返却値には解決済みタイムゾーン名も含みます
- GeoIP ベースの自動取得は失敗しうるうえ、推定結果が大きく外れる場合があります。確実性が必要なら `TZ` を明示設定してください
- auto-tz の詳細は [`docs/auto-tz.md`](docs/auto-tz.md) を参照
- 詳細は [`docs/tools/when-is-now.md`](docs/tools/when-is-now.md) を参照

### `where-are-we`
- GeoIP 由来の情報から、大まかな場所文字列を返します
- 返却値は `Tokyo, Tokyo-to` や `Tokyo, JP` のような、LLM が文脈として扱いやすい粗い表現です
- 位置文字列は `city`、`region`、`country` のうち使える情報を優先して組み立てます
- 空文字や空白だけの値は使わず、重複する値はできるだけ省いて簡素な表現にします
- GeoIP location は取得できない場合があり、取得できても国や都市レベルで大きく外れることがあります
- 詳細は [`docs/tools/where-are-we.md`](docs/tools/where-are-we.md) を参照

## LM Studio から Docker で使う

詳細仕様は [`docs/docker.md`](docs/docker.md) を参照。

### 事前準備
- Docker イメージをビルドする

```bash
npm run docker:build
```

### 設定例
- LM Studio の MCP サーバ設定に以下を追加する

```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "obaratch/local-context-mcp-server"]
    }
  }
}
```

- 必要に応じて `args` に `-e TZ=Asia/Tokyo` を追加して明示設定できる
- auto-tz の GeoIP cache を再利用したい場合は、named volume を追加する
- GeoIP ベースの位置推定やタイムゾーン推定は、MCP クライアント側の現在地を正確に表す保証がない。取得不能や大きな誤判定を前提に扱う

### 確認
- 接続後に `tools/list` で以下のツールが見えること
  - `when-is-now`
  - `where-are-we`

### cache 永続化あり設定例
```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--mount",
        "source=local-context-store,target=/data",
        "obaratch/local-context-mcp-server"
      ]
    }
  }
}
```

- この構成では store と GeoIP cache が named volume `local-context-store` に保存される
- named volume は Docker が管理するため、ホスト側に固定ディレクトリを作らなくてよい
- 詳細は [`docs/docker.md`](docs/docker.md) と [`docs/store.md`](docs/store.md) を参照
