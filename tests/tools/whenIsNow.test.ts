import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../src/utils/timezoneResolver.js", () => ({
	resolveTimezone: vi.fn(),
}));

import {
	formatDateTimeInTimeZone,
	whenIsNow,
} from "../../src/tools/whenIsNow.js";
import { resolveTimezone } from "../../src/utils/timezoneResolver.js";

const resolveTimezoneMock = vi.mocked(resolveTimezone);

describe("単体: when-is-now", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-18T06:21:00Z"));
		resolveTimezoneMock.mockReset();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	test("解決したタイムゾーンの現在日時を ISO 8601 形式の文字列で返すこと", async () => {
		resolveTimezoneMock.mockResolvedValue("Asia/Tokyo");
		const result = await whenIsNow();
		const content = result.content[0];

		expect(content).toEqual({
			type: "text",
			text: "2026-03-18T15:21:00+09:00",
		});
		expect(result.structuredContent).toEqual({
			now: "2026-03-18T15:21:00+09:00",
			timezone: "Asia/Tokyo",
		});
	});

	test("formatDateTimeInTimeZone は指定タイムゾーンのオフセット付き文字列を返すこと", () => {
		const date = new Date("2026-03-18T06:21:00Z");

		expect(formatDateTimeInTimeZone(date, "Asia/Tokyo")).toBe(
			"2026-03-18T15:21:00+09:00",
		);
	});
});
