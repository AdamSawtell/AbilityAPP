import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { fetchIncidents } from "@/lib/supabase/data-api";
import { buildIncidentComplianceDigest } from "@/lib/reports/runners/incident-compliance-digest";
import { normalizeIncident } from "@/lib/incident";

export async function runIncidentComplianceSummary(
  supabase: SupabaseClient,
  session: AuthSession
) {
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return { note: "You do not have access to incidents." };
  }

  const incidents = (await fetchIncidents(supabase)).map(normalizeIncident);
  const digest = buildIncidentComplianceDigest(incidents);

  return {
    generatedAt: digest.generatedAt,
    summary: digest.summary,
    overdue: digest.sections.find((s) => s.label === "NDIS overdue")?.items ?? [],
    incompleteChecklist: digest.sections.find((s) => s.label === "Incomplete checklist")?.items ?? [],
    openReportable: digest.sections.find((s) => s.label === "Open reportable")?.items.slice(0, 10) ?? [],
    complianceHubHref: "/incidents/compliance",
  };
}
