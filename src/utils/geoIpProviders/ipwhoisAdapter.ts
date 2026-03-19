import {
	buildLocation,
	getNestedRecord,
	getNumber,
	getString,
	parseJsonObject,
} from "./helpers.js";
import type { GeoIpProviderAdapter } from "./types.js";

export const ipwhoisAdapter: GeoIpProviderAdapter = {
	providerName: "ipwhois",
	providerUrl: "https://ipwho.is",
	parse(rawData) {
		const data = parseJsonObject(rawData);
		if (data === undefined) {
			return undefined;
		}

		const timezoneRecord = getNestedRecord(data, ["timezone"]);

		return buildLocation({
			timezone: timezoneRecord ? getString(timezoneRecord, ["id"]) : undefined,
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
