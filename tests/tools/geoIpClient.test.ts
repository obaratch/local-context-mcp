import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type {
	GeoIpLocation,
	GeoIpProviderAdapter,
} from "../../src/utils/geoIpProviders/types.js";
import {
	cleanupTrackedTempDirs,
	createTrackedTempDir,
} from "../utils/tempDirUtils.js";

const originalStoreDir = process.env.LOCAL_CONTEXT_STORE_DIR;
const originalTtl = process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS;
const tempDirs: string[] = [];

type GeoIpClientModule = typeof import("../../src/utils/geoIpClient.js");

function createProvider(
	providerName: string,
	parse: GeoIpProviderAdapter["parse"],
): GeoIpProviderAdapter {
	return {
		providerName,
		providerUrl: `https://${providerName}.example.test`,
		parse,
	};
}

async function createTestStoreDir(): Promise<string> {
	return createTrackedTempDir(tempDirs, "local-context-geoip-test-");
}

async function loadGeoIpClient(storeDir: string): Promise<GeoIpClientModule> {
	process.env.LOCAL_CONTEXT_STORE_DIR = storeDir;
	vi.resetModules();
	return import(
		new URL("../../src/utils/geoIpClient.js", import.meta.url).href
	);
}

beforeEach(() => {
	vi.resetModules();
});

afterEach(async () => {
	if (originalStoreDir === undefined) {
		delete process.env.LOCAL_CONTEXT_STORE_DIR;
	} else {
		process.env.LOCAL_CONTEXT_STORE_DIR = originalStoreDir;
	}
	if (originalTtl === undefined) {
		delete process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS;
	} else {
		process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS = originalTtl;
	}
	vi.resetModules();
	await cleanupTrackedTempDirs(tempDirs);
});

describe.sequential("単体: geoIpClient / cache", () => {
	test("TTL 内 cache がある場合は provider を呼ばずに返すこと", async () => {
		process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS = "86400000";
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		client.setGeoIpCache({
			timezone: "Asia/Tokyo",
			country: "JP",
			fetchedAt: "2026-03-18T12:00:00Z",
			providerName: "cached",
			providerUrl: "https://cached.example.test",
			rawData: "cached-raw",
		});

		const result = await client.getLocation({
			now: "2026-03-19T11:59:59Z",
			fetchText: async () => {
				throw new Error("should not fetch");
			},
		});

		expect(result).toEqual({
			timezone: "Asia/Tokyo",
			country: "JP",
			fetchedAt: "2026-03-18T12:00:00Z",
			providerName: "cached",
			providerUrl: "https://cached.example.test",
			rawData: "cached-raw",
		});
	});

	test("TTL 切れ cache は再取得し成功時に cache を更新して返すこと", async () => {
		process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS = "86400000";
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		client.setGeoIpCache({
			timezone: "Asia/Tokyo",
			country: "JP",
			fetchedAt: "2026-03-18T12:00:00Z",
			providerName: "cached",
			providerUrl: "https://cached.example.test",
			rawData: "cached-raw",
		});
		const fetchText = vi
			.fn<(url: string) => Promise<string>>()
			.mockResolvedValueOnce("first-raw");
		const firstParse = vi.fn(
			(raw: string): GeoIpLocation => ({
				timezone: "Europe/Paris",
				country: "FR",
				fetchedAt: "2026-03-19T12:00:01Z",
				providerName: "first",
				providerUrl: "https://first.example.test",
				rawData: raw,
			}),
		);

		const result = await client.getLocation({
			now: "2026-03-19T12:00:00Z",
			fetchText,
			providers: [createProvider("first", firstParse)],
		});

		expect(result).toEqual({
			timezone: "Europe/Paris",
			country: "FR",
			fetchedAt: "2026-03-19T12:00:01Z",
			providerName: "first",
			providerUrl: "https://first.example.test",
			rawData: "first-raw",
		});
		expect(client.getGeoIpCache()).toEqual(result);
	});

	test("TTL 切れ cache で再取得に失敗した場合は undefined を返すこと", async () => {
		process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS = "86400000";
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		client.setGeoIpCache({
			timezone: "Asia/Tokyo",
			country: "JP",
			fetchedAt: "2026-03-18T12:00:00Z",
			providerName: "cached",
			providerUrl: "https://cached.example.test",
			rawData: "cached-raw",
		});

		const result = await client.getLocation({
			now: "2026-03-19T12:00:00Z",
			fetchText: async () => {
				throw new Error("network error");
			},
			providers: [createProvider("first", () => undefined)],
		});

		expect(result).toBeUndefined();
	});

	test("useCache が false の場合は cache を見ずに再取得すること", async () => {
		process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS = "86400000";
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		client.setGeoIpCache({
			timezone: "Asia/Tokyo",
			country: "JP",
			fetchedAt: "2026-03-19T12:00:00Z",
			providerName: "cached",
			providerUrl: "https://cached.example.test",
			rawData: "cached-raw",
		});
		const fetchText = vi
			.fn<(url: string) => Promise<string>>()
			.mockResolvedValueOnce("first-raw");

		const result = await client.getLocation({
			useCache: false,
			fetchText,
			providers: [
				createProvider("first", (raw: string) => ({
					timezone: "Europe/Paris",
					country: "FR",
					fetchedAt: "2026-03-19T12:00:01Z",
					providerName: "first",
					providerUrl: "https://first.example.test",
					rawData: raw,
				})),
			],
		});

		expect(fetchText).toHaveBeenCalledTimes(1);
		expect(result?.timezone).toBe("Europe/Paris");
		expect(client.getGeoIpCache()?.timezone).toBe("Europe/Paris");
	});

	test("不正な cache 値は使わず削除すること", async () => {
		process.env.LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS = "86400000";
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		client.setGeoIpCache({
			timezone: "Invalid/Timezone",
			country: "JP",
			fetchedAt: "2026-03-19T12:00:00Z",
			providerName: "cached",
			providerUrl: "https://cached.example.test",
			rawData: "cached-raw",
		} as GeoIpLocation);

		const result = await client.getLocation({
			now: "2026-03-19T12:00:00Z",
			providers: [createProvider("first", () => undefined)],
			fetchText: async () => {
				throw new Error("network error");
			},
		});

		expect(result).toBeUndefined();
		expect(client.getGeoIpCache()).toBeUndefined();
	});
});

