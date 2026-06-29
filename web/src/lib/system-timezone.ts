/** IANA timezone used for organisation-wide date/time display. */

export const DEFAULT_ORGANIZATION_TIMEZONE = "Australia/Sydney";

export const COMMON_ORGANIZATION_TIMEZONES = [
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Darwin",
  "Australia/Hobart",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

export function isValidTimezone(timeZone: string): boolean {
  const value = timeZone.trim();
  if (!value) return false;
  try {
    Intl.DateTimeFormat("en-AU", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeOrganizationTimezone(timeZone: string | undefined | null): string {
  const value = timeZone?.trim();
  if (value && isValidTimezone(value)) return value;
  return DEFAULT_ORGANIZATION_TIMEZONE;
}

export function formatSystemClockDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
}

export function formatSystemClockTime(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
}

export function formatSystemClockZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(now);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

/** Calendar date (`YYYY-MM-DD`) in the organisation timezone. */
export function organizationTodayIso(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: normalizeOrganizationTimezone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function formatOrganizationLocalDateTime(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalizeOrganizationTimezone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/** Parse calendar date + `HH:mm` in the organisation timezone to a UTC instant. */
export function organizationLocalDateTimeToUtc(
  dateIso: string,
  timeHm: string,
  timeZone: string
): Date {
  const date = dateIso.slice(0, 10);
  const time = (timeHm || "00:00").slice(0, 5);
  const target = `${date} ${time}`;
  const [y, m, d] = date.split("-").map(Number);
  let low = Date.UTC(y, m - 2, d, 0, 0);
  let high = Date.UTC(y, m, d + 1, 23, 59);
  while (high - low > 60_000) {
    const mid = Math.floor((low + high) / 2);
    if (formatOrganizationLocalDateTime(mid, timeZone) < target) low = mid;
    else high = mid;
  }
  return new Date(high);
}

/** Whole hours from `from` until `to` (negative when `to` is in the past). */
export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}
