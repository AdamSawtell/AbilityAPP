import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { IncidentRecord, IncidentSeverity, IncidentStatus } from "@/lib/incident";
import { isNdisReportOverdue } from "@/lib/incident";
import type { LocationRecord } from "@/lib/location";
import type { ProductRecord } from "@/lib/product";

export type IncidentStatusBucket = "Open" | "In progress" | "Closed";

export type TrendGranularity = "daily" | "weekly" | "monthly";

export type IncidentDateRange = {
  from: string;
  to: string;
};

export type CountRow = { label: string; count: number; href?: string };

export type TrendPoint = { label: string; count: number };

export type RepeatIncidentFlag = {
  clientId: string;
  clientLabel: string;
  category: string;
  count: number;
  incidentIds: string[];
};

export type OverdueInvestigation = {
  id: string;
  documentNo: string;
  title: string;
  reason: string;
  href: string;
};

export type IncidentAnalyticsContext = {
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  products: ProductRecord[];
};

const INVESTIGATION_SLA_DAYS_DEFAULT = 14;

export function investigationSlaDays(value: number | undefined | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : INVESTIGATION_SLA_DAYS_DEFAULT;
}

export function statusBucket(status: IncidentStatus): IncidentStatusBucket {
  if (status === "Closed") return "Closed";
  if (status === "Draft" || status === "Submitted") return "Open";
  return "In progress";
}

