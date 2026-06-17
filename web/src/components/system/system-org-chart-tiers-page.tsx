"use client";

import { useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useOrgChartTierConfig } from "@/lib/org-chart-tier-config-store";
import type { OrgChartTierConfigRecord } from "@/lib/org-chart-tier-config";

export function SystemOrgChartTiersView() {
  const { tiers, upsertTier, source } = useOrgChartTierConfig();
  const [draft, setDraft] = useState<OrgChartTierConfigRecord | null>(null);
  const record = draft ?? tiers[0] ?? null;

  function openTier(tier: number) {
    const row = tiers.find((t) => t.tier === tier);
    if (!row) return;
    setDraft({ ...row });
  }

  function patch(partial: Partial<OrgChartTierConfigRecord>) {
    if (!record) return;
    setDraft({ ...record, ...partial });
  }

  function save() {
    if (!draft) return;
    upsertTier(draft);
    setDraft(null);
  }

  return (
    <SystemShell
      title="Org chart tiers"
      subtitle="Define band labels and order for the workforce org chart. Assigning positions to tiers stays in Workforce planning."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Organisation", href: "/system/organization" },
        { label: "Org chart tiers" },
      ]}
      audit={{ moduleLabel: "System — org chart tiers" }}
    >
      <p className="mb-4 text-sm text-slate-500">
        {source === "supabase"
          ? "Stored in Supabase — shared across workspace and Amplify."
          : "Using local defaults until Supabase is configured."}
      </p>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {tiers.map((t) => (
            <li key={t.tier}>
              <button
                type="button"
                onClick={() => openTier(t.tier)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  record?.tier === t.tier
                    ? "bg-[#fdf2f8] font-medium text-[#b51266]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">Band {t.tier}</span>
              </button>
            </li>
          ))}
        </ul>

        {record ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Tier {record.tier}</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-medium text-slate-700">
                Label
                <input
                  type="text"
                  value={draft?.label ?? record.label}
                  onChange={(e) => patch({ label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Hint
                <input
                  type="text"
                  value={draft?.hint ?? record.hint}
                  onChange={(e) => patch({ hint: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Sort order
                <input
                  type="number"
                  value={draft?.sortOrder ?? record.sortOrder}
                  onChange={(e) => patch({ sortOrder: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft?.active ?? record.active}
                  onChange={(e) => patch({ active: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Active on chart
              </label>
              {draft ? (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={save}
                    className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
                  >
                    Save tier
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </SystemShell>
  );
}
