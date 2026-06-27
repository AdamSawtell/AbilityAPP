import { localDateIso } from "@/lib/booking-cancellation";
import type { TimesheetRecord } from "@/lib/timesheet";
import {
  defaultPayPeriodRange as defaultPayPeriodRangeFromInstances,
  formatPayPeriodLabel,
  normalizePayPeriodInstance,
  type PayPeriodDefinitionRecord,
  type PayPeriodInstanceRecord,
} from "@/lib/pay-period";

export type PayrollPeriodCloseCheckStatus = "pass" | "warning" | "block";

export type PayrollPeriodCloseCheck = {
  code: string;
  label: string;
  status: PayrollPeriodCloseCheckStatus;
  message: string;
  count?: number;
};

export type PayrollPeriodCloseEvaluation = {
  periodStart: string;
  periodEnd: string;
  checks: PayrollPeriodCloseCheck[];
  readyToClose: boolean;
  closed: boolean;
  summary: {
    timesheetCount: number;
    approvedCount: number;
    exportedCount: number;
    reconciledCount: number;
    varianceCount: number;
    pendingReconcileCount: number;
    totalHours: number;
  };
};

export type PayrollPeriodCloseRecord = {
  id: string;
  periodStart: string;
  periodEnd: string;
  closedAt: string;
  closedBy: string;
  payRunRef: string;
  notes: string;
};

export function payrollClosedPeriodId(periodStart: string, periodEnd: string): string {
  return `pcp-${periodStart}-${periodEnd}`;
}

