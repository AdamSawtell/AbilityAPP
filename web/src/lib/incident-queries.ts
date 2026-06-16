import type { IncidentRecord } from "@/lib/incident";

function matchesClient(incident: IncidentRecord, clientId: string): boolean {
  if (incident.primaryClientId === clientId) return true;
  return incident.parties.some((p) => p.partyType === "Client" && p.entityId === clientId);
}

function matchesEmployee(incident: IncidentRecord, employeeId: string): boolean {
  if (incident.primaryEmployeeId === employeeId) return true;
  return incident.parties.some((p) => p.partyType === "Employee" && p.entityId === employeeId);
}

export function incidentsLinkedToClient(incidents: IncidentRecord[], clientId: string): IncidentRecord[] {
  if (!clientId?.trim()) return [];
  return incidents
    .filter((i) => matchesClient(i, clientId))
    .sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || "") || a.documentNo.localeCompare(b.documentNo));
}

export function incidentsLinkedToEmployee(incidents: IncidentRecord[], employeeId: string): IncidentRecord[] {
  if (!employeeId?.trim()) return [];
  return incidents
    .filter((i) => matchesEmployee(i, employeeId))
    .sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || "") || a.documentNo.localeCompare(b.documentNo));
}

export function openIncidentDeadlines(incidents: IncidentRecord[]): IncidentRecord[] {
  return incidents
    .filter(
      (i) =>
        i.isReportable &&
        i.status !== "Closed" &&
        !i.ndisNotifiedAt &&
        Boolean(i.reportDeadlineAt?.trim())
    )
    .sort((a, b) => (a.reportDeadlineAt || "").localeCompare(b.reportDeadlineAt || ""));
}
