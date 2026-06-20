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

export type PayrollReconcileDigest = {
  candidateCount: number;
  pendingCount: number;
  matchedCount: number;
  varianceCount: number;
  exportedHours: number;
  paidHours: number;
  varianceHours: number;
};

export function summarizePayrollReconciliationDigest(
  timesheets: TimesheetRecord[]
): PayrollReconcileDigest {
  const candidates = exportedTimesheetsForReconciliation(timesheets);
  let exportedHours = 0;
  let paidHours = 0;

  for (const sheet of candidates) {
    exportedHours += sheet.totalHours;
    paidHours += sheet.payrollPaidHours > 0 ? sheet.payrollPaidHours : 0;
  }

  return {
    candidateCount: candidates.length,
    pendingCount: candidates.filter((s) => (s.payrollReconcileStatus || "Pending") === "Pending").length,
    matchedCount: candidates.filter((s) => s.payrollReconcileStatus === "Matched").length,
    varianceCount: candidates.filter((s) => s.payrollReconcileStatus === "Variance").length,
    exportedHours: Math.round(exportedHours * 100) / 100,
    paidHours: Math.round(paidHours * 100) / 100,
    varianceHours: Math.round((exportedHours - paidHours) * 100) / 100,
  };
}

export function applyBatchPayrollReconciliation(
  sheets: TimesheetRecord[],
  input: {
    payRunRef: string;
    updatedBy: string;
    paidHoursForSheet?: (sheet: TimesheetRecord) => number;
    now?: Date;
  }
): { updated: TimesheetRecord[]; skipped: string[] } {
  const payRunRef = input.payRunRef.trim();
  if (!payRunRef) throw new Error("Enter a pay run reference from Keypay or Xero.");

  const paidHoursForSheet = input.paidHoursForSheet ?? ((sheet) => sheet.totalHours);
  const updated: TimesheetRecord[] = [];
  const skipped: string[] = [];

  for (const sheet of sheets) {
    const gate = canReconcileTimesheet(sheet);
    if (!gate.ok) {
      skipped.push(gate.message);
      continue;
    }
    try {
      updated.push(
        applyPayrollReconciliation(sheet, {
          paidHours: paidHoursForSheet(sheet),
          payRunRef,
          updatedBy: input.updatedBy,
          now: input.now,
        })
      );
    } catch (err) {
      skipped.push(err instanceof Error ? err.message : `${sheet.documentNo}: reconciliation failed.`);
    }
  }

  if (!updated.length && skipped.length) {
    throw new Error(skipped[0]);
  }

  return { updated, skipped };
}
