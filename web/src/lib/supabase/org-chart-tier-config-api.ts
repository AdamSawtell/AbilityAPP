import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ORG_CHART_TIER_OPTIONS, type OrgChartTierConfigRecord } from "@/lib/org-chart-tier-config";

type TierRow = {
  tier: number;
  label: string;
  hint: string;
  sort_order: number;
  active: boolean;
};

function fromRow(row: TierRow): OrgChartTierConfigRecord {
  return {
    tier: row.tier,
    label: row.label,
    hint: row.hint ?? "",
    sortOrder: row.sort_order ?? row.tier,
    active: row.active !== false,
  };
}

function toRow(record: OrgChartTierConfigRecord): TierRow {
  return {
    tier: record.tier,
    label: record.label,
    hint: record.hint ?? "",
    sort_order: record.sortOrder,
    active: record.active,
  };
}

export async function fetchOrgChartTierConfig(
  supabase: SupabaseClient
): Promise<OrgChartTierConfigRecord[]> {
  const { data, error } = await supabase
    .from("org_chart_tier_config")
    .select("tier, label, hint, sort_order, active")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [...DEFAULT_ORG_CHART_TIER_OPTIONS];
  return data.map((row) => fromRow(row as TierRow));
}

export async function saveOrgChartTierConfig(
  supabase: SupabaseClient,
  record: OrgChartTierConfigRecord
): Promise<void> {
  const row = toRow(record);
  const { error } = await supabase.from("org_chart_tier_config").upsert(
    {
      ...row,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tier" }
  );
  if (error) throw error;
}
