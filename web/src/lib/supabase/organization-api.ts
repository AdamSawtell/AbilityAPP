import type { SupabaseClient } from "@supabase/supabase-js";
import { ORGANIZATION_ID } from "@/lib/organization";
import type { OrganizationRecord } from "@/lib/organization";
import { organizationFromRow, organizationToRow, type OrganizationRow } from "@/lib/supabase/organization";

export async function fetchOrganization(supabase: SupabaseClient): Promise<OrganizationRecord | null> {
  const { data, error } = await supabase
    .from("app_organization")
    .select("*")
    .eq("id", ORGANIZATION_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return organizationFromRow(data as OrganizationRow);
}

export async function saveOrganization(supabase: SupabaseClient, record: OrganizationRecord) {
  const row = organizationToRow(record);
  const { error } = await supabase.from("app_organization").upsert(row, { onConflict: "id" });
  if (error) throw error;
}
