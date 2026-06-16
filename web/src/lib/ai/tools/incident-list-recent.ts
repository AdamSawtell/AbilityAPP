import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { fetchIncidents } from "@/lib/supabase/data-api";
import { formatDisplayDateTime, isNdisReportOverdue, normalizeIncident } from "@/lib/incident";

export async function runIncidentListRecent(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { hours?: number; limit?: number; openOnly?: boolean; reportableOnly?: boolean }
) {
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return { count: 0, results: [], note: "You do not have access to incidents." };
  }

  const hours = Math.min(Math.max(Number(args.hours) || 168, 1), 24 * 90);
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 40);
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  let incidents = (await fetchIncidents(supabase)).map(normalizeIncident);

  incidents = incidents.filter((i) => {
    const occurred = i.occurredAt ? new Date(i.occurredAt).getTime() : 0;
    const reported = i.reportedAt ? new Date(`${i.reportedAt}T12:00:00`).getTime() : 0;
    const latest = Math.max(occurred, reported);
    return latest >= cutoff;
  });

  if (args.openOnly) {
    incidents = incidents.filter((i) => i.status !== "Closed");
  }
  if (args.reportableOnly) {
    incidents = incidents.filter((i) => i.isReportable);
  }

  incidents.sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));

  return {
    hours,
    count: incidents.length,
    results: incidents.slice(0, limit).map((i) => ({
      id: i.id,
      documentNo: i.documentNo,
      title: i.title,
      status: i.status,
      severity: i.severity,
      occurredAt: formatDisplayDateTime(i.occurredAt),
      isReportable: i.isReportable,
      reportableType: i.reportableType,
      overdue: isNdisReportOverdue(i),
      href: `/incidents/${i.id}`,
    })),
  };
}
