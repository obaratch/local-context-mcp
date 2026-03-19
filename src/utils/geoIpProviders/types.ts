export type GeoIpLocation = {
	timezone: string;
	country: string;
	region?: string;
	ip?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
	fetchedAt: string;
	providerName: string;
	providerUrl: string;
	rawData: string;
};

export type GeoIpProviderAdapter = {
	providerName: string;
	providerUrl: string;
	parse: (rawData: string) => GeoIpLocation | undefined;
};
