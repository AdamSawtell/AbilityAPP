"use client";

import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import {
  formatPlanBudgetCurrency,
  planBudgetUtilisationPct,
  summarizePlanBudgets,
} from "@/lib/client-plan-budget";

export function ClientPlanBudgetSummary({ rows }: { rows: ClientPlanBudgetRow[] }) {
  const { overall, bySupportBudget } = summarizePlanBudgets(rows);
  const utilisation = planBudgetUtilisationPct(overall);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        No plan budget lines yet. Add categories from the participant&apos;s NDIS plan to track allocation and
        utilisation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total allocated</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatPlanBudgetCurrency(overall.allocated)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Claimed to date</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatPlanBudgetCurrency(overall.claimed)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-emerald-900">{formatPlanBudgetCurrency(overall.remaining)}</p>
          {utilisation != null ? (
            <p className="mt-0.5 text-xs text-emerald-800">{utilisation}% utilised</p>
          ) : null}
        </div>
      </div>

      {Object.keys(bySupportBudget).length > 1 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Support budget</th>
                <th className="px-3 py-2 font-medium">Allocated</th>
                <th className="px-3 py-2 font-medium">Claimed</th>
                <th className="px-3 py-2 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(bySupportBudget).map(([budget, totals]) => (
                <tr key={budget}>
                  <td className="px-3 py-2 font-medium text-slate-900">{budget}</td>
                  <td className="px-3 py-2 text-slate-700">{formatPlanBudgetCurrency(totals.allocated)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatPlanBudgetCurrency(totals.claimed)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatPlanBudgetCurrency(totals.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
