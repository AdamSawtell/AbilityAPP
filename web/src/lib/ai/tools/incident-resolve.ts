import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchIncidents } from "@/lib/supabase/data-api";
import { normalizeIncident, type IncidentRecord } from "@/lib/incident";

export async function resolveIncident(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<IncidentRecord | null> {
  const incidentId = String(args.incidentId ?? args.id ?? "").trim();
  const documentNo = String(args.documentNo ?? "").trim();
  const title = String(args.title ?? "").trim();

  const incidents = (await fetchIncidents(supabase)).map(normalizeIncident);

  if (incidentId) {
    return incidents.find((i) => i.id === incidentId) ?? null;
  }
  if (documentNo) {
    const q = documentNo.toLowerCase();
    return incidents.find((i) => i.documentNo.toLowerCase() === q) ?? null;
  }
  if (title) {
    const q = title.toLowerCase();
    return incidents.find((i) => i.title.toLowerCase().includes(q)) ?? null;
  }
  return null;
}
