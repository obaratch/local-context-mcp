# リポジトリ ガイドライン

## 前提
- 日本語を主言語とする。応答やコメント、ドキュメント等はすべて日本語で。
- この AGENTS.md は起点でありTOC。詳細は docs/ 内の各種文書を参照。

## プロジェクト概要
- AIが自分とユーザの状況を確認・共有するための Local Context MCP
- MCPサーバ名 "local-context"

### 基本機能 (tools)
- "when-is-now": 現在日時を返す。[詳細](docs/tools/when-is-now.md)

### 開発者向け機能 (tools)
- "dev-helloworld": メッセージ "hello world" を返す
- "dev-error-test": 結合テスト用。MCP仕様に沿ったエラーを返す。[詳細](docs/tools/dev-error-test.md)

## コマンド
- 開発起動: `npm run dev`
- ビルド: `npm run build`
- Docker イメージビルド: `npm run docker:build`
- テスト: `npm test`
- format: `npm run format`
- lint: `npm run lint`

## 開発ルール
- 配布用エントリポイントは `dist/index.js` を使用する。
- 開発時は `tsx` で `src/index.ts` を直接実行する。
- ソースを修正して保存したら、必ず `npm run format` と `npm run lint` を実行する。

## 参照
- [コーディング方針](docs/coding.md)
- [技術スタック](docs/tech-stack.md)
- [Lint](docs/linting.md)
- [テスト](docs/testing.md)
- [Docker 利用仕様](docs/docker.md)
- [開発モード仕様](docs/dev-mode.md)
- [ストア仕様](docs/store.md)
