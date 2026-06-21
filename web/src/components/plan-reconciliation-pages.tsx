"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatPlanMonthLabel, currentPlanMonthIso } from "@/lib/monthly-service-plan";
import {
  buildPlanVsActualRows,
  PLAN_RECONCILE_STATUSES,
  planReconcileStatusClass,
  planVsActualCsv,
  summarizePlanVsActual,
  type PlanVsActualContext,
} from "@/lib/plan-vs-actual-reconciliation";
import { downloadCsv } from "@/lib/reports/export";

function buildContext(data: ReturnType<typeof useData>): PlanVsActualContext {
  return {
    clients: data.clients,
    monthlyServicePlans: data.monthlyServicePlans,
    timesheets: data.timesheets,
    claims: data.claims,
    invoices: data.invoices,
    rosterShifts: data.rosterShifts,
  };
}

export function PlanReconciliationView() {
  const data = useData();
  const { canWriteWindow } = useAuth();
  const canExport = canWriteWindow("plan-reconciliation");

  const [planMonth, setPlanMonth] = useState(currentPlanMonthIso());
  const [statusFilter, setStatusFilter] = useState("");

  const ctx = useMemo(() => buildContext(data), [data]);
  const rows = useMemo(() => buildPlanVsActualRows(ctx, planMonth), [ctx, planMonth]);
  const digest = useMemo(() => summarizePlanVsActual(rows), [rows]);

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.reconcileStatus === statusFilter);
  }, [rows, statusFilter]);

  const monthOptions = useMemo(() => {
    const months = new Set(ctx.monthlyServicePlans.map((p) => p.planMonth).filter(Boolean));
    months.add(planMonth);
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [ctx.monthlyServicePlans, planMonth]);

  const handleExport = () => {
    const content = planVsActualCsv(filteredRows, data.clients);
    downloadCsv(`plan-vs-actual-${planMonth}.csv`, content);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Compare monthly service plan delivery to approved timesheet hours and billed claim or invoice amounts. Use this
        before month-end close to flag participants who are off pace.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Plan month</span>
          <input
            type="month"
            value={planMonth}
            onChange={(e) => setPlanMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {monthOptions.length > 1 ? (
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Quick pick</span>
            <select
              value={planMonth}
              onChange={(e) => setPlanMonth(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatPlanMonthLabel(m)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Reconcile status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All participants</option>
            {PLAN_RECONCILE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        {canExport ? (
          <button
            type="button"
            onClick={handleExport}
            disabled={!rows.length}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Participants</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.participantCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Matched</p>
          <p className="mt-1 text-lg font-semibold text-emerald-900">{digest.matchedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Variance</p>
          <p className="mt-1 text-lg font-semibold text-amber-900">{digest.varianceCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">No actual delivery</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.noActualCount}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned hours</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.totalPlannedHours.toFixed(1)}h</p>
          <p className="text-xs text-slate-500">Actual {digest.totalActualHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned amount</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">${digest.totalPlannedAmount.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Billed ${digest.totalActualAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Planned h</th>
              <th className="px-4 py-3">Scheduled h</th>
              <th className="px-4 py-3">Actual h</th>
              <th className="px-4 py-3">Planned $</th>
              <th className="px-4 py-3">Billed $</th>
              <th className="px-4 py-3">Rejected $</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const client = data.clients.find((c) => c.id === row.clientId);
              return (
                <tr key={`${row.clientId}-${row.planMonth}`} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    {client ? (
                      <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} />
                    ) : (
                      row.clientId
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.monthlyPlanId ? (
                      <Link href={`/service-planning/${row.monthlyPlanId}`} className="text-[#b51266] hover:underline">
                        {row.monthlyPlanStatus || "Plan"}
                      </Link>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.plannedHours.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-700">{row.scheduledHours.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-700">{row.actualHours.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-700">${row.plannedAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">${row.actualAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.rejectedClaimAmount > 0 ? (
                      <span className="font-medium text-rose-800">${row.rejectedClaimAmount.toFixed(2)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${planReconcileStatusClass(row.reconcileStatus)}`}
                    >
                      {row.reconcileStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.reconcileMessage}</td>
                </tr>
              );
            })}
            {!filteredRows.length ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  No reconciliation rows for {formatPlanMonthLabel(planMonth)} — create a monthly service plan or approve
                  timesheets for this month.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
