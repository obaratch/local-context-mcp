# local-context-mcp

`local-context-mcp` は、MCP サーバ実装の習作として作ったミニプロジェクトです。
AIとユーザが同じ環境にいる前提で、現在の文脈を共有するために便利、かもしれない、機能を提供します。

## 機能説明
- ローカルで動く MCP サーバ
- AIとユーザが同じ場所にある前提で、現在日時を共有するための tool を提供

### `when-is-now`
- 現在日時(ISO 8601形式)を返します
- タイムゾーンはサーバ実行環境のローカルタイムゾーンに従う
- 詳細は [`docs/tools/when-is-now.md`](docs/tools/when-is-now.md) を参照

## 開発者向け

詳細は package.json や AGENTS.md を参照。
以下は公開向け機能ではなく、開発やテストのための tools

### `dev-helloworld`

- メッセージ `hello world` を返すだけ

### `dev-error-test`

- 結合テスト用の tool
- MCP の tool error result を返す挙動を確認
- 詳細は [`docs/tools/dev-error-test.md`](docs/tools/dev-error-test.md) を参照

## LM Studio から Docker で使う

詳細仕様は [`docs/docker.md`](docs/docker.md) を参照。

### 事前準備
- Docker イメージをビルドする

```bash
npm run docker:build
```

### 設定例
- LM Studio の MCP サーバ設定に以下を追加する
- `when-is-now` はサーバ実行環境のローカルタイムゾーンを返すため、`TZ` は明示する

```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm", 
        "-e",
        "TZ=Asia/Tokyo",
        "obaratch/local-context-mcp-server"
      ]
    }
  }
}
```

### 確認
- 接続後に `tools/list` で以下のツールが見えること
  - `when-is-now`
  - `dev-helloworld`
  - `dev-error-test`
