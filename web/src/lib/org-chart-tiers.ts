import type { OrgPositionRecord } from "@/lib/org-structure";
import { orgChartTierLabelFromConfig, type OrgChartTierConfigRecord } from "@/lib/org-chart-tier-config";

/** @deprecated Use active tiers from useOrgChartTierConfig — kept for seeds and fallbacks. */
export const ORG_CHART_TIER_OPTIONS: { value: number; label: string; hint: string }[] = [
  { value: 0, label: "Hidden (root only)", hint: "Not shown on the tier chart" },
  { value: 1, label: "Tier 1 — Governance", hint: "Board / governance container" },
  { value: 2, label: "Tier 2 — Board members", hint: "Individual board seats" },
  { value: 3, label: "Tier 3 — Chief executive", hint: "CEO" },
  { value: 4, label: "Tier 4 — Executive council", hint: "C-suite and executives" },
  { value: 5, label: "Tier 5 — Management", hint: "Managers and senior officers" },
  { value: 6, label: "Tier 6 — Team leadership", hint: "Site / team leaders" },
  { value: 7, label: "Tier 7 — Delivery staff", hint: "Support workers and frontline" },
];

export function orgChartTierLabel(
  tier: number,
  configs?: OrgChartTierConfigRecord[]
): string {
  if (configs?.length) return orgChartTierLabelFromConfig(configs, tier);
  return ORG_CHART_TIER_OPTIONS.find((o) => o.value === tier)?.label ?? `Tier ${tier}`;
}

/** Suggested tier for new seeds only — users change chart tier in the editor. */
export function suggestChartTier(
  position: Pick<OrgPositionRecord, "id" | "securityRoleId">
): number {
  if (position.id === "pos-org-root") return 0;
  if (position.id === "pos-board") return 1;
  if (position.id.startsWith("pos-board-")) return 2;
  if (position.securityRoleId === "role-ceo") return 3;
  if (position.securityRoleId?.startsWith("role-exec-")) return 4;
  if (position.securityRoleId === "role-team-leader") return 6;
  if (position.securityRoleId === "role-support-worker") return 7;
  return 5;
}

export type OrgChartTierBand = {
  tier: number;
  label: string;
  positions: OrgPositionRecord[];
};

export function groupPositionsByChartTier(
  positions: OrgPositionRecord[],
  configs?: OrgChartTierConfigRecord[]
): OrgChartTierBand[] {
  const labelFor = (tier: number) => orgChartTierLabel(tier, configs);
  const activeTiers = configs?.filter((c) => c.active && c.tier > 0).map((c) => c.tier);
  const byTier = new Map<number, OrgPositionRecord[]>();

  for (const position of positions) {
    if (position.chartTier <= 0) continue;
    if (activeTiers?.length && !activeTiers.includes(position.chartTier)) continue;
    const list = byTier.get(position.chartTier) ?? [];
    list.push(position);
    byTier.set(position.chartTier, list);
  }

  return [...byTier.keys()]
    .sort((a, b) => a - b)
    .map((tier) => ({
      tier,
      label: labelFor(tier),
      positions: (byTier.get(tier) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)
      ),
    }));
}
