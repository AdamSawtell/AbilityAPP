import type { ClientActivity, ClientRecord } from "@/lib/client";
import { findClientByRouteId } from "@/lib/client";
import { clientIdFromPagePath } from "@/lib/ai/activity-coach-display";

export const ACTIVITY_COACH_PREFETCH_LIMIT = 5;

export type CoachPrefetchedActivity = {
  date: string;
  type: string;
  subject: string;
  description: string;
  createdBy?: string;
};

export function mapClientActivitiesForCoach(
  rows: ClientActivity[],
  limit = ACTIVITY_COACH_PREFETCH_LIMIT
): CoachPrefetchedActivity[] {
  return [...rows]
    .sort((a, b) => {
      const dateCmp = String(b.date ?? "").localeCompare(String(a.date ?? ""));
      if (dateCmp !== 0) return dateCmp;
      return (b.lineNo ?? 0) - (a.lineNo ?? 0);
    })
    .slice(0, limit)
    .map((row) => ({
      date: row.date,
      type: row.activityType,
      subject: row.subject,
      description: row.description ?? "",
      createdBy: row.createdBy,
    }));
}

export function prefetchCoachNotesFromClients(
  clients: ClientRecord[],
  pagePath: string
): { clientId: string; activities: CoachPrefetchedActivity[] } | null {
  const routeId = clientIdFromPagePath(pagePath);
  if (!routeId) return null;
  const client = findClientByRouteId(clients, routeId);
  if (!client) return null;
  return {
    clientId: client.id,
    activities: mapClientActivitiesForCoach(client.activity ?? []),
  };
}
