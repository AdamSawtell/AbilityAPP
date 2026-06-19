import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

export async function runClientGet(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { clientId?: string; searchKey?: string; name?: string }
) {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { found: false, note: "You do not have access to client records." };
  }

  const id = args.clientId?.trim() ?? "";
  const searchKey = args.searchKey?.trim() ?? "";
  const name = args.name?.trim() ?? "";

  let query = supabase.from("client").select("*");
  if (id) query = query.eq("id", id);
  else if (searchKey) query = query.eq("search_key", searchKey);
  else if (name) query = query.ilike("name", `%${name}%`);
  else return { found: false, error: "Provide clientId, searchKey, or name." };

  const { data: clients, error } = await query.limit(3);
  if (error) throw error;
  if (!clients?.length) return { found: false, query: { id, searchKey, name } };

  const client = clients[0];

  const [
    { data: activities },
    { data: contactActivities },
    { data: alerts },
    { data: consents },
    { data: risks },
    { data: locations },
  ] = await Promise.all([
    supabase
      .from("client_activity")
      .select("id, activity_date, activity_type, subject, description, updated_at, created_by")
      .eq("client_id", client.id)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("client_contact_activity")
      .select("id, activity_date, activity_type, contact_name, subject, description, updated_at")
      .eq("client_id", client.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("client_alert")
      .select("id, name, alert_type, show_as_alert, valid_from, valid_to")
      .eq("client_id", client.id)
      .order("line_no")
      .limit(8),
    supabase
      .from("client_consent")
      .select("id, name, consent_type, show_as_alert, valid_from, valid_to")
      .eq("client_id", client.id)
      .order("line_no")
      .limit(8),
    supabase
      .from("client_risk")
      .select("id, name, risk_type, show_as_alert")
      .eq("client_id", client.id)
      .order("line_no")
      .limit(8),
    supabase
      .from("client_location")
      .select("id, name, city, state, postcode, active")
      .eq("client_id", client.id)
      .order("line_no")
      .limit(5),
  ]);

  return {
    found: true,
    client: {
      id: client.id,
      searchKey: client.search_key,
      name: client.name,
      firstName: client.first_name,
      lastName: client.last_name,
      preferredName: client.preferred_name,
      status: client.status,
      email: client.email,
      phone: client.phone,
      fundingBody: client.funding_body,
      fundingBodyNumber: client.funding_body_number,
      disability: client.disability,
      additionalDisabilityInformation: client.additional_disability_information,
      services: client.services,
      dateSupportCommencement: client.date_support_commencement,
      dateSupportCeased: client.date_support_ceased,
      livingArrangement: client.living_arrangement,
      gender: client.gender,
      createdBy: client.created_by,
      updatedBy: client.updated_by,
      updatedAt: client.updated_at,
      riskAlerts: client.risk_alerts,
      consentAlertList: client.consent_alert_list,
      href: `/clients/${client.id}`,
    },
    summary: {
      activityCount: activities?.length ?? 0,
      alertCount: alerts?.length ?? 0,
      consentCount: consents?.length ?? 0,
      riskCount: risks?.length ?? 0,
      locationCount: locations?.length ?? 0,
    },
    recentActivity: (activities ?? []).map((a) => ({
      date: a.activity_date,
      type: a.activity_type,
      subject: a.subject,
      description: (a.description ?? "").slice(0, 200),
      updatedAt: a.updated_at,
      createdBy: a.created_by,
    })),
    recentContactActivity: (contactActivities ?? []).map((a) => ({
      date: a.activity_date,
      type: a.activity_type,
      contactName: a.contact_name,
      subject: a.subject,
      updatedAt: a.updated_at,
    })),
    alerts: (alerts ?? []).map((a) => ({
      name: a.name,
      type: a.alert_type,
      showAsAlert: a.show_as_alert,
      validFrom: a.valid_from,
      validTo: a.valid_to,
    })),
    consents: (consents ?? []).map((c) => ({
      name: c.name,
      type: c.consent_type,
      showAsAlert: c.show_as_alert,
    })),
    risks: (risks ?? []).map((r) => ({
      name: r.name,
      type: r.risk_type,
      showAsAlert: r.show_as_alert,
    })),
    locations: (locations ?? []).map((l) => ({
      name: l.name,
      city: l.city,
      state: l.state,
      postcode: l.postcode,
      active: l.active,
    })),
  };
}
