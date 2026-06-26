import type { AuthSession } from "@/lib/access/types";
import type { IncidentRecord } from "@/lib/incident";
import { filterIncidentsByLocationScope } from "@/lib/location-list-access";

export const INCIDENTS_SEE_ALL_WINDOW = "incidents-see-all";

export function canSeeAllIncidents(canWindow: (key: string) => boolean): boolean {
  return canWindow(INCIDENTS_SEE_ALL_WINDOW);
}

export function incidentSubmittedByUser(
  record: IncidentRecord,
  session: Pick<AuthSession, "displayName" | "username">
): boolean {
  const reporter = record.createdBy.trim().toLowerCase();
  if (!reporter) return false;
  return (
    reporter === session.displayName.trim().toLowerCase() ||
    reporter === session.username.trim().toLowerCase()
  );
}

/** Limited roles see only their own open (not closed) incidents. */
export function visibleIncidentsForSession(
  records: IncidentRecord[],
  session: Pick<AuthSession, "displayName" | "username">,
  seeAll: boolean
): IncidentRecord[] {
  if (seeAll) return records;
  return records.filter(
    (record) => record.status !== "Closed" && incidentSubmittedByUser(record, session)
  );
}

export function canViewIncidentRecord(
  record: IncidentRecord,
  session: Pick<AuthSession, "displayName" | "username">,
  seeAll: boolean
): boolean {
  if (seeAll) return true;
  return record.status !== "Closed" && incidentSubmittedByUser(record, session);
}

/** Apply incident role visibility then optional location scope (client-linked incidents). */
export function visibleIncidentsForSessionWithLocation(
  records: IncidentRecord[],
  session: Pick<AuthSession, "displayName" | "username">,
  seeAllIncidents: boolean,
  visibleClientIds: Set<string> | null
): IncidentRecord[] {
  const byRole = visibleIncidentsForSession(records, session, seeAllIncidents);
  if (!visibleClientIds) return byRole;
  return filterIncidentsByLocationScope(byRole, visibleClientIds);
}
