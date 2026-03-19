// Source URL: https://ipinfo.io
export const ipinfoRawResponse = `{
  "ip": "111.222.333.444",
  "hostname": "edge-111-222-333-444.acme-inc.example",
  "city": "Central City",
  "region": "Metro State",
  "country": "JP",
  "loc": "35.6895,139.6917",
  "org": "AS64500 Acme-Inc Networks",
  "postal": "100-0001",
  "timezone": "Asia/Tokyo",
  "readme": "https://ipinfo.io/missingauth"
}`;

// Source URL: https://ipapi.co/json/
export const ipapiRawResponse = `{
  "ip": "111.222.333.444",
  "network": "111.222.333.0/24",
  "version": "IPv4",
  "city": "North District",
  "region": "Metro State",
  "region_code": "13",
  "country": "JP",
  "country_name": "Japan",
  "country_code": "JP",
  "country_code_iso3": "JPN",
  "country_capital": "Tokyo",
  "country_tld": ".jp",
  "continent_code": "AS",
  "in_eu": false,
  "postal": "114-0001",
  "latitude": 35.752,
  "longitude": 139.7341,
  "timezone": "Asia/Tokyo",
  "utc_offset": "+0900",
  "country_calling_code": "+81",
  "currency": "JPY",
  "currency_name": "Yen",
  "languages": "ja",
  "country_area": 377835.0,
  "country_population": 126529100,
  "asn": "AS64500",
  "org": "Acme-Inc Networks"
}`;

// Source URL: https://www.cloudflare.com/cdn-cgi/trace
export const cloudflareTraceRawResponse = `fl=763f11
h=www.cloudflare.com
ip=111.222.333.444
ts=1773908212.000
visit_scheme=https
uag=curl/8.0.0
colo=NRT
sliver=none
http=http/2
loc=JP
tls=TLSv1.3
sni=plaintext
warp=off
gateway=off
rbi=off
kex=X25519`;

// Source URL: https://ipwho.is
export const ipwhoisRawResponse = `{"ip":"111.222.333.444","success":true,"type":"IPv4","continent":"Asia","continent_code":"AS","country":"Japan","country_code":"JP","region":"Metro State","region_code":"13","city":"Central City","latitude":35.6940027,"longitude":139.7535951,"is_eu":false,"postal":"100-0003","calling_code":"81","capital":"Tokyo","borders":"","flag":{"img":"https://cdn.example.test/flags/jp.svg","emoji":"JP","emoji_unicode":"U+004A U+0050"},"connection":{"asn":64500,"org":"Acme-Inc Networks","isp":"Acme-Inc ISP","domain":"acme-inc.example"},"timezone":{"id":"Asia/Tokyo","abbr":"JST","is_dst":false,"offset":32400,"utc":"+09:00"}}`;

// Source URL: https://ifconfig.co/json
export const ifconfigRawResponse = `{
  "ip": "111.222.333.444",
  "ip_decimal": 3405803786,
  "country": "Japan",
  "country_iso": "JP",
  "country_eu": false,
  "region_name": "Metro State",
  "region_code": "13",
  "zip_code": "151-0071",
  "city": "Central City",
  "latitude": 35.6837,
  "longitude": 139.6805,
  "time_zone": "Asia/Tokyo",
  "asn": "AS64500",
  "asn_org": "Acme-Inc Networks",
  "hostname": "edge-111-222-333-444.acme-inc.example",
  "user_agent": {
    "product": "curl",
    "version": "8.0.0",
    "raw_value": "curl/8.0.0"
  }
}`;

// Source URL: https://ident.me/json
export const identMeRawResponse = `{"ip":"111.222.333.444","aso":"Acme-Inc Networks","asn":64500,"type":"business","continent":"AS","cc":"JP","country":"Japan","city":"Central City","postal":"100-8111","latitude":35.6906,"longitude":139.77,"tz":"Asia/Tokyo","weather":"JAXX0000"}`;
