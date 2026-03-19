import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { formatDateTimeInTimeZone } from "../utils/datetimeUtils.js";
import { resolveTimezone } from "../utils/timezoneResolver.js";

export { formatDateTimeInTimeZone };

/**
 * 基本機能 `when-is-now` のレスポンスを返す。
 *
 * @returns `content[0]` に解決したタイムゾーンの現在日時文字列を持つ `CallToolResult`
 */
export async function whenIsNow(_params?: unknown): Promise<CallToolResult> {
	const timezone = await resolveTimezone();
	const nowText = formatDateTimeInTimeZone(new Date(), timezone);

	return {
		content: [{ type: "text", text: nowText }],
		structuredContent: {
			now: nowText,
			timezone,
		},
	};
}
