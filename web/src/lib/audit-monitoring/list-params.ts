import { defaultAuditDateFrom, defaultAuditDateTo } from "@/lib/audit-monitoring/pagination";

/** Parse list query params with a default 7-day window when dates omitted. */
export function parseAuditListParams(url: URL, defaultDays = 7) {
  const dateFrom = url.searchParams.get("dateFrom") ?? defaultAuditDateFrom(defaultDays);
  const dateTo = url.searchParams.get("dateTo") ?? defaultAuditDateTo();
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 50);
  return { dateFrom, dateTo, cursor, limit };
}
