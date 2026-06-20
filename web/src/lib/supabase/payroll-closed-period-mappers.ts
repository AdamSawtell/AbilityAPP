import type { PayrollPeriodCloseRecord } from "@/lib/payroll-period-close";

export type PayrollClosedPeriodRow = {
  id: string;
  period_start: string;
  period_end: string;
  closed_at: string;
  closed_by: string;
  pay_run_ref: string;
  notes: string;
};

export function payrollClosedPeriodFromRow(row: PayrollClosedPeriodRow): PayrollPeriodCloseRecord {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    payRunRef: row.pay_run_ref,
    notes: row.notes,
  };
}

export function payrollClosedPeriodToRow(record: PayrollPeriodCloseRecord): PayrollClosedPeriodRow {
  return {
    id: record.id,
    period_start: record.periodStart,
    period_end: record.periodEnd,
    closed_at: record.closedAt,
    closed_by: record.closedBy,
    pay_run_ref: record.payRunRef,
    notes: record.notes,
  };
}
