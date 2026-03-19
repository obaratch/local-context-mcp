import { describe, expect, test } from "vitest";
import { cloudflareTraceAdapter } from "../../src/utils/geoIpProviders/cloudflareTraceAdapter.js";
import { identMeAdapter } from "../../src/utils/geoIpProviders/identMeAdapter.js";
import { ifconfigAdapter } from "../../src/utils/geoIpProviders/ifconfigAdapter.js";
import { ipapiAdapter } from "../../src/utils/geoIpProviders/ipapiAdapter.js";
import { ipinfoAdapter } from "../../src/utils/geoIpProviders/ipinfoAdapter.js";
import { ipwhoisAdapter } from "../../src/utils/geoIpProviders/ipwhoisAdapter.js";
import type { GeoIpLocation } from "../../src/utils/geoIpProviders/types.js";
import {
	cloudflareTraceRawResponse,
	identMeRawResponse,
	ifconfigRawResponse,
	ipapiRawResponse,
	ipinfoRawResponse,
	ipwhoisRawResponse,
} from "../fixtures/geoIpResponses.js";

function expectCommonMetadata(
	result: GeoIpLocation,
	providerName: string,
	providerUrl: string,
	rawData: string,
): void {
	expect(result.providerName).toBe(providerName);
	expect(result.providerUrl).toBe(providerUrl);
	expect(result.rawData).toBe(rawData);
	expect(result.fetchedAt).toMatch(
		/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
	);
}

describe("単体: GeoIP provider adapter", () => {
	test("ipinfo adapter は loc を分解して共通形式へ正規化すること", () => {
		const result = ipinfoAdapter.parse(ipinfoRawResponse);

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			region: "Metro State",
			ip: "111.222.333.444",
			city: "Central City",
			latitude: 35.6895,
			longitude: 139.6917,
			fetchedAt: expect.any(String),
			providerName: "ipinfo",
			providerUrl: "https://ipinfo.io",
			rawData: ipinfoRawResponse,
		});
		expectCommonMetadata(
			result as GeoIpLocation,
			"ipinfo",
			"https://ipinfo.io",
			ipinfoRawResponse,
		);
	});

	test("ipapi adapter は country_code を優先して共通形式へ正規化すること", () => {
		const result = ipapiAdapter.parse(ipapiRawResponse);

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			region: "Metro State",
			ip: "111.222.333.444",
			city: "North District",
			latitude: 35.752,
			longitude: 139.7341,
			fetchedAt: expect.any(String),
			providerName: "ipapi",
			providerUrl: "https://ipapi.co/json/",
			rawData: ipapiRawResponse,
		});
		expectCommonMetadata(
			result as GeoIpLocation,
			"ipapi",
			"https://ipapi.co/json/",
			ipapiRawResponse,
		);
	});

	test("ipwhois adapter は nested timezone.id を読み取って共通形式へ正規化すること", () => {
		const result = ipwhoisAdapter.parse(ipwhoisRawResponse);

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			region: "Metro State",
			ip: "111.222.333.444",
			city: "Central City",
			latitude: 35.6940027,
			longitude: 139.7535951,
			fetchedAt: expect.any(String),
			providerName: "ipwhois",
			providerUrl: "https://ipwho.is",
			rawData: ipwhoisRawResponse,
		});
		expectCommonMetadata(
			result as GeoIpLocation,
			"ipwhois",
			"https://ipwho.is",
			ipwhoisRawResponse,
		);
	});

	test("ifconfig adapter は time_zone と region_name を共通形式へ正規化すること", () => {
		const result = ifconfigAdapter.parse(ifconfigRawResponse);

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			region: "Metro State",
			ip: "111.222.333.444",
			city: "Central City",
			latitude: 35.6837,
			longitude: 139.6805,
			fetchedAt: expect.any(String),
			providerName: "ifconfig",
			providerUrl: "https://ifconfig.co/json",
			rawData: ifconfigRawResponse,
		});
		expectCommonMetadata(
			result as GeoIpLocation,
			"ifconfig",
			"https://ifconfig.co/json",
			ifconfigRawResponse,
		);
	});

	test("ident.me adapter は region が欠落していても共通形式へ正規化すること", () => {
		const result = identMeAdapter.parse(identMeRawResponse);

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			ip: "111.222.333.444",
			city: "Central City",
			latitude: 35.6906,
			longitude: 139.77,
			fetchedAt: expect.any(String),
			providerName: "ident.me",
			providerUrl: "https://ident.me/json",
			rawData: identMeRawResponse,
		});
		expectCommonMetadata(
			result as GeoIpLocation,
			"ident.me",
			"https://ident.me/json",
			identMeRawResponse,
		);
	});

	test("cloudflare trace adapter は timezone と region が欠落しているため undefined を返すこと", () => {
		expect(
			cloudflareTraceAdapter.parse(cloudflareTraceRawResponse),
		).toBeUndefined();
	});

	test("ipinfo adapter は壊れた JSON のとき undefined を返すこと", () => {
		expect(ipinfoAdapter.parse("{broken json")).toBeUndefined();
	});

	test("ipinfo adapter は timezone が欠落しているとき undefined を返すこと", () => {
		const raw = ipinfoRawResponse.replace('  "timezone": "Asia/Tokyo",\n', "");

		expect(ipinfoAdapter.parse(raw)).toBeUndefined();
	});

	test("ipinfo adapter は country が欠落しているとき undefined を返すこと", () => {
		const raw = ipinfoRawResponse.replace('  "country": "JP",\n', "");

		expect(ipinfoAdapter.parse(raw)).toBeUndefined();
	});

	test("ipinfo adapter は timezone が不正値のとき undefined を返すこと", () => {
		const raw = ipinfoRawResponse.replace("Asia/Tokyo", "Invalid/Timezone");

		expect(ipinfoAdapter.parse(raw)).toBeUndefined();
	});

	test("ipinfo adapter は loc が壊れていても必須項目が揃っていれば成功すること", () => {
		const raw = ipinfoRawResponse.replace("35.6895,139.6917", "not-a-latlon");
		const result = ipinfoAdapter.parse(raw);

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			region: "Metro State",
			ip: "111.222.333.444",
			city: "Central City",
			fetchedAt: expect.any(String),
			providerName: "ipinfo",
			providerUrl: "https://ipinfo.io",
			rawData: raw,
		});
	});
});
