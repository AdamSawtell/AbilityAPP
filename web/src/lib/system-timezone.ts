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
