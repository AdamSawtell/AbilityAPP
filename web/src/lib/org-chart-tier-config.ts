/** DB-backed org chart tier band definition (managed in System setup). */

export type OrgChartTierConfigRecord = {
  tier: number;
  label: string;
  hint: string;
  sortOrder: number;
  active: boolean;
};

export const DEFAULT_ORG_CHART_TIER_OPTIONS: OrgChartTierConfigRecord[] = [
  { tier: 1, label: "Tier 1 — Governance", hint: "Board / governance container", sortOrder: 10, active: true },
  { tier: 2, label: "Tier 2 — Board members", hint: "Individual board seats", sortOrder: 20, active: true },
  { tier: 3, label: "Tier 3 — Chief executive", hint: "CEO", sortOrder: 30, active: true },
  { tier: 4, label: "Tier 4 — Executive council", hint: "C-suite and executives", sortOrder: 40, active: true },
  { tier: 5, label: "Tier 5 — Management", hint: "Managers and senior officers", sortOrder: 50, active: true },
  { tier: 6, label: "Tier 6 — Team leadership", hint: "Site / team leaders", sortOrder: 60, active: true },
  { tier: 7, label: "Tier 7 — Delivery staff", hint: "Support workers and frontline", sortOrder: 70, active: true },
];

export function orgChartTierLabelFromConfig(
  tiers: OrgChartTierConfigRecord[],
  tier: number
): string {
  return tiers.find((t) => t.tier === tier)?.label ?? `Tier ${tier}`;
}

export function activeOrgChartTiers(tiers: OrgChartTierConfigRecord[]): OrgChartTierConfigRecord[] {
  return [...tiers].filter((t) => t.active && t.tier > 0).sort((a, b) => a.sortOrder - b.sortOrder || a.tier - b.tier);
}
