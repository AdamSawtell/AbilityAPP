import { evaluateFinancialClose, type FinancialCloseContext } from "@/lib/financial-close";
import { planMonthDateRange } from "@/lib/plan-vs-actual-reconciliation";

export type FinancialClosedMonthRecord = {
  id: string;
  closeMonth: string;
  periodStart: string;
  periodEnd: string;
  closedAt: string;
  closedBy: string;
  notes: string;
};

export function financialClosedMonthId(closeMonth: string): string {
  return `fcm-${closeMonth}`;
}

export function buildFinancialClosedMonthRecord(input: {
  closeMonth: string;
  closedBy: string;
  notes?: string;
}): FinancialClosedMonthRecord {
  const { start, end } = planMonthDateRange(input.closeMonth);
  return {
    id: financialClosedMonthId(input.closeMonth),
    closeMonth: input.closeMonth,
    periodStart: start,
    periodEnd: end,
    closedAt: new Date().toISOString(),
    closedBy: input.closedBy,
    notes: input.notes?.trim() ?? "",
  };
}

export function isFinancialMonthClosed(
  closeMonth: string,
  closedMonths: FinancialClosedMonthRecord[]
): boolean {
  return closedMonths.some((row) => row.closeMonth === closeMonth);
}

export function canCloseFinancialMonth(
  ctx: FinancialCloseContext,
  closeMonth: string,
  closedMonths: FinancialClosedMonthRecord[]
): { ready: boolean; evaluation: ReturnType<typeof evaluateFinancialClose>; message: string } {
  if (isFinancialMonthClosed(closeMonth, closedMonths)) {
    return {
      ready: false,
      evaluation: evaluateFinancialClose(ctx, closeMonth),
      message: "This month is already marked closed.",
    };
  }
  const evaluation = evaluateFinancialClose(ctx, closeMonth);
  if (!evaluation.readyToClose) {
    return {
      ready: false,
      evaluation,
      message: "Resolve blocking checklist items before closing the month.",
    };
  }
  return { ready: true, evaluation, message: "" };
}
