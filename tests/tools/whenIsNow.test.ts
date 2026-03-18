import { describe, expect, test } from "vitest";
import { formatLocalDateTime, whenIsNow } from "../../src/tools/whenIsNow.js";

describe("単体: when-is-now", () => {
	test("ローカルタイムゾーンの現在日時を ISO 8601 形式の文字列で返すこと", async () => {
		const result = await whenIsNow();
		const content = result.content[0];

		expect(content).toEqual({
			type: "text",
			text: expect.stringMatching(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
			),
		});
		expect(result.structuredContent).toEqual({
			now: content.text,
		});
		const actualOffset = content.text.slice(-6);
		const expectedOffset = formatLocalDateTime(new Date()).slice(-6);
		expect(actualOffset).toBe(expectedOffset);
	});

	test("formatLocalDateTime はローカルタイムゾーンのオフセット付き文字列を返すこと", () => {
		const date = new Date(2026, 2, 18, 15, 21, 0);

		expect(formatLocalDateTime(date)).toMatch(
			/^2026-03-18T15:21:00[+-]\d{2}:\d{2}$/,
		);
	});
});
