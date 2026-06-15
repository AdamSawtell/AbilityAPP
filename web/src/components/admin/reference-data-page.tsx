"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useReferenceDataAdmin } from "@/lib/config-store";
import { referenceDataMeta, type ReferenceDataGroup } from "@/lib/reference-data";

export function ReferenceDataAdminView() {
  const { catalog, keysByGroup, setOptions, resetKey, resetAll } = useReferenceDataAdmin();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  const groups = [...keysByGroup.keys()] as ReferenceDataGroup[];

  function openKey(key: string) {
    setActiveKey(key);
    setDraftText((catalog[key] ?? []).join("\n"));
  }

  function saveKey() {
    if (!activeKey) return;
    const options = draftText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    setOptions(activeKey, options);
  }

  return (
    <AppShell
      title="Reference data"
      subtitle="Configure dropdown options used across clients, support plans, products, and services."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin/reference-data" }, { label: "Reference data" }]}
      actions={
        <button
          type="button"
          onClick={resetAll}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Reset all to defaults
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {groups.map((group) => (
            <section key={group} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</h2>
              <ul className="space-y-0.5">
                {(keysByGroup.get(group) ?? []).map((key) => {
                  const meta = referenceDataMeta[key];
                  const count = catalog[key]?.length ?? 0;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => openKey(key)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                          activeKey === key
                            ? "bg-[#fdf2f8] font-medium text-[#b51266]"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{meta?.label ?? key}</span>
                        <span className="text-xs text-slate-400">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="lg:col-span-2">
          {activeKey ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {referenceDataMeta[activeKey]?.label ?? activeKey}
                  </h2>
                  {referenceDataMeta[activeKey]?.description ? (
                    <p className="mt-1 text-sm text-slate-500">{referenceDataMeta[activeKey].description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => resetKey(activeKey)}
                  className="text-sm font-medium text-slate-600 hover:text-[#b51266]"
                >
                  Reset to default
                </button>
              </div>
              <p className="mb-2 text-xs text-slate-500">One option per line</p>
              <textarea
                className="min-h-[320px] w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <button
                type="button"
                onClick={saveKey}
                className="mt-4 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                Save options
              </button>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
              Select a list on the left to edit its options.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
