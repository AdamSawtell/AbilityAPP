import type { FinancialClosedMonthRecord } from "@/lib/financial-close-period";

export type FinancialClosedMonthRow = {
  id: string;
  close_month: string;
  period_start: string;
  period_end: string;
  closed_at: string;
  closed_by: string;
  notes: string;
};

export function financialClosedMonthFromRow(row: FinancialClosedMonthRow): FinancialClosedMonthRecord {
  return {
    id: row.id,
    closeMonth: row.close_month,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    notes: row.notes,
  };
}

export function financialClosedMonthToRow(record: FinancialClosedMonthRecord): FinancialClosedMonthRow {
  return {
    id: record.id,
    close_month: record.closeMonth,
    period_start: record.periodStart,
    period_end: record.periodEnd,
    closed_at: record.closedAt,
    closed_by: record.closedBy,
    notes: record.notes,
  };
}
