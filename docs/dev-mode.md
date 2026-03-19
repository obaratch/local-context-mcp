# 開発モード仕様

## 目的
- `dev-*` 系 tool を一般利用向けの公開面から分離する。
- 開発、デバッグ、結合テストのための機能だけを明示的に有効化できるようにする。
- ストア確認用のような内部向け tool を追加しても、通常利用者に見えない状態を保つ。

## 基本方針
- tool 登録は公開用と開発用に分離する。
- 公開用 tool は常に登録する。
- 開発用 tool は `ENABLE_DEV_TOOLS=true` のときだけ登録する。
- `ENABLE_DEV_TOOLS` 未設定時の既定値は `false` 相当とする。

## 環境変数

### `ENABLE_DEV_TOOLS`
- 型は文字列とする。
- `"true"` のときだけ開発用 tool を有効化する。
- `"true"` 以外の値、および未設定はすべて無効として扱う。

### 例
- 有効: `ENABLE_DEV_TOOLS=true`
- 無効: 未設定
- 無効: `ENABLE_DEV_TOOLS=false`
- 無効: `ENABLE_DEV_TOOLS=1`

## 登録関数の責務

### 想定構成
- `registerPublicTools(server)`
- `registerDevTools(server)`
- `registerTools(server)`

### `registerPublicTools(server)`
- 一般利用者に公開する tool だけを登録する。
- 環境変数の値に依存しない。
- 例: `when-is-now`

### `registerDevTools(server)`
- `dev-*` 系 tool だけを登録する。
- 開発、デバッグ、結合テストのための tool をここに集約する。
- 例: `dev-helloworld`、`dev-error-test`、今後追加する `dev-store-*`

### `registerTools(server)`
- `registerPublicTools(server)` を常に呼ぶ。
- `process.env.ENABLE_DEV_TOOLS === "true"` の場合のみ `registerDevTools(server)` を呼ぶ。
- tool の公開判定ロジックはこの関数に集約する。

## 公開ルール
- `dev-*` 系 tool は一般利用向け仕様に含めない。
- `tools/list` に `dev-*` が出るのは `ENABLE_DEV_TOOLS=true` のときだけとする。
- README や一般利用者向け設定例では、`ENABLE_DEV_TOOLS` を前提にしない。
- 開発者向けドキュメントや結合テスト仕様では、必要に応じて明示的に有効化する。

## Docker での扱い
- 一般利用向けの Docker 実行では `ENABLE_DEV_TOOLS` を渡さない。
- Docker から起動した場合でも、実装上は `ENABLE_DEV_TOOLS=true` を渡せば `dev-*` を有効化できる。
- ただしその使い方は一般向け仕様、README、通常の結合テスト対象には含めない。
- `dev-*` の有効化を正式に扱うのは、Node.js から直接サーバを起動する開発・テスト用途とする。

## テスト方針
- 結合テストでは、少なくとも以下の 2 パターンを Node.js 直接起動で確認する。
1. `ENABLE_DEV_TOOLS=true` の場合は `dev-*` が見えること。
2. `ENABLE_DEV_TOOLS` 未設定または `"true"` 以外の場合は `dev-*` が見えないこと。
- Docker 起動時の `ENABLE_DEV_TOOLS=true` は隠し機能として扱い、通常の結合テスト対象には含めない。
- ストア永続化テストなど、内部向け tool を使うテストは Node.js 直接起動で明示的に有効化する。

## 受け入れ条件
- Node.js から直接起動し、`ENABLE_DEV_TOOLS=true` のときだけ `dev-*` が公開されること。
- Node.js から直接起動し、`ENABLE_DEV_TOOLS` 未設定時に `dev-*` が公開されないこと。
- Docker 起動時の `ENABLE_DEV_TOOLS=true` は正式仕様に含めないことが文書化されていること。
- 公開用 tool は `ENABLE_DEV_TOOLS` の有無にかかわらず利用できること。
- `dev-*` の追加時に、公開制御ロジックを各 tool 個別で重複実装しなくてよいこと。

## 関連ドキュメント
- `docs/docker.md`
- `docs/store.md`
- `docs/testing.md`
