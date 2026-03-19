# local-context-mcp

`local-context-mcp` は、MCP サーバ実装の習作として作ったミニプロジェクトです。
AIとユーザが同じ環境にいる前提で、現在の文脈を共有するために便利、かもしれない、機能を提供します。

## 機能説明
- ローカルで動く MCP サーバ
- AIとユーザが同じ場所にある前提で、現在日時を共有するための tool を提供

### `when-is-now`
- 現在日時(ISO 8601形式)を返します
- タイムゾーンは `TZ`、GeoIP cache 付き自動取得、ローカル環境の順で解決します
- 返却値には解決済みタイムゾーン名も含みます
- auto-tz の詳細は [`docs/auto-tz.md`](docs/auto-tz.md) を参照
- 詳細は [`docs/tools/when-is-now.md`](docs/tools/when-is-now.md) を参照

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

### 確認
- 接続後に `tools/list` で以下のツールが見えること
  - `when-is-now`

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
