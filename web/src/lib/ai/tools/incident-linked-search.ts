import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { incidentsLinkedToClient, incidentsLinkedToEmployee } from "@/lib/incident-queries";
import { fetchIncidents } from "@/lib/supabase/data-api";
import { formatDisplayDateTime, isNdisReportOverdue, normalizeIncident } from "@/lib/incident";

export async function runIncidentLinkedSearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { clientId?: string; clientName?: string; searchKey?: string; employeeId?: string; employeeName?: string; limit?: number }
) {
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return { count: 0, results: [], note: "You do not have access to incidents." };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 40);
  const incidents = (await fetchIncidents(supabase)).map(normalizeIncident);

  let clientId = String(args.clientId ?? "").trim();
  const clientName = String(args.clientName ?? "").trim();
  const searchKey = String(args.searchKey ?? "").trim();

  if (!clientId && (clientName || searchKey)) {
    let query = supabase.from("client").select("id, name, search_key");
    if (searchKey) query = query.eq("search_key", searchKey);
    else if (clientName) query = query.ilike("name", `%${clientName}%`);
    const { data } = await query.limit(1).maybeSingle();
    if (data) clientId = data.id;
  }

  let employeeId = String(args.employeeId ?? "").trim();
  const employeeName = String(args.employeeName ?? "").trim();
  if (!employeeId && employeeName) {
    const { data } = await supabase.from("employee").select("id, name").ilike("name", `%${employeeName}%`).limit(1).maybeSingle();
    if (data) employeeId = data.id;
  }

  let linked = incidents;
  if (clientId) linked = incidentsLinkedToClient(incidents, clientId);
  else if (employeeId) linked = incidentsLinkedToEmployee(incidents, employeeId);
  else return { count: 0, results: [], error: "Provide a client or employee to search linked incidents." };

  return {
    clientId: clientId || null,
    employeeId: employeeId || null,
    count: linked.length,
    results: linked.slice(0, limit).map((i) => ({
      id: i.id,
      documentNo: i.documentNo,
      title: i.title,
      status: i.status,
      occurredAt: formatDisplayDateTime(i.occurredAt),
      isReportable: i.isReportable,
      overdue: isNdisReportOverdue(i),
      href: `/incidents/${i.id}`,
    })),
  };
}
