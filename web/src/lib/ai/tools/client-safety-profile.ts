import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { resolveClient } from "@/lib/ai/tools/client-resolve";

export async function runClientSafetyProfile(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { clientId?: string; searchKey?: string; name?: string; clientName?: string }
) {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { found: false, note: "You do not have access to client records." };
  }

  const client = await resolveClient(supabase, args);
  if (!client) {
    return { found: false, error: "Provide clientId, searchKey, or client name." };
  }

  const [{ data: alerts }, { data: consents }, { data: risks }, { data: locations }] = await Promise.all([
    supabase
      .from("client_alert")
      .select("name, alert_type, show_as_alert, valid_from, valid_to, description")
      .eq("client_id", client.id)
      .order("line_no"),
    supabase
      .from("client_consent")
      .select("name, consent_type, show_as_alert, valid_from, valid_to")
      .eq("client_id", client.id)
      .order("line_no"),
    supabase
      .from("client_risk")
      .select("name, risk_type, show_as_alert, description")
      .eq("client_id", client.id)
      .order("line_no"),
    supabase
      .from("client_location")
      .select("name, city, state, postcode, active, service_delivery_address")
      .eq("client_id", client.id)
      .order("line_no"),
  ]);

  const visibleAlerts = (alerts ?? []).filter((a) => a.show_as_alert === "Y");
  const visibleConsents = (consents ?? []).filter((c) => c.show_as_alert === "Y");
  const visibleRisks = (risks ?? []).filter((r) => r.show_as_alert === "Y");

  return {
    found: true,
    client: {
      id: client.id,
      name: client.name,
      searchKey: client.searchKey,
      href: `/clients/${client.id}`,
    },
    summary: {
      alertCount: alerts?.length ?? 0,
      consentCount: consents?.length ?? 0,
      riskCount: risks?.length ?? 0,
      locationCount: locations?.length ?? 0,
      flaggedOnRecord: visibleAlerts.length + visibleConsents.length + visibleRisks.length,
    },
    alerts: alerts ?? [],
    consents: consents ?? [],
    risks: risks ?? [],
    locations: locations ?? [],
    flaggedItems: [
      ...visibleAlerts.map((a) => ({ kind: "alert", name: a.name, type: a.alert_type })),
      ...visibleConsents.map((c) => ({ kind: "consent", name: c.name, type: c.consent_type })),
      ...visibleRisks.map((r) => ({ kind: "risk", name: r.name, type: r.risk_type })),
    ],
  };
}
