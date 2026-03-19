import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../src/utils/geoIpClient.js", () => ({
	getLocation: vi.fn(),
}));

import { buildLocationText, whereAreWe } from "../../src/tools/whereAreWe.js";
import { getLocation } from "../../src/utils/geoIpClient.js";

const getLocationMock = vi.mocked(getLocation);

describe("単体: where-are-we / buildLocationText", () => {
	test("city と region がある場合は City, Region を返すこと", () => {
		expect(
			buildLocationText({
				city: "Tokyo",
				region: "Tokyo-to",
				country: "JP",
			}),
		).toBe("Tokyo, Tokyo-to");
	});

	test("city があり region がない場合は City, Country を返すこと", () => {
		expect(
			buildLocationText({
				city: "Tokyo",
				country: "JP",
			}),
		).toBe("Tokyo, JP");
	});

	test("city がなく region と country がある場合は Region, Country を返すこと", () => {
		expect(
			buildLocationText({
				region: "Tokyo-to",
				country: "JP",
			}),
		).toBe("Tokyo-to, JP");
	});

	test("country しかない場合は Country を返すこと", () => {
		expect(
			buildLocationText({
				country: "JP",
			}),
		).toBe("JP");
	});

	test("前後空白を除去して組み立てること", () => {
		expect(
			buildLocationText({
				city: "  Tokyo  ",
				region: "  Tokyo-to ",
				country: " JP ",
			}),
		).toBe("Tokyo, Tokyo-to");
	});

	test("空文字や空白だけの値は未取得として扱うこと", () => {
		expect(
			buildLocationText({
				city: "   ",
				region: "",
				country: "JP",
			}),
		).toBe("JP");
	});

	test("city と region が同じ場合は city と country を優先すること", () => {
		expect(
			buildLocationText({
				city: "Tokyo",
				region: "Tokyo",
				country: "JP",
			}),
		).toBe("Tokyo, JP");
	});

	test("city と region が同じで country も同じ場合は単独値を返すこと", () => {
		expect(
			buildLocationText({
				city: "Tokyo",
				region: "Tokyo",
				country: "Tokyo",
			}),
		).toBe("Tokyo");
	});

	test("region と country が同じ場合は単独値を返すこと", () => {
		expect(
			buildLocationText({
				region: "Tokyo",
				country: "Tokyo",
			}),
		).toBe("Tokyo");
	});

	test("location をまったく使えない場合は Unknown location を返すこと", () => {
		expect(buildLocationText()).toBe("Unknown location");
	});
});

describe("単体: where-are-we", () => {
	beforeEach(() => {
		getLocationMock.mockReset();
	});

	test("GeoIP location から大まかな場所文字列を返すこと", async () => {
		getLocationMock.mockResolvedValue({
			timezone: "Asia/Tokyo",
			country: "JP",
			region: "Tokyo-to",
			city: "Tokyo",
			fetchedAt: "2026-03-19T12:00:00Z",
			providerName: "test-provider",
			providerUrl: "https://provider.example.test",
			rawData: '{"country":"JP"}',
		});

		const result = await whereAreWe();

		expect(getLocationMock).toHaveBeenCalledWith({ useCache: true });
		expect(result).toEqual({
			content: [{ type: "text", text: "Tokyo, Tokyo-to" }],
			structuredContent: {
				locationText: "Tokyo, Tokyo-to",
				country: "JP",
				region: "Tokyo-to",
				city: "Tokyo",
				timezone: "Asia/Tokyo",
			},
		});
	});

	test("GeoIP location を取得できない場合は Unknown location を返すこと", async () => {
		getLocationMock.mockResolvedValue(undefined);

		const result = await whereAreWe();

		expect(getLocationMock).toHaveBeenCalledWith({ useCache: true });
		expect(result).toEqual({
			content: [{ type: "text", text: "Unknown location" }],
			structuredContent: {
				locationText: "Unknown location",
			},
		});
	});
});
