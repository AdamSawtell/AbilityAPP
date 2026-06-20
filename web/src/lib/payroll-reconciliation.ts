import { normalizeTimesheet, type TimesheetRecord } from "@/lib/timesheet";

export const PAYROLL_RECONCILE_STATUSES = ["Pending", "Matched", "Variance"] as const;
export type PayrollReconcileStatus = (typeof PAYROLL_RECONCILE_STATUSES)[number];

/** Hours difference within this tolerance counts as Matched. */
export const PAYROLL_RECONCILE_TOLERANCE_HOURS = 0.05;

export type PayrollReconcileInput = {
  paidHours: number;
  payRunRef: string;
  updatedBy: string;
  now?: Date;
};

export type PayrollReconcilePreview = {
  exportedHours: number;
  paidHours: number;
  varianceHours: number;
  status: PayrollReconcileStatus;
};

export function canReconcileTimesheet(
  sheet: TimesheetRecord
): { ok: true } | { ok: false; message: string } {
  if (sheet.status !== "Approved") {
    return { ok: false, message: `${sheet.documentNo} must be Approved before reconciliation.` };
  }
  if (sheet.payrollExportStatus === "Not exported") {
    return { ok: false, message: `${sheet.documentNo} has not been exported to payroll yet.` };
  }
  if (!sheet.totalHours || sheet.totalHours <= 0) {
    return { ok: false, message: `${sheet.documentNo} has no hours to reconcile.` };
  }
  return { ok: true };
}

export function previewPayrollReconciliation(
  sheet: TimesheetRecord,
  paidHours: number
): PayrollReconcilePreview {
  const exportedHours = Math.round(sheet.totalHours * 100) / 100;
  const paid = Math.round(paidHours * 100) / 100;
  const varianceHours = Math.round((exportedHours - paid) * 100) / 100;
  const status: PayrollReconcileStatus =
    Math.abs(varianceHours) <= PAYROLL_RECONCILE_TOLERANCE_HOURS ? "Matched" : "Variance";
  return { exportedHours, paidHours: paid, varianceHours, status };
}

export function applyPayrollReconciliation(
  sheet: TimesheetRecord,
  input: PayrollReconcileInput
): TimesheetRecord {
  const gate = canReconcileTimesheet(sheet);
  if (!gate.ok) throw new Error(gate.message);
  if (!Number.isFinite(input.paidHours) || input.paidHours < 0) {
    throw new Error("Enter paid hours from your payroll system.");
  }
  const payRunRef = input.payRunRef.trim();
  if (!payRunRef) throw new Error("Enter a pay run reference from Keypay or Xero.");

  const preview = previewPayrollReconciliation(sheet, input.paidHours);
  const reconciledAt = (input.now ?? new Date()).toISOString();

  return normalizeTimesheet({
    ...sheet,
    payrollPaidHours: preview.paidHours,
    payrollPayRunRef: payRunRef,
    payrollReconcileStatus: preview.status,
    payrollReconciledAt: reconciledAt,
    payrollExportStatus: "Processed",
    updatedBy: input.updatedBy,
  });
}

export function payrollReconcileStatusClass(status: string): string {
  switch (status) {
    case "Matched":
      return "bg-emerald-100 text-emerald-950";
    case "Variance":
      return "bg-amber-100 text-amber-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function formatReconcileVariance(hours: number): string {
  const sign = hours > 0 ? "+" : "";
  return `${sign}${hours.toFixed(2)}h`;
}

export function exportedTimesheetsForReconciliation(timesheets: TimesheetRecord[]): TimesheetRecord[] {
  return timesheets
    .filter(
      (s) =>
        s.status === "Approved" &&
        s.payrollExportStatus !== "Not exported" &&
        s.totalHours > 0
    )
    .sort((a, b) => (b.payrollExportedAt || b.periodStart).localeCompare(a.payrollExportedAt || a.periodStart));
}
