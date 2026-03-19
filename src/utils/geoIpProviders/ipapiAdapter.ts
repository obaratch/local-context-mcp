import {
	buildLocation,
	getNumber,
	getString,
	parseJsonObject,
} from "./helpers.js";
import type { GeoIpProviderAdapter } from "./types.js";

export const ipapiAdapter: GeoIpProviderAdapter = {
	providerName: "ipapi",
	providerUrl: "https://ipapi.co/json/",
	parse(rawData) {
		const data = parseJsonObject(rawData);
		if (data === undefined) {
			return undefined;
		}

		return buildLocation({
			timezone: getString(data, ["timezone"]),
			country: getString(data, ["country_code", "country"]),
			region: getString(data, ["region"]),
			ip: getString(data, ["ip"]),
			city: getString(data, ["city"]),
			latitude: getNumber(data, ["latitude"]),
			longitude: getNumber(data, ["longitude"]),
			providerName: this.providerName,
			providerUrl: this.providerUrl,
			rawData,
		});
	},
};
