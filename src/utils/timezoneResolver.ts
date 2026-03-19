import { getLocalTimeZone, isValidTimezone } from "./datetimeUtils.js";
import { getLocation } from "./geoIpClient.js";
import type { GeoIpLocation } from "./geoIpProviders/types.js";

type ResolveTimezoneOptions = {
	geoIpLookup?: () => Promise<GeoIpLocation | undefined>;
	fallbackTimeZone?: string;
};

export async function resolveTimezone(
	options?: ResolveTimezoneOptions,
): Promise<string> {
	const explicitTimezone = getExplicitTimezone();
	if (explicitTimezone !== undefined) {
		return explicitTimezone;
	}

	const geoIpLookup = options?.geoIpLookup ?? getLocation;
	const location = await geoIpLookup();
	if (location !== undefined && isValidTimezone(location.timezone)) {
		return location.timezone;
	}

	return options?.fallbackTimeZone ?? getLocalTimeZone();
}

function getExplicitTimezone(): string | undefined {
	const value = process.env.TZ?.trim();
	if (value && isValidTimezone(value)) {
		return value;
	}
	return undefined;
}
