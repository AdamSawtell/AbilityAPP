import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { fetchIncidents } from "@/lib/supabase/data-api";
import { formatDisplayDateTime, isNdisReportOverdue, normalizeIncident } from "@/lib/incident";

export async function runIncidentSearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; status?: string; reportableOnly?: boolean; limit?: number }
) {
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return { count: 0, results: [], note: "You do not have access to incidents." };
  }

  const query = args.query?.trim().toLowerCase() ?? "";
  const status = args.status?.trim() ?? "";
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 40);

  const incidents = (await fetchIncidents(supabase)).map(normalizeIncident);
  let filtered = incidents;

  if (args.reportableOnly) {
    filtered = filtered.filter((i) => i.isReportable);
  }
  if (status) {
    filtered = filtered.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }
  if (query) {
    filtered = filtered.filter((i) => {
      const blob = [
        i.title,
        i.description,
        i.documentNo,
        i.reportableType,
        i.category,
        i.primaryClientId,
        i.primaryEmployeeId,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }

  filtered.sort(
    (a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || "") || a.documentNo.localeCompare(b.documentNo)
  );

  return {
    query,
    status: status || null,
    count: filtered.length,
    results: filtered.slice(0, limit).map((i) => ({
      id: i.id,
      documentNo: i.documentNo,
      title: i.title,
      status: i.status,
      severity: i.severity,
      isReportable: i.isReportable,
      reportableType: i.reportableType,
      reportDeadlineAt: i.reportDeadlineAt ? formatDisplayDateTime(i.reportDeadlineAt) : "",
      overdue: isNdisReportOverdue(i),
      href: `/incidents/${i.id}`,
    })),
  };
}
