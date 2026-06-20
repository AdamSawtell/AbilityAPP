import { evaluateFinancialClose, type FinancialCloseContext } from "@/lib/financial-close";
import { currentPlanMonthIso } from "@/lib/monthly-service-plan";
import type { ReportResult } from "@/lib/reports/types";

export function buildFinancialCloseSummaryReport(
  ctx: FinancialCloseContext,
  closeMonth = currentPlanMonthIso()
): ReportResult {
  const evaluation = evaluateFinancialClose(ctx, closeMonth);

  return {
    columns: [
      { id: "closeMonth", label: "Close month" },
      { id: "check", label: "Check" },
      { id: "status", label: "Status" },
      { id: "message", label: "Message" },
      { id: "count", label: "Count" },
    ],
    rows: evaluation.checks.map((check) => ({
      closeMonth: evaluation.closeMonth,
      check: check.label,
      status: check.status,
      message: check.message,
      count: check.count != null ? String(check.count) : "",
    })),
  };
}
