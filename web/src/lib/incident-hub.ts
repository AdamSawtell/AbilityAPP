import { isNdisReportOverdue, type IncidentRecord } from "@/lib/incident";

export type IncidentHomeStats = {
  total: number;
  open: number;
  reportableOpen: number;
  overdue: number;
};

export function incidentHomeStats(incidents: IncidentRecord[]): IncidentHomeStats {
  const open = incidents.filter((i) => i.status !== "Closed");
  const reportableOpen = open.filter((i) => i.isReportable);
  const overdue = reportableOpen.filter(isNdisReportOverdue);
  return {
    total: incidents.length,
    open: open.length,
    reportableOpen: reportableOpen.length,
    overdue: overdue.length,
  };
}

export function recentIncidents(incidents: IncidentRecord[], limit = 5): IncidentRecord[] {
  return [...incidents]
    .sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""))
    .slice(0, limit);
}
