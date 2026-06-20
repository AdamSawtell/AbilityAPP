"use client";

import { useEffect, useState } from "react";
import { PortalGuard, PortalLogoutButton } from "@/components/portal/portal-hub-page";
import { PortalNav, PortalShell } from "@/components/portal/portal-shell";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import type { PortalBudgetView } from "@/lib/portal/types";

export function PortalBudgetPage() {
  const [budget, setBudget] = useState<PortalBudgetView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/budget", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { budget: PortalBudgetView };
        setBudget(data.budget);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalGuard>
      {(session) => (
        <PortalShell
          title="My funding"
          subtitle={`Plan budget summary for ${session.displayName}`}
          actions={<PortalLogoutButton />}
        >
          <PortalNav active="budget" />

          {loading ? (
            <p className="text-sm text-slate-500">Loading budget…</p>
          ) : budget && budget.lines.length ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Allocated</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatPlanBudgetCurrency(budget.overall.allocated)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Used</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatPlanBudgetCurrency(budget.overall.claimed)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Remaining</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-700">
                    {formatPlanBudgetCurrency(budget.overall.remaining)}
                  </p>
                </div>
              </div>

              {budget.utilisationPct !== null ? (
                <p className="text-sm text-slate-600">
                  About <strong>{budget.utilisationPct}%</strong> of your plan budget has been used so far.
                </p>
              ) : null}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Budget</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Allocated</th>
                      <th className="px-4 py-3 font-medium">Used</th>
                      <th className="px-4 py-3 font-medium">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budget.lines.map((line, index) => (
                      <tr key={`${line.supportBudget}-${line.supportCategory}-${index}`}>
                        <td className="px-4 py-3 text-slate-800">{line.supportBudget}</td>
                        <td className="px-4 py-3 text-slate-700">{line.supportCategory}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatPlanBudgetCurrency(line.allocated)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatPlanBudgetCurrency(line.claimed)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-700">
                          {formatPlanBudgetCurrency(line.remaining)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
              <p className="text-sm text-slate-600">Plan budget details are not available yet.</p>
              <p className="mt-1 text-xs text-slate-500">Your provider will publish budget lines on your client record.</p>
            </div>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
