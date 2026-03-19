# コーディング方針

## 基本方針
- 実装は TypeScript の型情報を前提に、短く読める形を優先する。
- 型注釈で十分に伝わる内容は、コメントで重複させない。
- コメントは実装の逐語説明ではなく、公開面の意図や利用時の期待値を補足するために使う。

## テストファースト方針
- 単体テストと結合テストは、原則として実装前に先に書く。
- 先に書いたテストは、対象機能が未実装または未修正であることに対応した expected red になることを確認してから実装に入る。
- red 確認では、失敗理由が想定どおりであることを重視する。無関係な import error やテスト記述ミスが原因なら、先にテスト側を整える。
- 実装中に追加のテストケースを織り交ぜること自体は許容する。ただし、最初の起点になるテストは先に置く。
- 実装後は対象テストを green にし、その後に関連テスト全体を実行して回帰がないことを確認する。

## JSDoc 方針
- ファイル全体の役割を説明するコメントは、`import` 文より前の先頭に置くこと。
- `export` する関数には、必要に応じて JSDoc を付ける。
- private 関数やローカル関数には、原則として JSDoc を付けない。
- JSDoc は「何をするか」を 1 行で書き、その下で必要なタグを足す。
- TypeScript のシグネチャで分かる型情報は繰り返しすぎない。
- `@returns` には戻り値の型名だけでなく、利用者が把握したい返却構造の要点を書く。

## JSDoc 例
```ts
/**
 * 開発者向けツール `dev-helloworld` のレスポンスを返す。
 *
 * @returns `content[0]` に `{ type: "text", text: "hello world" }` を持つ `CallToolResult`
 */
export async function devHelloworld(
	_params?: unknown,
): Promise<CallToolResult> {
	return {
		content: [{ type: "text", text: "hello world" }],
	};
}
```
