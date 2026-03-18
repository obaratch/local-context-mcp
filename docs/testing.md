# テスト方針
- テストランナーは Vitest を使用する。
- テストコードおよびテスト名は、できるだけ日本語で記述する。
- コード識別子は TypeScript の慣例に従い、関数名や変数名は英語のままでよい。

## 目的
- テストを仕様書として読める状態にする。
- 実装の都合ではなく、期待する振る舞いを日本語で明示する。
- 開発者が失敗時の意図をすぐ理解できるようにする。

## 基本方針
- `describe` にはテスト種別と対象機能や対象ツールを書く。
- `test` には期待する振る舞いを書く。
- `test` の文言は「〜すること」で統一する。
- 1つのテストでは、原則として1つの振る舞いだけを検証する。
- 正常系を先に書き、その後に境界値や異常系を書く。

## 配置ルール
- テストファイルは `tests/` 配下に配置する。
- ツール単位のテストは `tests/tools/` 配下に配置する。
- stdio/jsonrpc 経由の結合テストは `tests/integration/` 配下に配置する。
- ファイル名は対象実装または機能単位に対応させ、`devHelloworld.test.ts` や `server.test.ts` のように命名する。
- 単体テストは `tests/` 配下から `src/` の実装を import して検証する。
- 結合テストは `src/` を直接 import せず、`dist/index.js` を実際に起動して検証する。

## テスト種別
- 単体テストは、ツールや関数を `src/` から直接 import して振る舞いを検証する。
- 結合テストは、`dist/index.js` を実際に起動し、stdio/jsonrpc 経由で MCP サーバとしての振る舞いを検証する。
- 結合テストでは `@modelcontextprotocol/sdk` の `Client` と `StdioClientTransport` を使って `dist/index.js` に接続する。
- 結合テストの最小シナリオは `initialize(connect)` → `ping` → `tools/list` とする。
- 結合テストでは、少なくとも `initialize`、`listTools`、`callTool` を通して主要な機能を確認する。

## 実行方法
- 単体テストは `npm run test:unit` で実行する。
- 結合テストは `npm run test:integration` で実行する。
- `npm run test` では `run-s` を使って `test:unit` と `test:integration` を順に実行する。
- 結合テストは `dist/index.js` を対象にするため、`npm run test:integration` の中で事前に `npm run build` を実行する。

## 命名規約
- 単体テストの `describe` は `describe("単体: dev-helloworld", ...)` のように、テスト種別を先頭に付けて対象を明示する。
- 結合テストの `describe` は `describe("結合: dev-helloworld", ...)` や `describe("結合: サーバ起動", ...)` のように、テスト種別を先頭に付けて対象を明示する。
- `test("メインメッセージとして hello world を返すこと", ...)` のように、期待値をそのまま書く。
- 入力条件がある場合は、必要なら `test("不要な入力があってもメインメッセージとして hello world を返すこと", ...)` のように条件を含める。
- 英語の直訳よりも、仕様として自然に読める日本語を優先する。

## 例

### 単体テスト `tests/tools/devHelloworld.test.ts`
```ts
import { describe, expect, test } from "vitest";
import { devHelloworld } from "../../src/tools/devHelloworld.js";

describe("単体: dev-helloworld", () => {
  test("メインメッセージとして hello world を返すこと", async () => {
    const result = await devHelloworld();
    expect(result.content[0]).toEqual({ type: "text", text: "hello world" });
  });

  test("不要な入力があってもメインメッセージとして hello world を返すこと", async () => {
    const result = await devHelloworld({ any: "value" } as never);
    expect(result.content[0]).toEqual({ type: "text", text: "hello world" });
  });
});
```

### 結合テスト `tests/integration/server.test.ts` を参照

## 補足
- `describe` や `test` の説明文は日本語にする。
- `expect` の matcher は Vitest 標準のものを使用する。
- 実装詳細ではなく、利用者から見た振る舞いを優先して検証する。
- スナップショットテストを導入する場合も、テスト名は日本語で記述する。
