import { nowIso } from "../datetimeUtils.js";
import type { GeoIpLocation } from "./types.js";

type UnknownRecord = Record<string, unknown>;

type BuildLocationInput = {
	timezone?: string;
	country?: string;
	region?: string;
	ip?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
	providerName: string;
	providerUrl: string;
	rawData: string;
	fetchedAt?: string;
};

export function parseJsonObject(rawData: string): UnknownRecord | undefined {
	try {
		const parsed = JSON.parse(rawData) as unknown;
		return asRecord(parsed);
	} catch {
		return undefined;
	}
}

export function asRecord(value: unknown): UnknownRecord | undefined {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}

	return value as UnknownRecord;
}

export function getString(
	record: UnknownRecord,
	keys: string[],
): string | undefined {
	for (const key of keys) {
		const value = record[key];
		const normalized = normalizeString(value);
		if (normalized !== undefined) {
			return normalized;
		}
	}

	return undefined;
}

export function getNumber(
	record: UnknownRecord,
	keys: string[],
): number | undefined {
	for (const key of keys) {
		const value = record[key];
		const normalized = normalizeNumber(value);
		if (normalized !== undefined) {
			return normalized;
		}
	}

	return undefined;
}

export function getNestedRecord(
	record: UnknownRecord,
	keys: string[],
): UnknownRecord | undefined {
	for (const key of keys) {
		const nested = asRecord(record[key]);
		if (nested !== undefined) {
			return nested;
		}
	}

	return undefined;
}

export function parseLatLonPair(
	value: string,
): { latitude: number; longitude: number } | undefined {
	const [latitudeText, longitudeText, ...rest] = value
		.split(",")
		.map((part) => part.trim());
	if (
		rest.length > 0 ||
		latitudeText === undefined ||
		longitudeText === undefined
	) {
		return undefined;
	}

	const latitude = Number(latitudeText);
	const longitude = Number(longitudeText);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return undefined;
	}

	return { latitude, longitude };
}

export function parseKeyValueLines(rawData: string): UnknownRecord {
	const record: UnknownRecord = {};

	for (const line of rawData.split(/\r?\n/)) {
		const separatorIndex = line.indexOf("=");
		if (separatorIndex <= 0) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		const value = line.slice(separatorIndex + 1).trim();
		if (key.length === 0 || value.length === 0) {
			continue;
		}

		record[key] = value;
	}

	return record;
}

export function buildLocation(
	input: BuildLocationInput,
): GeoIpLocation | undefined {
	const timezone = normalizeString(input.timezone);
	const country = normalizeCountryCode(input.country);
	const fetchedAt = normalizeString(input.fetchedAt) ?? nowIso();
	if (
		timezone === undefined ||
		country === undefined ||
		!isValidTimezone(timezone) ||
		!isIsoCountryCode(country)
	) {
		return undefined;
	}

	const providerName = normalizeString(input.providerName);
	const providerUrl = normalizeString(input.providerUrl);
	const rawData = normalizeString(input.rawData);
	if (
		providerName === undefined ||
		providerUrl === undefined ||
		rawData === undefined
	) {
		return undefined;
	}

	const location: GeoIpLocation = {
		timezone,
		country,
		fetchedAt,
		providerName,
		providerUrl,
		rawData,
	};

	const region = normalizeString(input.region);
	const ip = normalizeString(input.ip);
	const city = normalizeString(input.city);
	const latitude = normalizeNumber(input.latitude);
	const longitude = normalizeNumber(input.longitude);

	if (region !== undefined) {
		location.region = region;
	}
	if (ip !== undefined) {
		location.ip = ip;
	}
	if (city !== undefined) {
		location.city = city;
	}
	if (latitude !== undefined) {
		location.latitude = latitude;
	}
	if (longitude !== undefined) {
		location.longitude = longitude;
	}

	return location;
}

export function isValidTimezone(value: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value });
		return true;
	} catch {
		return false;
	}
}

function normalizeString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value === "string") {
		const parsed = Number(value.trim());
		return Number.isFinite(parsed) ? parsed : undefined;
	}

	return undefined;
}

function normalizeCountryCode(value: unknown): string | undefined {
	const normalized = normalizeString(value);
	if (normalized === undefined) {
		return undefined;
	}

	const upper = normalized.toUpperCase();
	return isIsoCountryCode(upper) ? upper : undefined;
}

function isIsoCountryCode(value: string): boolean {
	return /^[A-Z]{2}$/.test(value);
}
