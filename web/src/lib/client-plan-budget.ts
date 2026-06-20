import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";

export type PlanBudgetTotals = {
  allocated: number;
  claimed: number;
  remaining: number;
};

export type PlanBudgetTotalsBySupport = Record<string, PlanBudgetTotals>;

function parseAmount(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function planBudgetRemaining(row: Pick<ClientPlanBudgetRow, "allocatedAmount" | "claimedAmount">): number {
  return Math.max(0, parseAmount(row.allocatedAmount) - parseAmount(row.claimedAmount));
}

export function summarizePlanBudgets(rows: ClientPlanBudgetRow[]): {
  overall: PlanBudgetTotals;
  bySupportBudget: PlanBudgetTotalsBySupport;
} {
  const bySupportBudget: PlanBudgetTotalsBySupport = {};
  let allocated = 0;
  let claimed = 0;

  for (const row of rows) {
    const rowAllocated = parseAmount(row.allocatedAmount);
    const rowClaimed = parseAmount(row.claimedAmount);
    allocated += rowAllocated;
    claimed += rowClaimed;

    const key = row.supportBudget.trim() || "Unspecified";
    if (!bySupportBudget[key]) {
      bySupportBudget[key] = { allocated: 0, claimed: 0, remaining: 0 };
    }
    bySupportBudget[key].allocated += rowAllocated;
    bySupportBudget[key].claimed += rowClaimed;
    bySupportBudget[key].remaining = Math.max(0, bySupportBudget[key].allocated - bySupportBudget[key].claimed);
  }

  return {
    overall: {
      allocated,
      claimed,
      remaining: Math.max(0, allocated - claimed),
    },
    bySupportBudget,
  };
}

export function formatPlanBudgetCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function planBudgetUtilisationPct(totals: PlanBudgetTotals): number | null {
  if (totals.allocated <= 0) return null;
  return Math.round((totals.claimed / totals.allocated) * 100);
}
