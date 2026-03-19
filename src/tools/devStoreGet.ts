import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getValue } from "../utils/storeUtils.js";

type DevStoreGetParams = {
	key: string;
};

/**
 * 開発者向けツール `dev-store-get` の読取結果を返す。
 *
 * @returns `content[0]` に `found` または `not found`、`structuredContent` に `{ key, found, value? }` を持つ `CallToolResult`
 */
export async function devStoreGet(
	params: DevStoreGetParams,
): Promise<CallToolResult> {
	const value = getValue(params.key);

	if (value === undefined) {
		return {
			content: [{ type: "text", text: "not found" }],
			structuredContent: {
				key: params.key,
				found: false,
			},
		};
	}

	return {
		content: [{ type: "text", text: "found" }],
		structuredContent: {
			key: params.key,
			found: true,
			value,
		},
	};
}
