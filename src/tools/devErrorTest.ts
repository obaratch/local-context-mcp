import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// JSON-RPC のサーバーエラー用レンジ (-32000 〜 -32099) から、
// テスト用のデフォルトコードとして先頭値を使う。
const DEFAULT_ERROR_CODE = -32000;
const DEFAULT_ERROR_MESSAGE = "Expected test error";

type DevErrorTestParams = {
	code?: number;
	message?: string;
};

/**
 * 開発者向けツール `dev-error-test` のエラーレスポンスを返す。
 *
 * @returns `isError: true` と `structuredContent` に `{ code, message }` を持つ `CallToolResult`
 */
export async function devErrorTest(
	params?: DevErrorTestParams,
): Promise<CallToolResult> {
	const code = params?.code ?? DEFAULT_ERROR_CODE;
	const message = params?.message ?? DEFAULT_ERROR_MESSAGE;

	return {
		content: [{ type: "text", text: `Error ${code}: ${message}` }],
		structuredContent: {
			code,
			message,
		},
		isError: true,
	};
}
