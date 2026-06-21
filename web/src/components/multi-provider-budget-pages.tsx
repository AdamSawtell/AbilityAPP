"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import {
  buildMultiProviderBudgetRows,
  multiProviderBudgetCsv,
  summarizeMultiProviderBudget,
} from "@/lib/multi-provider-budget";
import { downloadCsv } from "@/lib/reports/export";

export function MultiProviderBudgetView() {
  const { clients } = useData();
  const { canWriteWindow } = useAuth();
  const canExport = canWriteWindow("multi-provider-budget");

  const [providerFilter, setProviderFilter] = useState("");

  const rows = useMemo(() => buildMultiProviderBudgetRows(clients), [clients]);
  const digest = useMemo(() => summarizeMultiProviderBudget(rows), [rows]);

  const providerOptions = useMemo(() => {
    const providers = new Set(rows.map((row) => row.provider));
    return [...providers].sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!providerFilter) return rows;
    return rows.filter((row) => row.provider === providerFilter);
  }, [rows, providerFilter]);

  const handleExport = () => {
    downloadCsv("multi-provider-budget.csv", multiProviderBudgetCsv(filteredRows));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Compare NDIS plan budget allocations across providers for each participant. Set the plan provider on each budget
        line on the client Plan budget tab when the participant receives support from more than one organisation.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Plan provider</span>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All providers</option>
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        {canExport ? (
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredRows.length}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        ) : null}
        <Link
          href="/service-planning"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Service planning
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Providers</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.providerCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Participants</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.clientCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Allocated</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatPlanBudgetCurrency(digest.totalAllocated)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatPlanBudgetCurrency(digest.totalRemaining)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Allocated</th>
              <th className="px-4 py-3">Claimed</th>
              <th className="px-4 py-3">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((row) => {
                const client = clients.find((c) => c.id === row.clientId);
                return (
                  <tr
                    key={`${row.provider}-${row.clientId}-${row.supportBudget}-${row.supportCategory}`}
                    className="border-b border-slate-100"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{row.provider}</td>
                    <td className="px-4 py-3">
                      {client ? (
                        <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} />
                      ) : (
                        row.clientName
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.supportBudget || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.supportCategory || "—"}</td>
                    <td className="px-4 py-3">{formatPlanBudgetCurrency(row.allocatedAmount)}</td>
                    <td className="px-4 py-3">{formatPlanBudgetCurrency(row.claimedAmount)}</td>
                    <td className="px-4 py-3">{formatPlanBudgetCurrency(row.remainingAmount)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No plan budget lines with provider labels yet — add budget lines on client records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
