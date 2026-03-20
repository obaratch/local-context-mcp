# リポジトリ ガイドライン

## 前提
- 日本語を主言語とする。応答やコメント、ドキュメント等はすべて日本語で。
- この AGENTS.md は起点でありTOC。詳細は docs/ 内の各種文書を参照。
- 仕様 → 実装 → 説明文書作成 という流れが基本であり、AGENTS.md → docs/ 内の各種仕様 → テストコード → 実装 → ビルド成果物 → README の順で整える。

## プロジェクト概要
- AIが自分とユーザの状況を確認・共有するための Local Context MCP
- MCPサーバ名 "local-context"

### 基本機能 (tools)
- "when-is-now": 現在日時を返す。[詳細](docs/tools/when-is-now.md)
- "where-are-we": GeoIP 由来の大まかな場所文字列を返す。[詳細](docs/tools/where-are-we.md)

### 開発者向け機能 (tools)
- "dev-helloworld": メッセージ "hello world" を返す
- "dev-error-test": 結合テスト用。MCP仕様に沿ったエラーを返す。[詳細](docs/tools/dev-error-test.md)
- "dev-store-set": 結合テスト用。キーに JSON 値を保存する。[詳細](docs/store.md)
- "dev-store-get": 結合テスト用。キーに保存された JSON 値を取得する。[詳細](docs/store.md)
- `dev-*` 系は内部向け機能として扱い、README の一般利用者向け説明には載せない。

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
- 単体テスト・結合テストを追加または変更する場合は、原則として先にテストを書き、期待どおり all red になることを確認してから実装に入る。
- 実装中にテストを追加・更新しながら進めてもよいが、少なくとも最初の失敗確認は明示的に行う。
- `dev-*` 系や store 確認用 tool のような内部機能は、README ではなく `docs/dev-mode.md` や `docs/testing.md` に記述する。
- ソースを修正して保存したら、必ず `npm run format` と `npm run lint` を実行する。
- push する前に README.md と README.en.md に齟齬がないか確認する。

## 参照
- [コーディング方針](docs/coding.md)
- [技術スタック](docs/tech-stack.md)
- [Lint](docs/linting.md)
- [テスト](docs/testing.md)
- [Docker 利用仕様](docs/docker.md)
- [開発モード仕様](docs/dev-mode.md)
- [ストア仕様](docs/store.md)
