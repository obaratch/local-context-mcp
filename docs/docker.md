# Docker 利用仕様

## 目的
- `local-context` を Docker コンテナとして起動し、MCP クライアントから `docker run` 経由で利用できるようにする。
- 通信方式は既存実装と同じく `stdio` を使い、HTTP や独自ポートは使わない。
- 配布用エントリポイントは `dist/index.js` を使用する。

## 想定する利用形
- MCP クライアントは `docker` コマンドを使ってコンテナを直接起動する。
- MCP の JSON-RPC メッセージは、クライアントとコンテナの標準入出力をそのまま接続してやり取りする。

### 設定例
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

## Docker ランタイム仕様

### 起動コマンド
- コンテナ内では `node dist/index.js` を起動する。

### 通信方式
- `stdin` と `stdout` を MCP の `stdio` transport に使用する。
- `stdout` には MCP プロトコル以外のログやデバッグ出力を混ぜない。
- ログやエラー出力が必要な場合は `stderr` を使用する。

### コンテナ実行
- `docker run -i` を前提とする。
- `--rm` により、利用後にコンテナを自動削除する。
- ポート公開は不要とする。
- 使い捨て起動を前提とし、永続プロセス管理はコンテナランタイム側に持ち込まない。

## イメージ仕様

### イメージ名
- イメージ名は `obaratch/local-context-mcp-server` とする。

### ベースイメージ
- Node.js 24 系を使用する。

### イメージ内容
- 配布対象は `dist/` と production dependencies を基本とする。
- 実行に必要な `package.json` と lockfile を含める。
- 開発用ツールやテスト実行にのみ必要な依存は含めない構成を推奨する。

### 実行ユーザ
- 非 root ユーザでの実行を推奨する。

## タイムゾーン方針

### 基本方針
- Docker 版でも `when-is-now` はユーザが期待するローカルタイムゾーンで動作することを重視する。
- そのため、MCP クライアント設定で `TZ` 環境変数をコンテナに渡すことを正式な利用方法とする。

### 理由
- `when-is-now` はサーバ実行環境のローカルタイムゾーンに従う仕様である。
- Docker コンテナは設定しないと UTC で動作する場合があり、ユーザ環境の現在時刻とズレる。
- このサーバは AI とユーザが同じ文脈を共有することを目的にしているため、Docker 利用時もタイムゾーンを明示的に揃える。

### 必須事項
- Docker 経由で利用する場合、`TZ` は必須設定とする。
- 例: `TZ=Asia/Tokyo`

## 公開ツール方針
- Docker で公開する tool の種別は `docs/dev-mode.md` の方針に従う。
- 一般利用向けの Docker 実行では、公開用 tool だけを利用可能とする。
- 実装上は `ENABLE_DEV_TOOLS=true` を渡すことで `dev-*` を有効化できても、その使い方は一般向け仕様に含めない。
- README や通常の利用手順では `dev-*` 有効化を案内しない。

## 受け入れ条件
- `docker run -i --rm -e TZ=Asia/Tokyo obaratch/local-context-mcp-server` で MCP サーバとして起動できること。
- MCP クライアントから `initialize` に成功すること。
- `tools/list` で公開対象のツール一覧を取得できること。
- 一般利用向けの Docker 実行で `dev-*` を前提にしないこと。
- `when-is-now` が ISO 8601 形式かつタイムゾーンオフセット付きの現在日時文字列を返すこと。
- `stdout` に MCP メッセージ以外の不要な出力が混入しないこと。
- コンテナ終了後に不要なプロセスや一時リソースを残さないこと。

## 実装状況
- `Dockerfile` は実装済み。
- `.dockerignore` は実装済み。
- README に LM Studio 向け Docker 利用手順を記載済み。
- `npm run docker:build` でイメージをビルドできる。

## 関連ドキュメント
- `docs/dev-mode.md`
- `docs/testing.md`

## 今後の検討項目
- Docker 経由の結合テストを追加する。
