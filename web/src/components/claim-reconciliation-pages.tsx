"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import {
  buildClaimReconcileRows,
  CLAIM_RECONCILE_STATUSES,
  claimReconcileCsv,
  claimReconcileStatusClass,
  summarizeClaimReconciliation,
} from "@/lib/claim-reconciliation";
import { formatClaimPeriod } from "@/lib/claim";
import { useData } from "@/lib/data-store";
import { currentPlanMonthIso } from "@/lib/monthly-service-plan";
import { downloadCsv } from "@/lib/reports/export";

export function ClaimReconciliationView() {
  const { claims, clients } = useData();
  const { canWriteWindow } = useAuth();
  const canExport = canWriteWindow("claim-reconciliation");

  const [periodMonth, setPeriodMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => buildClaimReconcileRows(claims, periodMonth), [claims, periodMonth]);
  const digest = useMemo(() => summarizeClaimReconciliation(rows), [rows]);

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((row) => (row.remittanceStatus || "Not imported") === statusFilter);
  }, [rows, statusFilter]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    for (const claim of claims) {
      if (claim.periodStart) months.add(claim.periodStart.slice(0, 7));
      if (claim.periodEnd) months.add(claim.periodEnd.slice(0, 7));
    }
    if (periodMonth) months.add(periodMonth);
    return [...months].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [claims, periodMonth]);

  const handleExport = () => {
    const content = claimReconcileCsv(filteredRows, clients);
    const suffix = periodMonth || currentPlanMonthIso();
    downloadCsv(`claim-reconciliation-${suffix}.csv`, content);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Review submitted and accepted NDIS claims against remittance payments. Use this dashboard before financial close
        to find unmatched batches and payment variances.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Claim period month</span>
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All periods</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Remittance status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All claims</option>
            {CLAIM_RECONCILE_STATUSES.map((status) => (
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
        <Link
          href="/claims"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Claims list
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Submitted claims</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.claimCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Not imported</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.notImportedCount}</p>
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
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Partial</p>
          <p className="mt-1 text-lg font-semibold text-sky-900">{digest.partialCount}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Claimed amount</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">${digest.totalClaimedAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Paid amount</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">${digest.totalPaidAmount.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Variance ${digest.totalVarianceAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Claim</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Gateway ref</th>
              <th className="px-4 py-3">Claimed $</th>
              <th className="px-4 py-3">Paid $</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const client = clients.find((c) => c.id === row.clientId);
              return (
                <tr key={row.claimId} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/claims/${row.claimId}`} className="font-medium text-[#b51266] hover:underline">
                      {row.documentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {client ? (
                      <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} />
                    ) : (
                      row.clientId
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatClaimPeriod({ periodStart: row.periodStart, periodEnd: row.periodEnd })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.gatewayRef || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">${row.claimedAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">${row.paidAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${claimReconcileStatusClass(row.remittanceStatus)}`}
                    >
                      {row.remittanceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.reconcileMessage}</td>
                </tr>
              );
            })}
            {!filteredRows.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No submitted claims to reconcile — generate and submit claims first, then import remittance from the
                  Claims list.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
