"use client";

import { useMemo, useState } from "react";
import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import { useData } from "@/lib/data-store";
import {
  applyBillingClaimedRollup,
  summarizePlanBudgetClaimedRollup,
} from "@/lib/plan-budget-claimed-rollup";

export function ClientPlanBudgetClaimedPanel({
  clientId,
  rows,
  readOnly,
  onApply,
}: {
  clientId: string;
  rows: ClientPlanBudgetRow[];
  readOnly?: boolean;
  onApply: (rows: ClientPlanBudgetRow[]) => void;
}) {
  const { claims, invoices } = useData();
  const [message, setMessage] = useState("");

  const summary = useMemo(
    () => summarizePlanBudgetClaimedRollup(clientId, rows, claims, invoices),
    [clientId, rows, claims, invoices]
  );

  if (!rows.length) return null;

  const hasBilling = summary.totalBillingClaimed > 0;
  const hasDelta = summary.lines.some((line) => Math.abs(line.delta) > 0.01);

  function handleApply() {
    const next = applyBillingClaimedRollup(rows, clientId, claims, invoices);
    onApply(next);
    setMessage("Applied billing rollup to claimed amounts. Save the client record to persist.");
  }

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Billing claimed rollup</h3>
      <p className="mt-1 text-sm text-slate-600">
        Compare plan budget claimed amounts to submitted claims and sent invoices for this participant. Apply to sync
        the claimed column from billing records.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Billing total</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatPlanBudgetCurrency(summary.totalBillingClaimed)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Manual claimed</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatPlanBudgetCurrency(rows.reduce((sum, row) => sum + (Number(row.claimedAmount) || 0), 0))}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Categories with billing</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {summary.lines.filter((line) => line.billingClaimed > 0).length}
          </p>
        </div>
      </div>

      {hasBilling ? (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Manual</th>
                <th className="py-2 pr-4">Billing</th>
                <th className="py-2">Delta</th>
              </tr>
            </thead>
            <tbody>
              {summary.lines.map((line) => (
                <tr key={line.rowId} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-800">{line.supportCategory || "—"}</td>
                  <td className="py-2 pr-4 text-slate-700">{formatPlanBudgetCurrency(line.manualClaimed)}</td>
                  <td className="py-2 pr-4 text-slate-700">{formatPlanBudgetCurrency(line.billingClaimed)}</td>
                  <td
                    className={`py-2 font-medium ${
                      Math.abs(line.delta) > 0.01 ? "text-amber-800" : "text-emerald-800"
                    }`}
                  >
                    {line.delta >= 0 ? "+" : ""}
                    {formatPlanBudgetCurrency(line.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No submitted claims or sent invoices for this participant yet — claimed amounts stay manual until billing
          exists.
        </p>
      )}

      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      {!readOnly && hasBilling && hasDelta ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Apply billing rollup
          </button>
        </div>
      ) : null}
    </section>
  );
}
