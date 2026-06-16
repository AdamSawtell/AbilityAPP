import { newLineId } from "@/lib/client-line-tables";
import { renumberLines } from "@/lib/location-line-tables";
import type { LocationActivityRow, LocationAlertRow, LocationRecord } from "@/lib/location";
import { formatDisplayDateTime, type IncidentRecord } from "@/lib/incident";
import { incidentAlertMarker } from "@/lib/incident-ndis";

function alertForIncident(alerts: LocationAlertRow[], incidentId: string) {
  const marker = incidentAlertMarker(incidentId);
  return alerts.findIndex((a) => a.description.startsWith(marker));
}

function buildAlertRow(incident: IncidentRecord, lineNo: number, existing?: LocationAlertRow): LocationAlertRow {
  const marker = incidentAlertMarker(incident.id);
  const overdue =
    incident.reportDeadlineAt &&
    new Date(incident.reportDeadlineAt).getTime() < Date.now() &&
    !incident.ndisNotifiedAt;
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
    id: existing?.id ?? newLineId("loc-alert"),
    lineNo,
    alertType: "Incident",
    showAsAlert: closed ? "No" : "Yes",
    name: `NDIS reportable: ${incident.documentNo}`,
    description: `${marker} ${summary}`,
    validFrom: existing?.validFrom || today,
    validTo: closed ? today : "",
  };
}

function buildActivityRow(incident: IncidentRecord, lineNo: number, createdBy: string): LocationActivityRow {
  return {
    id: newLineId("loc-activity"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Incident",
    subject: `${incident.documentNo} — ${incident.title || "Reportable incident"}`,
    description: `${incident.reportableType}. ${incident.description.slice(0, 240)}${incident.description.length > 240 ? "…" : ""}`,
    createdBy,
  };
}

export type IncidentLocationSyncOptions = {
  isCreate?: boolean;
  createdBy?: string;
};

export function syncLocationFromIncident(
  location: LocationRecord,
  incident: IncidentRecord,
  before?: IncidentRecord,
  options?: IncidentLocationSyncOptions
): LocationRecord | null {
  const targetsThisLocation = incident.primaryLocationId === location.id;
  const beforeTargeted = before?.primaryLocationId === location.id;

  if (!targetsThisLocation) {
    if (beforeTargeted && before?.isReportable) {
      return expireIncidentLocationAlert(location, before.id);
    }
    return null;
  }

  if (!incident.isReportable) {
    if (before?.isReportable) return expireIncidentLocationAlert(location, incident.id);
    return null;
  }

  let alerts = [...location.alerts];
  const idx = alertForIncident(alerts, incident.id);
  const nextAlert = buildAlertRow(
    incident,
    idx >= 0 ? alerts[idx].lineNo : alerts.length + 1,
    idx >= 0 ? alerts[idx] : undefined
  );

  if (idx >= 0) alerts[idx] = nextAlert;
  else alerts.push(nextAlert);
  alerts = renumberLines(alerts);

  let activities = [...location.activities];
  const shouldAddActivity = options?.isCreate || (before && !before.isReportable && incident.isReportable);
  if (shouldAddActivity && !activities.some((a) => a.subject.startsWith(incident.documentNo))) {
    activities = renumberLines([
      ...activities,
      buildActivityRow(incident, activities.length + 1, options?.createdBy || incident.createdBy || "System"),
    ]);
  }

  return { ...location, alerts, activities };
}

export function expireIncidentLocationAlert(location: LocationRecord, incidentId: string): LocationRecord | null {
  const idx = alertForIncident(location.alerts, incidentId);
  if (idx < 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const alerts = renumberLines(
    location.alerts.map((a, i) =>
      i === idx ? { ...a, showAsAlert: "No", validTo: a.validTo || today } : a
    )
  );
  return { ...location, alerts };
}

export function syncLocationsForIncident(
  locations: LocationRecord[],
  incident: IncidentRecord,
  before?: IncidentRecord,
  options?: IncidentLocationSyncOptions
): LocationRecord[] {
  const touchedIds = new Set<string>();
  if (incident.primaryLocationId) touchedIds.add(incident.primaryLocationId);
  if (before?.primaryLocationId) touchedIds.add(before.primaryLocationId);

  if (!touchedIds.size) return locations;

  let changed = false;
  const next = locations.map((location) => {
    if (!touchedIds.has(location.id)) return location;
    const updated = syncLocationFromIncident(location, incident, before, options);
    if (!updated) return location;
    changed = true;
    return updated;
  });
  return changed ? next : locations;
}
