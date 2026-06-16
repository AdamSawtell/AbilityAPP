import { renumberLines } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";
import { formatDisplayDateTime, type IncidentRecord } from "@/lib/incident";

export function restrictivePracticeIncidentMarker(incidentId: string) {
  return `incident-rp:${incidentId}`;
}

function isUnauthorisedRestrictivePractice(incident: IncidentRecord) {
  return (
    incident.reportableType === "Unauthorised restrictive practice" ||
    incident.category === "Restrictive practice"
  );
}

/**
 * Link unauthorised restrictive practice incidents to the client's restrictive practice register row.
 */
export function syncRestrictivePracticeFromIncident(
  client: ClientRecord,
  incident: IncidentRecord,
  before?: IncidentRecord
): ClientRecord | null {
  if (client.id !== incident.primaryClientId) return null;
  if (!isUnauthorisedRestrictivePractice(incident)) return null;

  const rpId = incident.linkedRestrictivePracticeId?.trim();
  if (!rpId) return null;

  const idx = client.restrictivePractices.findIndex((r) => r.id === rpId);
  if (idx < 0) return null;

  const marker = restrictivePracticeIncidentMarker(incident.id);
  const row = client.restrictivePractices[idx];
  if (row.description.includes(marker)) return null;

  const note = `${marker} Linked incident ${incident.documentNo} (${formatDisplayDateTime(incident.occurredAt)}). ${incident.title}`;
  const restrictivePractices = renumberLines(
    client.restrictivePractices.map((r, i) =>
      i === idx ? { ...r, description: r.description.trim() ? `${r.description}\n${note}` : note } : r
    )
  );

  if (before?.linkedRestrictivePracticeId === rpId && before.id === incident.id) {
    return null;
  }

  return { ...client, restrictivePractices };
}

export function syncClientsRestrictivePracticeForIncident(
  clients: ClientRecord[],
  incident: IncidentRecord,
  before?: IncidentRecord
): ClientRecord[] {
  if (!incident.primaryClientId) return clients;

  let changed = false;
  const next = clients.map((client) => {
    if (client.id !== incident.primaryClientId) return client;
    const updated = syncRestrictivePracticeFromIncident(client, incident, before);
    if (!updated) return client;
    changed = true;
    return updated;
  });
  return changed ? next : clients;
}
