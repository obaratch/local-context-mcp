import {
	buildLocation,
	getNumber,
	getString,
	parseJsonObject,
} from "./helpers.js";
import type { GeoIpProviderAdapter } from "./types.js";

export const identMeAdapter: GeoIpProviderAdapter = {
	providerName: "ident.me",
	providerUrl: "https://ident.me/json",
	parse(rawData) {
		const data = parseJsonObject(rawData);
		if (data === undefined) {
			return undefined;
		}

		return buildLocation({
			timezone: getString(data, ["tz"]),
			country: getString(data, ["cc", "country"]),
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