export function defaultPayrollPeriodRange(
  asOf = new Date(),
  payPeriodInstances: PayPeriodInstanceRecord[] = []
): { periodStart: string; periodEnd: string; instanceId?: string } {
  if (payPeriodInstances.length) {
    return defaultPayPeriodRangeFromInstances(payPeriodInstances, localDateIso(asOf));
  }
  const end = new Date(`${localDateIso(asOf)}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  return {
    periodStart: localDateIso(start),
    periodEnd: localDateIso(end),
  };
}

export function periodsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && endA >= startB;
}

export function timesheetsInPeriod(
  timesheets: TimesheetRecord[],
  periodStart: string,
  periodEnd: string
): TimesheetRecord[] {
  return timesheets.filter(
    (sheet) =>
      sheet.periodStart &&
      sheet.periodEnd &&
      periodsOverlap(sheet.periodStart, sheet.periodEnd, periodStart, periodEnd)
  );
}

export function isPayrollPeriodClosed(
  periodStart: string,
  periodEnd: string,
  closedPeriods: PayrollPeriodCloseRecord[]
): boolean {
  return closedPeriods.some((row) => periodsOverlap(row.periodStart, row.periodEnd, periodStart, periodEnd));
}

export function isPayPeriodClosedForRange(
  periodStart: string,
  periodEnd: string,
  closedPeriods: PayrollPeriodCloseRecord[],
  payPeriodInstances: PayPeriodInstanceRecord[] = []
): boolean {
  if (isPayrollPeriodClosed(periodStart, periodEnd, closedPeriods)) return true;
  return payPeriodInstances.some(
    (instance) =>
      normalizePayPeriodInstance(instance).status === "closed" &&
      periodsOverlap(instance.startDate, instance.endDate, periodStart, periodEnd)
  );
}

/** User-facing status for pay period picker options (instance status + payroll archive). */
export function payPeriodInstanceStatusLabel(
  instance: PayPeriodInstanceRecord,
  closedPeriods: PayrollPeriodCloseRecord[] = []
): string {
  const row = normalizePayPeriodInstance(instance);
  if (row.status === "closed") return "closed";
  if (row.status === "locked") return "locked";
  if (isPayrollPeriodClosed(row.startDate, row.endDate, closedPeriods)) return "payroll archived";
  return "open";
}

export function formatPayPeriodInstanceOptionLabel(
  definition: PayPeriodDefinitionRecord,
  instance: PayPeriodInstanceRecord,
  closedPeriods: PayrollPeriodCloseRecord[] = []
): string {
  return `${formatPayPeriodLabel(definition, instance.startDate, instance.endDate)} (${payPeriodInstanceStatusLabel(instance, closedPeriods)})`;
}

export function evaluatePayrollPeriodClose(
  timesheets: TimesheetRecord[],
  periodStart: string,
  periodEnd: string,
  closedPeriods: PayrollPeriodCloseRecord[],
  payPeriodInstances: PayPeriodInstanceRecord[] = []
): PayrollPeriodCloseEvaluation {
  const inPeriod = timesheetsInPeriod(timesheets, periodStart, periodEnd);
  const closed = isPayPeriodClosedForRange(periodStart, periodEnd, closedPeriods, payPeriodInstances);

  const draftOrSubmitted = inPeriod.filter((s) => s.status === "Draft" || s.status === "Submitted");
  const approved = inPeriod.filter((s) => s.status === "Approved");
  const notExported = approved.filter((s) => s.payrollExportStatus === "Not exported");
  const exported = approved.filter((s) => s.payrollExportStatus !== "Not exported");
  const pendingReconcile = exported.filter((s) => (s.payrollReconcileStatus || "Pending") === "Pending");
  const variance = exported.filter((s) => s.payrollReconcileStatus === "Variance");
  const matched = exported.filter((s) => s.payrollReconcileStatus === "Matched");
  const totalHours = Math.round(inPeriod.reduce((sum, s) => sum + (s.totalHours || 0), 0) * 100) / 100;

  const checks: PayrollPeriodCloseCheck[] = [];

  if (!inPeriod.length) {
    checks.push({
      code: "timesheets",
      label: "Timesheets in period",
      status: "block",
      message: "No timesheets overlap this pay period — generate and approve before closing.",
      count: 0,
    });
  } else {
    checks.push({
      code: "timesheets",
      label: "Timesheets in period",
      status: "pass",
      message: `${inPeriod.length} timesheet${inPeriod.length === 1 ? "" : "s"} overlap this period (${totalHours.toFixed(2)}h total).`,
      count: inPeriod.length,
    });
  }

  if (draftOrSubmitted.length) {
    checks.push({
      code: "approved",
      label: "All timesheets approved",
      status: "block",
      message: `${draftOrSubmitted.length} still Draft or Submitted — approve before payroll close.`,
      count: draftOrSubmitted.length,
    });
  } else if (inPeriod.length) {
    checks.push({
      code: "approved",
      label: "All timesheets approved",
      status: "pass",
      message: "Every timesheet in this period is Approved.",
      count: approved.length,
    });
  }

  if (approved.length && notExported.length) {
    checks.push({
      code: "exported",
      label: "Exported to payroll",
      status: "block",
      message: `${notExported.length} approved timesheet${notExported.length === 1 ? "" : "s"} not exported yet.`,
      count: notExported.length,
    });
  } else if (approved.length) {
    checks.push({
      code: "exported",
      label: "Exported to payroll",
      status: "pass",
      message: `${exported.length} approved timesheet${exported.length === 1 ? "" : "s"} exported or processed.`,
      count: exported.length,
    });
  }

  if (exported.length && pendingReconcile.length) {
    checks.push({
      code: "reconciled",
      label: "Payroll reconciliation",
      status: "block",
      message: `${pendingReconcile.length} exported timesheet${pendingReconcile.length === 1 ? "" : "s"} still Pending reconciliation.`,
      count: pendingReconcile.length,
    });
  } else if (exported.length) {
    checks.push({
      code: "reconciled",
      label: "Payroll reconciliation",
      status: variance.length ? "warning" : "pass",
      message: variance.length
        ? `${matched.length} matched · ${variance.length} with variance — review before archiving.`
        : `${matched.length} reconciled as Matched.`,
      count: matched.length + variance.length,
    });
  }

  if (closed) {
    checks.push({
      code: "closed",
      label: "Period status",
      status: "pass",
      message: "This pay period is already marked closed.",
    });
  }

  const readyToClose =
    !closed &&
    inPeriod.length > 0 &&
    !draftOrSubmitted.length &&
    !notExported.length &&
    !pendingReconcile.length;

  return {
    periodStart,
    periodEnd,
    checks,
    readyToClose,
    closed,
    summary: {
      timesheetCount: inPeriod.length,
      approvedCount: approved.length,
      exportedCount: exported.length,
      reconciledCount: matched.length + variance.length,
      varianceCount: variance.length,
      pendingReconcileCount: pendingReconcile.length,
      totalHours,
    },
  };
}

export function buildPayrollPeriodCloseRecord(input: {
  periodStart: string;
  periodEnd: string;
  closedBy: string;
  payRunRef: string;
  notes: string;
}): PayrollPeriodCloseRecord {
  return {
    id: payrollClosedPeriodId(input.periodStart, input.periodEnd),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    closedAt: new Date().toISOString(),
    closedBy: input.closedBy,
    payRunRef: input.payRunRef,
    notes: input.notes,
  };
}
