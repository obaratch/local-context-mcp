import {
	buildLocation,
	getString,
	parseJsonObject,
	parseLatLonPair,
} from "./helpers.js";
import type { GeoIpProviderAdapter } from "./types.js";

export const ipinfoAdapter: GeoIpProviderAdapter = {
	providerName: "ipinfo",
	providerUrl: "https://ipinfo.io",
	parse(rawData) {
		const data = parseJsonObject(rawData);
		if (data === undefined) {
			return undefined;
		}

		const latLon = parseLatLonPair(getString(data, ["loc"]) ?? "");

		return buildLocation({
			timezone: getString(data, ["timezone"]),
			country: getString(data, ["country"]),
			region: getString(data, ["region"]),
			ip: getString(data, ["ip"]),
			city: getString(data, ["city"]),
			latitude: latLon?.latitude,
			longitude: latLon?.longitude,
			providerName: this.providerName,
			providerUrl: this.providerUrl,
			rawData,
		});
	},
};
