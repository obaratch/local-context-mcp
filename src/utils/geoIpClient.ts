import {
	DEFAULT_TIMEZONE_CACHE_TTL_MS,
	isCacheExpired,
	isValidTimezone,
	isValidTtl,
	nowIso,
} from "./datetimeUtils.js";
import { cloudflareTraceAdapter } from "./geoIpProviders/cloudflareTraceAdapter.js";
import { identMeAdapter } from "./geoIpProviders/identMeAdapter.js";
import { ifconfigAdapter } from "./geoIpProviders/ifconfigAdapter.js";
import { ipapiAdapter } from "./geoIpProviders/ipapiAdapter.js";
import { ipinfoAdapter } from "./geoIpProviders/ipinfoAdapter.js";
import { ipwhoisAdapter } from "./geoIpProviders/ipwhoisAdapter.js";
import type {
	GeoIpLocation,
	GeoIpProviderAdapter,
} from "./geoIpProviders/types.js";
import { deleteKey, getValue, setValue } from "./storeUtils.js";

type FetchText = (url: string) => Promise<string>;

type GeoIpClientOptions = {
	fetchText?: FetchText;
	providers?: GeoIpProviderAdapter[];
	useCache?: boolean;
	now?: string;
};

const DEFAULT_TIMEOUT_MS = 500;
const GEOIP_CACHE_KEY = "system.geoip.last";
const GEOIP_CACHE_TTL_ENV = "LOCAL_CONTEXT_GEOIP_CACHE_TTL_MS";
const defaultProviders: GeoIpProviderAdapter[] = [
	ipinfoAdapter,
	ipapiAdapter,
	ipwhoisAdapter,
	ifconfigAdapter,
	identMeAdapter,
	cloudflareTraceAdapter,
];

export async function getLocation(
	options?: GeoIpClientOptions,
): Promise<GeoIpLocation | undefined> {
	const useCache = options?.useCache ?? true;
	const providers = options?.providers ?? defaultProviders;
	const fetchText = options?.fetchText ?? defaultFetchText;
	const currentNow = options?.now ?? nowIso();

	if (useCache) {
		const cached = getGeoIpCache();
		if (cached !== undefined) {
			if (
				!isCacheExpired({
					fetchedAt: cached.fetchedAt,
					now: currentNow,
					ttlMs: getGeoIpCacheTtlMs(),
				})
			) {
				return cached;
			}
		}
	}

	for (const provider of providers) {
		try {
			const rawData = await fetchText(provider.providerUrl);
			const location = provider.parse(rawData);
			if (location !== undefined) {
				setGeoIpCache(location);
				return location;
			}
		} catch {
			// provider failure is non-fatal; try next provider.
		}
	}

	return undefined;
}

export function getGeoIpCache(): GeoIpLocation | undefined {
	const value = getValue(GEOIP_CACHE_KEY);
	if (!isGeoIpLocation(value)) {
		if (value !== undefined) {
			deleteKey(GEOIP_CACHE_KEY);
		}
		return undefined;
	}

	return value;
}

export function setGeoIpCache(value: GeoIpLocation): void {
	setValue(GEOIP_CACHE_KEY, value);
}

export function resetGeoIpCache(): void {
	deleteKey(GEOIP_CACHE_KEY);
}

async function defaultFetchText(url: string): Promise<string> {
	const response = await fetch(url, {
		headers: {
			accept: "text/plain, application/json",
		},
		signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new Error(`request failed: ${response.status}`);
	}

	return response.text();
}

function getGeoIpCacheTtlMs(): number {
	const rawValue = process.env[GEOIP_CACHE_TTL_ENV];
	if (rawValue === undefined) {
		return DEFAULT_TIMEZONE_CACHE_TTL_MS;
	}

	const parsed = Number(rawValue);
	return isValidTtl(parsed) ? parsed : DEFAULT_TIMEZONE_CACHE_TTL_MS;
}

function isGeoIpLocation(value: unknown): value is GeoIpLocation {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		typeof record.timezone === "string" &&
		isValidTimezone(record.timezone) &&
		typeof record.country === "string" &&
		typeof record.fetchedAt === "string" &&
		typeof record.providerName === "string" &&
		typeof record.providerUrl === "string" &&
		typeof record.rawData === "string"
	);
}
