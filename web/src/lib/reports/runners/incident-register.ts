import type { IncidentRecord } from "@/lib/incident";
import { formatDisplayDateTime, isNdisReportOverdue } from "@/lib/incident";
import { ndisChecklistProgress } from "@/lib/incident-ndis";
import type { ReportResult } from "@/lib/reports/types";

type IncidentColumn = {
  id: string;
  label: string;
  getValue: (row: IncidentRecord) => string;
};

export const INCIDENT_REGISTER_COLUMNS: IncidentColumn[] = [
  { id: "documentNo", label: "Document no.", getValue: (r) => r.documentNo },
  { id: "title", label: "Title", getValue: (r) => r.title },
  { id: "status", label: "Status", getValue: (r) => r.status },
  { id: "severity", label: "Severity", getValue: (r) => r.severity },
  { id: "category", label: "Category", getValue: (r) => r.category },
  { id: "isReportable", label: "NDIS reportable", getValue: (r) => (r.isReportable ? "Yes" : "No") },
  { id: "reportableType", label: "Reportable type", getValue: (r) => r.reportableType },
  { id: "occurredAt", label: "Occurred at", getValue: (r) => formatDisplayDateTime(r.occurredAt) },
  { id: "awareAt", label: "Aware at", getValue: (r) => formatDisplayDateTime(r.awareAt) },
  { id: "reportedAt", label: "Reported date", getValue: (r) => r.reportedAt },
  { id: "reportDeadlineAt", label: "NDIS deadline", getValue: (r) => formatDisplayDateTime(r.reportDeadlineAt) },
  { id: "ndisNotifiedAt", label: "NDIS notified at", getValue: (r) => formatDisplayDateTime(r.ndisNotifiedAt) },
  { id: "ndisNotificationRef", label: "NDIS reference", getValue: (r) => r.ndisNotificationRef },
  { id: "primaryClientId", label: "Client ID", getValue: (r) => r.primaryClientId },
  { id: "primaryEmployeeId", label: "Employee ID", getValue: (r) => r.primaryEmployeeId },
  { id: "primaryLocationId", label: "Location ID", getValue: (r) => r.primaryLocationId },
  { id: "partyCount", label: "Parties", getValue: (r) => String(r.parties.length) },
  { id: "actionCount", label: "Actions", getValue: (r) => String(r.actions.length) },
  { id: "notificationCount", label: "Notifications", getValue: (r) => String(r.notifications.length) },
  { id: "createdBy", label: "Created by", getValue: (r) => r.createdBy },
];

export function buildIncidentRegisterReport(incidents: IncidentRecord[]): ReportResult {
  const rows = [...incidents]
    .sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || "") || a.documentNo.localeCompare(b.documentNo))
    .map((incident) => {
      const flat: Record<string, string> = {};
      for (const col of INCIDENT_REGISTER_COLUMNS) {
        flat[col.id] = col.getValue(incident);
      }
      return flat;
    });

  return {
    columns: INCIDENT_REGISTER_COLUMNS.map(({ id, label }) => ({ id, label })),
    rows,
  };
}

export const NDIS_REPORTABLE_COLUMNS: IncidentColumn[] = [
  ...INCIDENT_REGISTER_COLUMNS,
  {
    id: "ndisOverdue",
    label: "NDIS overdue",
    getValue: (r) => (r.isReportable && isNdisReportOverdue(r) ? "Yes" : "No"),
  },
  {
    id: "checklistComplete",
    label: "Checklist complete",
    getValue: (r) => (ndisChecklistProgress(r).complete ? "Yes" : "No"),
  },
  {
    id: "immediateActions",
    label: "Immediate actions",
    getValue: (r) => r.immediateActions,
  },
  {
    id: "investigationSummary",
    label: "Investigation summary",
    getValue: (r) => r.investigationSummary,
  },
  {
    id: "correctiveActions",
    label: "Corrective actions",
    getValue: (r) => r.correctiveActions,
  },
];

export function buildNdisReportableIncidentsReport(incidents: IncidentRecord[]): ReportResult {
  const reportable = incidents.filter((i) => i.isReportable);
  const rows = reportable
    .sort((a, b) => (a.reportDeadlineAt || "").localeCompare(b.reportDeadlineAt || "") || a.documentNo.localeCompare(b.documentNo))
    .map((incident) => {
      const flat: Record<string, string> = {};
      for (const col of NDIS_REPORTABLE_COLUMNS) {
        flat[col.id] = col.getValue(incident);
      }
      return flat;
    });

  return {
    columns: NDIS_REPORTABLE_COLUMNS.map(({ id, label }) => ({ id, label })),
    rows,
  };
}
