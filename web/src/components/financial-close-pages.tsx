"use client";

import { FinancialCloseMonthPanel } from "@/components/financial-close-month-panel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  evaluateFinancialClose,
  financialCloseCsv,
  financialCloseStatusClass,
  type FinancialCloseContext,
} from "@/lib/financial-close";
import { formatPlanMonthLabel, currentPlanMonthIso } from "@/lib/monthly-service-plan";
import { downloadCsv } from "@/lib/reports/export";

function buildContext(data: ReturnType<typeof useData>): FinancialCloseContext {
  return {
    clients: data.clients,
    monthlyServicePlans: data.monthlyServicePlans,
    timesheets: data.timesheets,
    claims: data.claims,
    invoices: data.invoices,
    payrollClosedPeriods: data.payrollClosedPeriods,
    financialClosedMonths: data.financialClosedMonths,
    rosterShifts: data.rosterShifts,
  };
}

export function FinancialCloseView() {
  const data = useData();
  const { canWriteWindow, canWindow } = useAuth();
  const canView = canWindow("financial-close");
  const canExport = canWriteWindow("financial-close");

  const [closeMonth, setCloseMonth] = useState(currentPlanMonthIso());

  const ctx = useMemo(() => buildContext(data), [data]);
  const evaluation = useMemo(() => evaluateFinancialClose(ctx, closeMonth), [ctx, closeMonth]);

  if (!canView) {
    return (
      <p className="text-sm text-slate-500">
        Your role does not have access to financial close. Ask an administrator to grant the Financial close window.
      </p>
    );
  }

  const monthOptions = useMemo(() => {
    const months = new Set(data.monthlyServicePlans.map((plan) => plan.planMonth).filter(Boolean));
    for (const claim of data.claims) {
      if (claim.periodStart) months.add(claim.periodStart.slice(0, 7));
    }
    for (const invoice of data.invoices) {
      if (invoice.periodStart) months.add(invoice.periodStart.slice(0, 7));
    }
    months.add(closeMonth);
    return [...months].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [data.claims, data.invoices, data.monthlyServicePlans, closeMonth]);

  const handleExport = () => {
    downloadCsv(`financial-close-${closeMonth}.csv`, financialCloseCsv(evaluation));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Month-end financial close checklist — confirm plan delivery, NDIS remittance, participant invoices, and payroll
        reconciliation before you sign off the period.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Close month</span>
          <input
            type="month"
            value={closeMonth}
            onChange={(e) => setCloseMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {monthOptions.length > 1 ? (
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Quick pick</span>
            <select
              value={closeMonth}
              onChange={(e) => setCloseMonth(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatPlanMonthLabel(month)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {canExport ? (
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        ) : null}
        <Link
          href="/invoice-reconciliation"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Invoice reconciliation
        </Link>
        <Link
          href="/ndis-audit-pack"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          NDIS audit pack
        </Link>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 ${
          evaluation.readyToClose
            ? "border-emerald-200 bg-emerald-50/80"
            : "border-amber-200 bg-amber-50/80"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">
          {evaluation.readyToClose ? "Ready for financial close" : "Close blocked — resolve items below"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Period {evaluation.periodStart} – {evaluation.periodEnd} · {formatPlanMonthLabel(evaluation.closeMonth)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan variance</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{evaluation.summary.planVarianceCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Claim gaps</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {evaluation.summary.claimNotImportedCount + evaluation.summary.claimVarianceCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Draft invoices</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{evaluation.summary.draftInvoiceCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Payroll blocks</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{evaluation.summary.payrollBlockCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {evaluation.checks.map((check) => (
          <div
            key={check.code}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-900">{check.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${financialCloseStatusClass(check.status)}`}
                >
                  {check.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{check.message}</p>
            </div>
            {check.href ? (
              <Link
                href={check.href}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Review
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <FinancialCloseMonthPanel />
    </div>
  );
}
