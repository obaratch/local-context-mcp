import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getLocation } from "../utils/geoIpClient.js";
import type { GeoIpLocation } from "../utils/geoIpProviders/types.js";

const UNKNOWN_LOCATION_TEXT = "Unknown location";

/**
 * GeoIP 由来の大まかな location 文字列を組み立てる。
 *
 * @returns `city` / `region` / `country` から組み立てた短い場所文字列
 */
export function buildLocationText(
	location?: Pick<GeoIpLocation, "city" | "region" | "country">,
): string {
	const city = normalizeLocationPart(location?.city);
	const region = normalizeLocationPart(location?.region);
	const country = normalizeLocationPart(location?.country);

	if (city && region && city !== region) {
		return `${city}, ${region}`;
	}

	if (city && country && city !== country) {
		return `${city}, ${country}`;
	}

	if (region && country && region !== country) {
		return `${region}, ${country}`;
	}

	if (city) {
		return city;
	}

	if (region) {
		return region;
	}

	if (country) {
		return country;
	}

	return UNKNOWN_LOCATION_TEXT;
}

/**
 * 基本機能 `where-are-we` のレスポンスを返す。
 *
 * @returns `content[0].text` に大まかな場所文字列を持つ `CallToolResult`
 */
export async function whereAreWe(_params?: unknown): Promise<CallToolResult> {
	const location = await getLocation({ useCache: true });
	const locationText = buildLocationText(location);

	return {
		content: [{ type: "text", text: locationText }],
		structuredContent:
			location === undefined
				? {
						locationText,
					}
				: {
						locationText,
						country: location.country,
						...(location.region ? { region: location.region } : {}),
						...(location.city ? { city: location.city } : {}),
						...(location.timezone ? { timezone: location.timezone } : {}),
					},
	};
}

function normalizeLocationPart(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}
