import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

function formatLocalOffset(date: Date): string {
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes >= 0 ? "+" : "-";
	const absoluteMinutes = Math.abs(offsetMinutes);
	const hours = Math.floor(absoluteMinutes / 60);
	const minutes = absoluteMinutes % 60;

	return `${sign}${pad(hours)}:${pad(minutes)}`;
}

export function formatLocalDateTime(date: Date): string {
	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const seconds = pad(date.getSeconds());
	const offset = formatLocalOffset(date);

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

/**
 * 基本機能 `when-is-now` のレスポンスを返す。
 *
 * @returns `content[0]` にローカルタイムゾーンの現在日時文字列を持つ `CallToolResult`
 */
export async function whenIsNow(_params?: unknown): Promise<CallToolResult> {
	const nowText = formatLocalDateTime(new Date());

	return {
		content: [{ type: "text", text: nowText }],
		structuredContent: {
			now: nowText,
		},
	};
}