function parseIncidentDate(incident: IncidentRecord): Date | null {
  const raw = incident.occurredAt || incident.reportedAt || incident.awareAt;
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultIncidentDateRange(): IncidentDateRange {
  const to = startOfDay(new Date());
  const from = new Date(to);
  from.setDate(from.getDate() - 89);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export function filterIncidentsByDateRange(
  incidents: IncidentRecord[],
  range: IncidentDateRange
): IncidentRecord[] {
  const from = range.from ? startOfDay(new Date(range.from + "T00:00:00")) : null;
  const to = range.to ? startOfDay(new Date(range.to + "T23:59:59")) : null;
  if (from && Number.isNaN(from.getTime())) return incidents;
  if (to && Number.isNaN(to.getTime())) return incidents;

  return incidents.filter((incident) => {
    const d = parseIncidentDate(incident);
    if (!d) return !range.from && !range.to;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

export function countByStatusBucket(incidents: IncidentRecord[]): CountRow[] {
  const buckets: Record<IncidentStatusBucket, number> = {
    Open: 0,
    "In progress": 0,
    Closed: 0,
  };
  for (const incident of incidents) {
    buckets[statusBucket(incident.status)] += 1;
  }
  return (["Open", "In progress", "Closed"] as const).map((label) => ({
    label,
    count: buckets[label],
  }));
}

export function countByCategory(incidents: IncidentRecord[]): CountRow[] {
  const map = new Map<string, number>();
  for (const incident of incidents) {
    const key = incident.category?.trim() || "Uncategorised";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function countBySeverity(incidents: IncidentRecord[]): CountRow[] {
  const order: IncidentSeverity[] = ["Low", "Medium", "High", "Critical"];
  const map = new Map<string, number>();
  for (const severity of order) map.set(severity, 0);
  for (const incident of incidents) {
    map.set(incident.severity, (map.get(incident.severity) ?? 0) + 1);
  }
  return order.map((label) => ({ label, count: map.get(label) ?? 0 }));
}

function weekKey(d: Date): string {
  const copy = startOfDay(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return toIsoDate(copy);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatTrendLabel(key: string, granularity: TrendGranularity): string {
  if (granularity === "monthly") {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  if (granularity === "weekly") {
    const d = new Date(key + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function incidentTrend(
  incidents: IncidentRecord[],
  granularity: TrendGranularity
): TrendPoint[] {
  const map = new Map<string, number>();
  for (const incident of incidents) {
    const d = parseIncidentDate(incident);
    if (!d) continue;
    const key =
      granularity === "monthly"
        ? monthKey(d)
        : granularity === "weekly"
          ? weekKey(d)
          : toIsoDate(d);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ label: formatTrendLabel(key, granularity), count }));
}

function entityLabel(
  id: string,
  list: { id: string; searchKey: string; name: string }[],
  fallback: string
): string {
  const row = list.find((r) => r.id === id);
  return row ? `${row.searchKey} — ${row.name}` : fallback;
}

export function ratePerLocation(incidents: IncidentRecord[], locations: LocationRecord[]): CountRow[] {
  const map = new Map<string, number>();
  for (const incident of incidents) {
    const id = incident.primaryLocationId;
    if (!id?.trim()) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([id, count]) => ({
      label: entityLabel(id, locations, id),
      count,
      href: `/locations/${id}?tab=${encodeURIComponent("Incidents")}`,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function ratePerClient(incidents: IncidentRecord[], clients: ClientRecord[]): CountRow[] {
  const map = new Map<string, number>();
  for (const incident of incidents) {
    const ids = new Set<string>();
    if (incident.primaryClientId) ids.add(incident.primaryClientId);
    for (const party of incident.parties) {
      if (party.partyType === "Client" && party.entityId) ids.add(party.entityId);
    }
    for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([id, count]) => ({
      label: entityLabel(id, clients, id),
      count,
      href: `/clients/${id}`,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function ratePerEmployee(incidents: IncidentRecord[], employees: EmployeeRecord[]): CountRow[] {
  const map = new Map<string, number>();
  for (const incident of incidents) {
    const ids = new Set<string>();
    if (incident.primaryEmployeeId) ids.add(incident.primaryEmployeeId);
    for (const party of incident.parties) {
      if (party.partyType === "Employee" && party.entityId) ids.add(party.entityId);
    }
    for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([id, count]) => ({
      label: entityLabel(id, employees, id),
      count,
      href: `/employees/${id}?tab=${encodeURIComponent("Incidents")}`,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function serviceTypeForIncident(
  incident: IncidentRecord,
  locations: LocationRecord[],
  products: ProductRecord[]
): string {
  if (incident.serviceType?.trim()) return incident.serviceType.trim();
  if (!incident.primaryLocationId) return "Unassigned";
  const location = locations.find((l) => l.id === incident.primaryLocationId);
  if (!location?.productLinks?.length) return "No linked service";
  const activeLink = location.productLinks.find((l) => l.active === "Yes") ?? location.productLinks[0];
  const product = products.find((p) => p.id === activeLink.productId);
  return product?.productCategory?.trim() || product?.name || "Other service";
}

export function ratePerServiceType(
  incidents: IncidentRecord[],
  locations: LocationRecord[],
  products: ProductRecord[]
): CountRow[] {
  const map = new Map<string, number>();
  for (const incident of incidents) {
    const key = serviceTypeForIncident(incident, locations, products);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function incidentClosureDate(incident: IncidentRecord): Date | null {
  if (incident.status !== "Closed") return null;
  const candidates = [
    incident.reportedAt,
    ...incident.actions.map((a) => a.actionDate),
    ...incident.notifications.map((n) => n.notifiedAt?.slice(0, 10) ?? ""),
    incident.managerReviewedAt?.slice(0, 10) ?? "",
    incident.ndisNotifiedAt?.slice(0, 10) ?? "",
  ].filter(Boolean);
  if (!candidates.length) return parseIncidentDate(incident);
  const sorted = candidates.sort();
  const d = new Date(sorted[sorted.length - 1] + "T12:00:00");
  return Number.isNaN(d.getTime()) ? parseIncidentDate(incident) : d;
}

export function averageDaysToClosure(incidents: IncidentRecord[]): number | null {
  const closed = incidents.filter((i) => i.status === "Closed");
  if (!closed.length) return null;
  let total = 0;
  let n = 0;
  for (const incident of closed) {
    const opened = parseIncidentDate(incident);
    const closedAt = incidentClosureDate(incident);
    if (!opened || !closedAt) continue;
    const days = (closedAt.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24);
    if (days >= 0) {
      total += days;
      n += 1;
    }
  }
  return n ? Math.round((total / n) * 10) / 10 : null;
}

export function overdueInvestigations(
  incidents: IncidentRecord[],
  slaDays: number = INVESTIGATION_SLA_DAYS_DEFAULT
): OverdueInvestigation[] {
  const sla = investigationSlaDays(slaDays);
  const now = Date.now();
  const rows: OverdueInvestigation[] = [];

  for (const incident of incidents) {
    if (incident.status === "Closed") continue;

    if (isNdisReportOverdue(incident)) {
      rows.push({
        id: incident.id,
        documentNo: incident.documentNo,
        title: incident.title || "Untitled",
        reason: "NDIS Commission notification overdue",
        href: `/incidents/${incident.id}`,
      });
      continue;
    }

    const opened = parseIncidentDate(incident);
    if (!opened) continue;
    const daysOpen = (now - opened.getTime()) / (1000 * 60 * 60 * 24);
    const investigating =
      incident.status === "Under investigation" ||
      incident.status === "Actions in progress" ||
      (incident.status === "Submitted" && !incident.investigationSummary?.trim());

    if (investigating && daysOpen > sla) {
      rows.push({
        id: incident.id,
        documentNo: incident.documentNo,
        title: incident.title || "Untitled",
        reason: `Investigation open ${Math.floor(daysOpen)} days (SLA ${sla}d)`,
        href: `/incidents/${incident.id}`,
      });
    }
  }

  return rows.sort((a, b) => a.documentNo.localeCompare(b.documentNo));
}

export function repeatIncidentFlags(
  incidents: IncidentRecord[],
  clients: ClientRecord[]
): RepeatIncidentFlag[] {
  const map = new Map<string, { clientId: string; category: string; ids: string[] }>();
  for (const incident of incidents) {
    const clientId = incident.primaryClientId;
    if (!clientId) continue;
    const category = incident.category?.trim() || "Uncategorised";
    const key = `${clientId}::${category}`;
    const entry = map.get(key) ?? { clientId, category, ids: [] };
    entry.ids.push(incident.id);
    map.set(key, entry);
  }
  return [...map.values()]
    .filter((e) => e.ids.length >= 2)
    .map((e) => ({
      clientId: e.clientId,
      clientLabel: entityLabel(e.clientId, clients, e.clientId),
      category: e.category,
      count: e.ids.length,
      incidentIds: e.ids,
    }))
    .sort((a, b) => b.count - a.count || a.clientLabel.localeCompare(b.clientLabel));
}

/** Severity × category matrix for heat map (rows = category, cols = severity). */
export function severityHeatMap(incidents: IncidentRecord[]): {
  categories: string[];
  severities: IncidentSeverity[];
  matrix: number[][];
} {
  const severities: IncidentSeverity[] = ["Low", "Medium", "High", "Critical"];
  const categorySet = new Set<string>();
  for (const incident of incidents) {
    categorySet.add(incident.category?.trim() || "Uncategorised");
  }
  const categories = [...categorySet].sort();
  const matrix = categories.map(() => severities.map(() => 0));
  for (const incident of incidents) {
    const cat = incident.category?.trim() || "Uncategorised";
    const row = categories.indexOf(cat);
    const col = severities.indexOf(incident.severity);
    if (row >= 0 && col >= 0) matrix[row][col] += 1;
  }
  return { categories, severities, matrix };
}

export function buildIncidentDashboardMetrics(
  incidents: IncidentRecord[],
  range: IncidentDateRange,
  granularity: TrendGranularity,
  ctx: IncidentAnalyticsContext,
  slaDays: number = INVESTIGATION_SLA_DAYS_DEFAULT
) {
  const filtered = filterIncidentsByDateRange(incidents, range);
  const sla = investigationSlaDays(slaDays);
  return {
    total: filtered.length,
    byStatus: countByStatusBucket(filtered),
    byCategory: countByCategory(filtered),
    bySeverity: countBySeverity(filtered),
    trend: incidentTrend(filtered, granularity),
    perClient: ratePerClient(filtered, ctx.clients),
    perEmployee: ratePerEmployee(filtered, ctx.employees),
    perLocation: ratePerLocation(filtered, ctx.locations),
    perServiceType: ratePerServiceType(filtered, ctx.locations, ctx.products),
    avgDaysToClose: averageDaysToClosure(filtered),
    overdue: overdueInvestigations(filtered, sla),
    repeats: repeatIncidentFlags(filtered, ctx.clients),
    heatMap: severityHeatMap(filtered),
  };
}
