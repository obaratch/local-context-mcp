import {
	buildLocation,
	getNumber,
	getString,
	parseJsonObject,
} from "./helpers.js";
import type { GeoIpProviderAdapter } from "./types.js";

export const ifconfigAdapter: GeoIpProviderAdapter = {
	providerName: "ifconfig",
	providerUrl: "https://ifconfig.co/json",
	parse(rawData) {
		const data = parseJsonObject(rawData);
		if (data === undefined) {
			return undefined;
		}

		return buildLocation({
			timezone: getString(data, ["time_zone"]),
			country: getString(data, ["country_iso", "country"]),
			region: getString(data, ["region_name"]),
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