describe.sequential("単体: geoIpClient / provider fallback", () => {
	test("先頭 provider が成功した場合は後続 provider を呼ばずに返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		const fetchText = vi
			.fn<(url: string) => Promise<string>>()
			.mockResolvedValueOnce("first-raw");
		const firstParse = vi.fn((raw: string) => ({
			timezone: "Asia/Tokyo",
			country: "JP",
			fetchedAt: "2026-03-19T12:00:00Z",
			providerName: "first",
			providerUrl: "https://first.example.test",
			rawData: raw,
		}));
		const secondParse = vi.fn(() => undefined);

		const result = await client.getLocation({
			useCache: false,
			fetchText,
			providers: [
				createProvider("first", firstParse),
				createProvider("second", secondParse),
			],
		});

		expect(result?.timezone).toBe("Asia/Tokyo");
		expect(fetchText).toHaveBeenCalledTimes(1);
		expect(secondParse).not.toHaveBeenCalled();
	});

	test("先頭 provider が undefined を返した場合は次の provider へフォールバックすること", async () => {
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		const fetchText = vi
			.fn<(url: string) => Promise<string>>()
			.mockResolvedValueOnce("first-raw")
			.mockResolvedValueOnce("second-raw");
		const firstParse = vi.fn(() => undefined);
		const secondParse = vi.fn((raw: string) => ({
			timezone: "Europe/Paris",
			country: "FR",
			fetchedAt: "2026-03-19T12:00:01Z",
			providerName: "second",
			providerUrl: "https://second.example.test",
			rawData: raw,
		}));

		const result = await client.getLocation({
			useCache: false,
			fetchText,
			providers: [
				createProvider("first", firstParse),
				createProvider("second", secondParse),
			],
		});

		expect(result?.timezone).toBe("Europe/Paris");
		expect(fetchText).toHaveBeenNthCalledWith(1, "https://first.example.test");
		expect(fetchText).toHaveBeenNthCalledWith(2, "https://second.example.test");
	});

	test("途中 provider が throw した場合も次の provider へフォールバックすること", async () => {
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		const fetchText = vi
			.fn<(url: string) => Promise<string>>()
			.mockRejectedValueOnce(new Error("network error"))
			.mockResolvedValueOnce("second-raw");
		const secondParse = vi.fn((raw: string) => ({
			timezone: "Europe/Paris",
			country: "FR",
			fetchedAt: "2026-03-19T12:00:01Z",
			providerName: "second",
			providerUrl: "https://second.example.test",
			rawData: raw,
		}));

		const result = await client.getLocation({
			useCache: false,
			fetchText,
			providers: [
				createProvider("first", () => undefined),
				createProvider("second", secondParse),
			],
		});

		expect(result?.timezone).toBe("Europe/Paris");
		expect(fetchText).toHaveBeenNthCalledWith(1, "https://first.example.test");
		expect(fetchText).toHaveBeenNthCalledWith(2, "https://second.example.test");
	});

	test("全 provider が失敗した場合は undefined を返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const client = await loadGeoIpClient(storeDir);
		client.resetGeoIpCache();
		const fetchText = vi
			.fn<(url: string) => Promise<string>>()
			.mockResolvedValueOnce("first-raw")
			.mockRejectedValueOnce(new Error("network error"));
		const firstParse = vi.fn(() => undefined);

		const result = await client.getLocation({
			useCache: false,
			fetchText,
			providers: [
				createProvider("first", firstParse),
				createProvider("second", () => undefined),
			],
		});

		expect(result).toBeUndefined();
		expect(fetchText).toHaveBeenCalledTimes(2);
		expect(firstParse).toHaveBeenCalledWith("first-raw");
	});
});
