import { newLineId, renumberLines, type ClientActivityRow, type ClientAlertRow } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";
import { formatDisplayDateTime, type IncidentRecord } from "@/lib/incident";
import { incidentAlertMarker } from "@/lib/incident-ndis";

function alertForIncident(alerts: ClientAlertRow[], incidentId: string) {
  const marker = incidentAlertMarker(incidentId);
  return alerts.findIndex((a) => a.description.startsWith(marker));
}

function buildAlertRow(incident: IncidentRecord, lineNo: number, existing?: ClientAlertRow): ClientAlertRow {
  const marker = incidentAlertMarker(incident.id);
  const overdue = incident.reportDeadlineAt && new Date(incident.reportDeadlineAt).getTime() < Date.now() && !incident.ndisNotifiedAt;
  const summary = [
    incident.reportableType,
    incident.title,
    incident.reportDeadlineAt ? `NDIS due ${formatDisplayDateTime(incident.reportDeadlineAt)}` : "",
    overdue ? "OVERDUE" : "",
  ]
    .filter(Boolean)
    .join(" — ");

  const closed = incident.status === "Closed";
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: existing?.id ?? newLineId("alert"),
    lineNo,
    alertType: "Incident",
    showAsAlert: closed ? "No" : "Yes",
    name: `NDIS reportable: ${incident.documentNo}`,
    description: `${marker} ${summary}`,
    validFrom: existing?.validFrom || today,
    validTo: closed ? today : "",
  };
}

function buildActivityRow(incident: IncidentRecord, lineNo: number, createdBy: string): ClientActivityRow {
  return {
    id: newLineId("activity"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Incident",
    subject: `${incident.documentNo} — ${incident.title || "Reportable incident"}`,
    description: `${incident.reportableType}. ${incident.description.slice(0, 240)}${incident.description.length > 240 ? "…" : ""}`,
    createdBy,
  };
}

export type IncidentClientSyncOptions = {
  isCreate?: boolean;
  createdBy?: string;
};

/**
 * When a reportable incident references a client, mirror an alert (and optional activity) on the client record.
 */
export function syncClientFromIncident(
  client: ClientRecord,
  incident: IncidentRecord,
  before?: IncidentRecord,
  options?: IncidentClientSyncOptions
): ClientRecord | null {
  const targetsThisClient = incident.primaryClientId === client.id;
  const beforeTargeted = before?.primaryClientId === client.id;

  if (!targetsThisClient) {
    if (beforeTargeted && before?.isReportable) {
      return expireIncidentClientAlert(client, before.id);
    }
    return null;
  }

  if (!incident.isReportable) {
    if (before?.isReportable) return expireIncidentClientAlert(client, incident.id);
    return null;
  }

  let alerts = [...client.alerts];
  const idx = alertForIncident(alerts, incident.id);
  const nextAlert = buildAlertRow(incident, idx >= 0 ? alerts[idx].lineNo : alerts.length + 1, idx >= 0 ? alerts[idx] : undefined);

  if (idx >= 0) alerts[idx] = nextAlert;
  else alerts.push(nextAlert);
  alerts = renumberLines(alerts);

  let activity = [...client.activity];
  const shouldAddActivity =
    options?.isCreate || (before && !before.isReportable && incident.isReportable);
  if (shouldAddActivity && !activity.some((a) => a.subject.startsWith(incident.documentNo))) {
    activity = renumberLines([
      ...activity,
      buildActivityRow(incident, activity.length + 1, options?.createdBy || incident.createdBy || "System"),
    ]);
  }

  return { ...client, alerts, activity };
}

export function expireIncidentClientAlert(client: ClientRecord, incidentId: string): ClientRecord | null {
  const idx = alertForIncident(client.alerts, incidentId);
  if (idx < 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const alerts = renumberLines(
    client.alerts.map((a, i) =>
      i === idx ? { ...a, showAsAlert: "No", validTo: a.validTo || today } : a
    )
  );
  return { ...client, alerts };
}

export function syncClientsForIncident(
  clients: ClientRecord[],
  incident: IncidentRecord,
  before?: IncidentRecord,
  options?: IncidentClientSyncOptions
): ClientRecord[] {
  const touchedIds = new Set<string>();
  if (incident.primaryClientId) touchedIds.add(incident.primaryClientId);
  if (before?.primaryClientId) touchedIds.add(before.primaryClientId);

  if (!touchedIds.size) return clients;

  let changed = false;
  const next = clients.map((client) => {
    if (!touchedIds.has(client.id)) return client;
    const updated = syncClientFromIncident(client, incident, before, options);
    if (!updated) return client;
    changed = true;
    return updated;
  });
  return changed ? next : clients;
}
