import type { OrgPositionRecord } from "@/lib/org-structure";
import { suggestChartTier } from "@/lib/org-chart-tiers";

/** Explicit chart tiers for leadership seed positions. */
const LEADERSHIP_CHART_TIERS: Record<string, number> = {
  "pos-board": 1,
  "pos-board-1": 2,
  "pos-board-2": 2,
  "pos-board-3": 2,
  "pos-board-4": 2,
  "pos-ceo": 3,
  "pos-exec-ops": 4,
  "pos-exec-hr": 4,
  "pos-exec-finance": 4,
  "pos-exec-ict": 4,
  "pos-exec-quality": 4,
  "pos-gm-ops": 5,
  "pos-rostering-manager": 5,
  "pos-coordinator": 5,
  "pos-intake": 5,
  "pos-plan-dev": 5,
  "pos-hr-manager": 5,
  "pos-hr-officer": 5,
  "pos-finance-manager": 5,
  "pos-contracts": 5,
  "pos-finance-officer": 5,
  "pos-ict-manager": 5,
  "pos-ict-officer": 5,
  "pos-quality-manager": 5,
  "pos-quality-officer": 5,
  "pos-rostering-officer": 5,
  "pos-support-worker": 7,
};

export function resolveChartTier(position: OrgPositionRecord): number {
  if (Number.isFinite(position.chartTier) && position.chartTier > 0) {
    return position.chartTier;
  }
  if (LEADERSHIP_CHART_TIERS[position.id] != null) {
    return LEADERSHIP_CHART_TIERS[position.id];
  }
  if (position.id.startsWith("pos-team-")) return 6;
  if (position.id.startsWith("pos-sw-")) return 7;
  return suggestChartTier(position);
}

export function withResolvedChartTier(position: OrgPositionRecord): OrgPositionRecord {
  return { ...position, chartTier: resolveChartTier(position) };
}
