"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-store";
import {
  formatMarginCurrency,
  summarizePeriodProfitability,
} from "@/lib/shift-profitability";
import { formatPayPeriodLabel } from "@/lib/pay-period";

export function ShiftProfitabilityPanel({
  periodStart,
  periodEnd,
  title = "Shift profitability",
}: {
  periodStart: string;
  periodEnd: string;
  title?: string;
}) {
  const { rosterShifts, employees, serviceBookings, payPeriodDefinitions, payPeriodInstances } = useData();

  const summary = useMemo(
    () => summarizePeriodProfitability(rosterShifts, employees, serviceBookings, periodStart, periodEnd),
    [rosterShifts, employees, serviceBookings, periodStart, periodEnd]
  );

  const periodLabel = useMemo(() => {
    const instance = payPeriodInstances.find(
      (row) => row.startDate === periodStart && row.endDate === periodEnd
    );
    const definition = payPeriodDefinitions.find((row) => row.id === instance?.definitionId);
    if (definition && instance) {
      return formatPayPeriodLabel(definition, instance.startDate, instance.endDate);
    }
    return `${periodStart} – ${periodEnd}`;
  }, [payPeriodDefinitions, payPeriodInstances, periodStart, periodEnd]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">
        SCHADS-based shift cost vs billable income for <strong>{periodLabel}</strong> (planning baseline — not payroll).
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Staffed shifts</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.shiftCount}</dd>
          <dd className="text-xs text-slate-500">{summary.totalHours.toFixed(1)}h</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Total cost</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{formatMarginCurrency(summary.totalCost)}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Total income</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">{formatMarginCurrency(summary.totalIncome)}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Margin</dt>
          <dd
            className={`mt-1 text-2xl font-semibold ${
              summary.totalMargin >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatMarginCurrency(summary.totalMargin)}
          </dd>
          {summary.marginPct != null ? (
            <dd className="text-xs text-slate-500">{summary.marginPct}% of income</dd>
          ) : null}
        </div>
      </dl>

      {summary.lossMakingShifts > 0 ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>{summary.lossMakingShifts}</strong> shift{summary.lossMakingShifts === 1 ? "" : "s"} where cost
          exceeds income — review Sunday/evening casual rostering or billing rates.
        </p>
      ) : summary.shiftCount > 0 ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          No loss-making staffed shifts in this period on the planning baseline.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No staffed shifts in this date range.</p>
      )}
    </section>
  );
}
