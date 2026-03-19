import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const originalTz = process.env.TZ;

type TimezoneResolverModule =
	typeof import("../../src/utils/timezoneResolver.js");

async function loadResolver(): Promise<TimezoneResolverModule> {
	vi.resetModules();
	return import(
		new URL("../../src/utils/timezoneResolver.js", import.meta.url).href
	);
}

beforeEach(() => {
	vi.resetModules();
});

afterEach(async () => {
	if (originalTz === undefined) {
		delete process.env.TZ;
	} else {
		process.env.TZ = originalTz;
	}
	vi.resetModules();
});

describe.sequential("単体: timezoneResolver / 優先順位", () => {
	test("明示設定の TZ がある場合はそれを返すこと", async () => {
		process.env.TZ = "Asia/Tokyo";
		const resolver = await loadResolver();

		const result = await resolver.resolveTimezone({
			geoIpLookup: async () => {
				throw new Error("should not call geoip");
			},
		});

		expect(result).toBe("Asia/Tokyo");
	});

	test("GeoIP 取得に成功した場合は location.timezone を返すこと", async () => {
		delete process.env.TZ;
		const resolver = await loadResolver();

		const result = await resolver.resolveTimezone({
			geoIpLookup: async () => ({
				timezone: "Asia/Tokyo",
				country: "JP",
				fetchedAt: "2026-03-19T12:00:00Z",
				providerName: "test",
				providerUrl: "https://example.test",
				rawData: "raw",
			}),
			fallbackTimeZone: "UTC",
		});

		expect(result).toBe("Asia/Tokyo");
	});

	test("GeoIP 取得結果の timezone が不正な場合は fallbackTimeZone へフォールバックすること", async () => {
		delete process.env.TZ;
		const resolver = await loadResolver();

		const result = await resolver.resolveTimezone({
			geoIpLookup: async () => ({
				timezone: "Invalid/Timezone",
				country: "FR",
				fetchedAt: "2026-03-19T12:00:01Z",
				providerName: "test",
				providerUrl: "https://example.test",
				rawData: "raw",
			}),
			fallbackTimeZone: "UTC",
		});

		expect(result).toBe("UTC");
	});
});

describe.sequential("単体: timezoneResolver / フォールバック", () => {
	test("GeoIP が失敗した場合は fallbackTimeZone へフォールバックすること", async () => {
		delete process.env.TZ;
		const resolver = await loadResolver();

		const result = await resolver.resolveTimezone({
			geoIpLookup: async () => undefined,
			fallbackTimeZone: "UTC",
		});

		expect(result).toBe("UTC");
	});
});
