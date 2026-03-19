import { describe, expect, test } from "vitest";
import {
	differenceIsoInMilliseconds,
	formatDateTimeInTimeZone,
	getLocalTimeZone,
	isCacheExpired,
	isValidTtl,
	parseIso,
} from "../../src/utils/datetimeUtils.js";

describe("単体: datetimeUtils", () => {
	test("parseIso は ISO 8601 文字列を Date として読み込めること", () => {
		const result = parseIso("2026-03-19T10:00:00Z");

		expect(result.toISOString()).toBe("2026-03-19T10:00:00.000Z");
	});

	test("differenceIsoInMilliseconds は 2 つの ISO 8601 の差分を返すこと", () => {
		expect(
			differenceIsoInMilliseconds(
				"2026-03-19T10:00:01Z",
				"2026-03-19T10:00:00Z",
			),
		).toBe(1000);
	});

	test("formatDateTimeInTimeZone は指定タイムゾーンの ISO 8601 形式を返すこと", () => {
		const date = new Date("2026-03-18T06:21:00Z");

		expect(formatDateTimeInTimeZone(date, "Asia/Tokyo")).toBe(
			"2026-03-18T15:21:00+09:00",
		);
	});

	test("isCacheExpired はデフォルト TTL 1 日の範囲内では false を返すこと", () => {
		expect(
			isCacheExpired({
				fetchedAt: "2026-03-18T12:00:00Z",
				now: "2026-03-19T11:59:59Z",
				ttlMs: 86_400_000,
			}),
		).toBe(false);
	});

	test("isCacheExpired はデフォルト TTL 1 日を超えたら true を返すこと", () => {
		expect(
			isCacheExpired({
				fetchedAt: "2026-03-18T12:00:00Z",
				now: "2026-03-19T12:00:00Z",
				ttlMs: 86_400_000,
			}),
		).toBe(true);
	});

	test("isCacheExpired は TTL が 0 のとき常に true を返すこと", () => {
		expect(
			isCacheExpired({
				fetchedAt: "2026-03-19T12:00:00Z",
				now: "2026-03-19T12:00:00Z",
				ttlMs: 0,
			}),
		).toBe(true);
	});

	test("isCacheExpired は TTL が負値のとき常に true を返すこと", () => {
		expect(
			isCacheExpired({
				fetchedAt: "2026-03-19T12:00:00Z",
				now: "2026-03-19T12:00:00Z",
				ttlMs: -1,
			}),
		).toBe(true);
	});

	test("isValidTtl は 0 と負値をテスト用途として許容すること", () => {
		expect(isValidTtl(86_400_000)).toBe(true);
		expect(isValidTtl(0)).toBe(true);
		expect(isValidTtl(-1)).toBe(true);
		expect(isValidTtl(Number.NaN)).toBe(false);
	});

	test("getLocalTimeZone はローカルタイムゾーン名を返すこと", () => {
		expect(getLocalTimeZone()).toEqual(expect.any(String));
		expect(getLocalTimeZone().length).toBeGreaterThan(0);
	});
});
