import type { ClaimRecord } from "@/lib/claim";
import { buildClaimReconcileRows } from "@/lib/claim-reconciliation";
import type { ClientRecord } from "@/lib/client";
import type { InvoiceRecord } from "@/lib/invoice";
import { currentPlanMonthIso, type MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";
import {
  buildPlanVsActualRows,
  planMonthDateRange,
  type PlanVsActualContext,
} from "@/lib/plan-vs-actual-reconciliation";
import {
  evaluatePayrollPeriodClose,
  type PayrollPeriodCloseRecord,
} from "@/lib/payroll-period-close";
import type { TimesheetRecord } from "@/lib/timesheet";

export type FinancialCloseCheckStatus = "pass" | "warning" | "block";

export type FinancialCloseCheck = {
  code: string;
  label: string;
  status: FinancialCloseCheckStatus;
  message: string;
  count?: number;
  href?: string;
};

export type FinancialCloseContext = {
  clients: ClientRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  payrollClosedPeriods: PayrollPeriodCloseRecord[];
};

export type FinancialCloseEvaluation = {
  closeMonth: string;
  periodStart: string;
  periodEnd: string;
  checks: FinancialCloseCheck[];
  readyToClose: boolean;
  summary: {
    planVarianceCount: number;
    planNoPlanCount: number;
    claimNotImportedCount: number;
    claimVarianceCount: number;
    draftInvoiceCount: number;
    payrollBlockCount: number;
  };
};

function invoiceOverlapsMonth(invoice: InvoiceRecord, month: string): boolean {
  const start = invoice.periodStart?.slice(0, 7) ?? "";
  const end = invoice.periodEnd?.slice(0, 7) ?? start;
  if (start === month || end === month) return true;
  if (!start || !end) return false;
  return start <= month && end >= month;
}

export function evaluateFinancialClose(
  ctx: FinancialCloseContext,
  closeMonth: string
): FinancialCloseEvaluation {
  const month = closeMonth?.trim() || currentPlanMonthIso();
  const { start: periodStart, end: periodEnd } = planMonthDateRange(month);

  const planCtx: PlanVsActualContext = {
    clients: ctx.clients,
    monthlyServicePlans: ctx.monthlyServicePlans,
    timesheets: ctx.timesheets,
    claims: ctx.claims,
    invoices: ctx.invoices,
  };
  const planRows = buildPlanVsActualRows(planCtx, month);
  const planVariance = planRows.filter((row) => row.reconcileStatus === "Variance");
  const planNoPlan = planRows.filter((row) => row.reconcileStatus === "No plan");

  const claimRows = buildClaimReconcileRows(ctx.claims, month);
  const claimNotImported = claimRows.filter((row) => row.remittanceStatus === "Not imported");
  const claimVariance = claimRows.filter(
    (row) => row.remittanceStatus === "Variance" || row.remittanceStatus === "Partial"
  );

  const draftInvoices = ctx.invoices.filter(
    (invoice) => invoice.status === "Draft" && invoiceOverlapsMonth(invoice, month)
  );

  const payrollEval = evaluatePayrollPeriodClose(
    ctx.timesheets,
    periodStart,
    periodEnd,
    ctx.payrollClosedPeriods
  );
  const payrollBlocks = payrollEval.checks.filter((check) => check.status === "block");
  const payrollWarnings = payrollEval.checks.filter((check) => check.status === "warning");

  const checks: FinancialCloseCheck[] = [];

  if (!planRows.length) {
    checks.push({
      code: "plan",
      label: "Plan vs actual",
      status: "warning",
      message: "No monthly plans or delivery recorded for this month.",
      href: "/plan-reconciliation",
    });
  } else if (planVariance.length) {
    checks.push({
      code: "plan",
      label: "Plan vs actual",
      status: "block",
      message: `${planVariance.length} participant${planVariance.length === 1 ? "" : "s"} with delivery variance — review before close.`,
      count: planVariance.length,
      href: "/plan-reconciliation",
    });
  } else if (planNoPlan.length) {
    checks.push({
      code: "plan",
      label: "Plan vs actual",
      status: "warning",
      message: `${planNoPlan.length} participant${planNoPlan.length === 1 ? "" : "s"} delivered without a monthly plan.`,
      count: planNoPlan.length,
      href: "/plan-reconciliation",
    });
  } else {
    checks.push({
      code: "plan",
      label: "Plan vs actual",
      status: "pass",
      message: `${planRows.length} participant${planRows.length === 1 ? "" : "s"} matched or have no delivery gaps.`,
      count: planRows.length,
      href: "/plan-reconciliation",
    });
  }

  if (!claimRows.length) {
    checks.push({
      code: "claims",
      label: "NDIS claim remittance",
      status: "pass",
      message: "No submitted claims for this month.",
      href: "/claim-reconciliation",
    });
  } else if (claimNotImported.length) {
    checks.push({
      code: "claims",
      label: "NDIS claim remittance",
      status: "block",
      message: `${claimNotImported.length} submitted claim${claimNotImported.length === 1 ? "" : "s"} awaiting remittance import.`,
      count: claimNotImported.length,
      href: "/claim-reconciliation",
    });
  } else if (claimVariance.length) {
    checks.push({
      code: "claims",
      label: "NDIS claim remittance",
      status: "block",
      message: `${claimVariance.length} claim${claimVariance.length === 1 ? "" : "s"} with remittance variance or partial match.`,
      count: claimVariance.length,
      href: "/claim-reconciliation",
    });
  } else {
    checks.push({
      code: "claims",
      label: "NDIS claim remittance",
      status: "pass",
      message: `${claimRows.length} submitted claim${claimRows.length === 1 ? "" : "s"} matched to remittance.`,
      count: claimRows.length,
      href: "/claim-reconciliation",
    });
  }

  if (draftInvoices.length) {
    checks.push({
      code: "invoices",
      label: "Participant invoices",
      status: "block",
      message: `${draftInvoices.length} draft invoice${draftInvoices.length === 1 ? "" : "s"} still open for this month — mark sent or void.`,
      count: draftInvoices.length,
      href: "/invoices",
    });
  } else {
    checks.push({
      code: "invoices",
      label: "Participant invoices",
      status: "pass",
      message: "No draft invoices remain for this month.",
      href: "/invoices",
    });
  }

  if (payrollBlocks.length) {
    checks.push({
      code: "payroll",
      label: "Payroll period",
      status: "block",
      message: payrollBlocks.map((check) => check.message).join(" "),
      count: payrollBlocks.length,
      href: "/timesheets",
    });
  } else if (payrollWarnings.length) {
    checks.push({
      code: "payroll",
      label: "Payroll period",
      status: "warning",
      message: payrollWarnings.map((check) => check.message).join(" "),
      count: payrollWarnings.length,
      href: "/timesheets",
    });
  } else if (payrollEval.closed) {
    checks.push({
      code: "payroll",
      label: "Payroll period",
      status: "pass",
      message: "Payroll period for this month is closed.",
      href: "/timesheets",
    });
  } else {
    checks.push({
      code: "payroll",
      label: "Payroll period",
      status: "pass",
      message: "Timesheets exported and reconciled for this month.",
      href: "/timesheets",
    });
  }

  const readyToClose = checks.every((check) => check.status !== "block");

  return {
    closeMonth: month,
    periodStart,
    periodEnd,
    checks,
    readyToClose,
    summary: {
      planVarianceCount: planVariance.length,
      planNoPlanCount: planNoPlan.length,
      claimNotImportedCount: claimNotImported.length,
      claimVarianceCount: claimVariance.length,
      draftInvoiceCount: draftInvoices.length,
      payrollBlockCount: payrollBlocks.length,
    },
  };
}

export function financialCloseStatusClass(status: FinancialCloseCheckStatus): string {
  switch (status) {
    case "pass":
      return "bg-emerald-100 text-emerald-950";
    case "warning":
      return "bg-amber-100 text-amber-950";
    default:
      return "bg-rose-100 text-rose-950";
  }
}

export function financialCloseCsv(evaluation: FinancialCloseEvaluation): string {
  const header = ["CloseMonth", "Check", "Status", "Message", "Count", "Link"].join(",");
  const lines = evaluation.checks.map((check) =>
    [
      evaluation.closeMonth,
      `"${check.label.replace(/"/g, '""')}"`,
      check.status,
      `"${check.message.replace(/"/g, '""')}"`,
      check.count ?? "",
      check.href ?? "",
    ].join(",")
  );
  return [header, ...lines].join("\r\n");
}
