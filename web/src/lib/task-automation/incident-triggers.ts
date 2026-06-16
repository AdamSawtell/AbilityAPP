import type { IncidentRecord } from "@/lib/incident";
import { isNdisReportOverdue } from "@/lib/incident";
import { investigationSlaDays } from "@/lib/incident-analytics";

function parseIncidentDate(incident: IncidentRecord): Date | null {
  const raw =
    incident.reportedAt?.slice(0, 10) ||
    incident.occurredAt?.slice(0, 10) ||
    incident.awareAt?.slice(0, 10);
  if (!raw) return null;
  const d = new Date(`${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function incidentDaysOpen(incident: IncidentRecord, now = Date.now()): number {
  const opened = parseIncidentDate(incident);
  if (!opened) return 0;
  return Math.max(0, Math.floor((now - opened.getTime()) / (1000 * 60 * 60 * 24)));
}

export function isInvestigationOverdue(
  incident: IncidentRecord,
  slaDays: number,
  now = Date.now()
): boolean {
  if (incident.status === "Closed") return false;
  if (isNdisReportOverdue(incident)) return false;

  const opened = parseIncidentDate(incident);
  if (!opened) return false;

  const daysOpen = (now - opened.getTime()) / (1000 * 60 * 60 * 24);
  const sla = investigationSlaDays(slaDays);

  const investigating =
    incident.status === "Under investigation" ||
    incident.status === "Actions in progress" ||
    (incident.status === "Submitted" && !incident.investigationSummary?.trim());

  return investigating && daysOpen > sla;
}

export function incidentFieldChanges(
  before: IncidentRecord | undefined,
  after: IncidentRecord
): string[] {
  if (!before) return [];
  const fields: (keyof IncidentRecord)[] = [
    "status",
    "severity",
    "isReportable",
    "reportableType",
    "title",
    "ndisNotifiedAt",
  ];
  return fields.filter((key) => before[key] !== after[key]);
}

export type IncidentAutomationEvent =
  | { type: "incident.created"; incident: IncidentRecord }
  | { type: "incident.updated"; incident: IncidentRecord; before?: IncidentRecord }
  | { type: "incident.reportable_set"; incident: IncidentRecord }
  | { type: "incident.status_changed"; incident: IncidentRecord; beforeStatus: string }
  | { type: "incident.ndis_overdue"; incident: IncidentRecord }
  | { type: "incident.investigation_overdue"; incident: IncidentRecord };

export function incidentEventsFromSave(
  incident: IncidentRecord,
  before?: IncidentRecord
): IncidentAutomationEvent[] {
  const events: IncidentAutomationEvent[] = [];

  if (!before) {
    events.push({ type: "incident.created", incident });
    if (incident.isReportable) {
      events.push({ type: "incident.reportable_set", incident });
    }
    return events;
  }

  events.push({ type: "incident.updated", incident, before });

  if (!before.isReportable && incident.isReportable) {
    events.push({ type: "incident.reportable_set", incident });
  }

  if (before.status !== incident.status) {
    events.push({
      type: "incident.status_changed",
      incident,
      beforeStatus: before.status,
    });
  }

  return events;
}

export function scheduledIncidentCandidates(
  incidents: IncidentRecord[],
  investigationSlaDays: number
): IncidentAutomationEvent[] {
  const events: IncidentAutomationEvent[] = [];
  const now = Date.now();

  for (const incident of incidents) {
    if (incident.status === "Closed") continue;

    if (isNdisReportOverdue(incident)) {
      events.push({ type: "incident.ndis_overdue", incident });
      continue;
    }

    if (isInvestigationOverdue(incident, investigationSlaDays, now)) {
      events.push({ type: "incident.investigation_overdue", incident });
    }
  }

  return events;
}
