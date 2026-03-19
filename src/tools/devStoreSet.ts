import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { type StoreValue, setValue } from "../utils/storeUtils.js";

type DevStoreSetParams = {
	key: string;
	value: StoreValue;
};

/**
 * 開発者向けツール `dev-store-set` の保存結果を返す。
 *
 * @returns `content[0]` に `stored`、`structuredContent` に `{ key, value }` を持つ `CallToolResult`
 */
export async function devStoreSet(
	params: DevStoreSetParams,
): Promise<CallToolResult> {
	setValue(params.key, params.value);

	return {
		content: [{ type: "text", text: "stored" }],
		structuredContent: {
			key: params.key,
			value: params.value,
		},
	};
}
