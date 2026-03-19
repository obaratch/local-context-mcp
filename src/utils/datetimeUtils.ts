import { differenceInMilliseconds, formatISO, parseISO } from "date-fns";

export const DEFAULT_TIMEZONE_CACHE_TTL_MS = 86_400_000;

/** ISO 8601 形式の現在日時文字列を返す。 */
export function nowIso(): string {
	return formatISO(new Date());
}

/** ISO 8601 文字列を `Date` として読み込む。 */
export function parseIso(value: string): Date {
	return parseISO(value);
}

/** 2つの ISO 8601 文字列の差分ミリ秒を返す。 */
export function differenceIsoInMilliseconds(
	left: string,
	right: string,
): number {
	return differenceInMilliseconds(parseIso(left), parseIso(right));
}

/** 指定タイムゾーンの ISO 8601 形式文字列を返す。 */
export function formatDateTimeInTimeZone(date: Date, timeZone: string): string {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
		timeZoneName: "longOffset",
	});
	const parts = formatter.formatToParts(date);
	const values = new Map(parts.map((part) => [part.type, part.value]));
	const year = values.get("year");
	const month = values.get("month");
	const day = values.get("day");
	const hour = values.get("hour");
	const minute = values.get("minute");
	const second = values.get("second");
	const offset = normalizeOffset(values.get("timeZoneName"));
	if (
		year === undefined ||
		month === undefined ||
		day === undefined ||
		hour === undefined ||
		minute === undefined ||
		second === undefined ||
		offset === undefined
	) {
		throw new Error(`failed to format time zone: ${timeZone}`);
	}

	return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

/** ローカルタイムゾーン名を返す。 */
export function getLocalTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** TTL 値として扱えるかを返す。 */
export function isValidTtl(value: number): boolean {
	return Number.isFinite(value);
}

/** キャッシュが期限切れかを判定する。 */
export function isCacheExpired(params: {
	fetchedAt: string;
	now: string;
	ttlMs: number;
}): boolean {
	if (params.ttlMs <= 0) {
		return true;
	}

	return (
		differenceIsoInMilliseconds(params.now, params.fetchedAt) >= params.ttlMs
	);
}

function normalizeOffset(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (value === "GMT" || value === "UTC") {
		return "+00:00";
	}
	const match = value.match(/GMT([+-]\d{2}):(\d{2})$/);
	if (!match) {
		return undefined;
	}

	return `${match[1]}:${match[2]}`;
}

/** タイムゾーン名が有効かを返す。 */
export function isValidTimezone(value: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value });
		return true;
	} catch {
		return false;
	}
}
