import { buildLocation, getString, parseKeyValueLines } from "./helpers.js";
import type { GeoIpProviderAdapter } from "./types.js";

export const cloudflareTraceAdapter: GeoIpProviderAdapter = {
	providerName: "cloudflare trace",
	providerUrl: "https://www.cloudflare.com/cdn-cgi/trace",
	parse(rawData) {
		const data = parseKeyValueLines(rawData);

		return buildLocation({
			timezone: getString(data, ["timezone"]),
			country: getString(data, ["loc"]),
			ip: getString(data, ["ip"]),
			providerName: this.providerName,
			providerUrl: this.providerUrl,
			rawData,
		});
	},
};
