import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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
