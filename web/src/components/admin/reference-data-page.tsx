"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SystemShell } from "@/components/system/system-shell";
import { useReferenceDataAdmin } from "@/lib/config-store";
import { referenceDataMeta, type ReferenceDataGroup } from "@/lib/reference-data";
import { systemNavSectionLabel } from "@/lib/system/nav";
import {
  isSystemReferenceSectionKey,
  isSharedReferenceDataKey,
  referenceDataKeysByGroupForSection,
  referenceDataKeysForSection,
  type SystemReferenceSectionKey,
} from "@/lib/system/reference-data-sections";
import {
  formatReferenceDataUsage,
  referenceDataUsage,
  sharedReferenceDataUsage,
} from "@/lib/system/reference-data-usage";

export function ReferenceDataAdminView({
  variant = "workspace",
  sectionKey,
}: {
  variant?: "workspace" | "system";
  sectionKey?: string;
}) {
  const { catalog, keysByGroup, setOptions, resetKey, resetAll, source, usesBundledDefaults } =
    useReferenceDataAdmin();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");

  const systemSection: SystemReferenceSectionKey | null =
    variant === "system" && sectionKey && isSystemReferenceSectionKey(sectionKey) ? sectionKey : null;

  const filteredKeysByGroup = useMemo(() => {
    if (!systemSection) return keysByGroup;
    return referenceDataKeysByGroupForSection(systemSection);
  }, [keysByGroup, systemSection]);

  const groups = useMemo(
    () => [...filteredKeysByGroup.keys()] as ReferenceDataGroup[],
    [filteredKeysByGroup]
  );

  const sectionKeySet = useMemo(() => {
    if (!systemSection) return null;
    return new Set(referenceDataKeysForSection(systemSection));
  }, [systemSection]);

  const isDirty = useMemo(() => {
    if (!activeKey) return false;
    return draftText !== (catalog[activeKey] ?? []).join("\n");
  }, [activeKey, draftText, catalog]);

  function canLeaveDraft() {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }

  function openKey(key: string) {
    if (activeKey && key !== activeKey && !canLeaveDraft()) return;
    setActiveKey(key);
    setDraftText((catalog[key] ?? []).join("\n"));
    setSaveState("idle");
  }

  async function saveKey() {
    if (!activeKey) return;
    setSaveState("saving");
    setSaveError("");
    const options = draftText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      await setOptions(activeKey, options);
      setSaveState("saved");
    } catch {
      setSaveState("idle");
      setSaveError("Could not save options. Check your connection and try again.");
    }
  }

  function resetSectionToDefaults() {
    if (!canLeaveDraft()) return;
    if (!sectionKeySet) {
      resetAll();
      return;
    }
    for (const key of sectionKeySet) resetKey(key);
    if (activeKey && !sectionKeySet.has(activeKey)) {
      setActiveKey(null);
      setDraftText("");
    }
  }

  const Shell = variant === "system" ? SystemShell : AppShell;
  const sectionLabel = systemSection ? systemNavSectionLabel(systemSection) : null;
  const listCount = systemSection ? referenceDataKeysForSection(systemSection).length : null;
  const subtitle =
    source === "supabase"
      ? sectionLabel
        ? `Reference lists for ${sectionLabel}. Options are stored in Supabase and shared across devices.`
        : "Options are stored in Supabase and shared across devices."
      : sectionLabel
        ? `Reference lists for ${sectionLabel}. Configure dropdown options used in this area of the workspace.`
        : "Configure dropdown options used across clients, support plans, products, and services.";

  return (
    <Shell
      title="Reference data"
      subtitle={subtitle}
      breadcrumbs={
        variant === "system"
          ? systemSection
            ? [
                { label: "System", href: "/system" },
                { label: sectionLabel ?? systemSection },
                { label: "Reference data" },
              ]
            : [
                { label: "System", href: "/system" },
                { label: "Reference data" },
              ]
          : [{ label: "Home", href: "/" }, { label: "Admin", href: "/admin/reference-data" }, { label: "Reference data" }]
      }
      audit={{
        moduleLabel: systemSection
          ? `Reference data — ${sectionLabel ?? systemSection}`
          : "Reference data administration",
      }}
      actions={
        source === "local" ? (
          <button
            type="button"
            onClick={resetSectionToDefaults}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {systemSection ? "Reset this area to defaults" : "Reset all to defaults"}
          </button>
        ) : null
      }
    >
      {usesBundledDefaults ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some lists are showing bundled defaults because the database lists have no options yet. Open a list and
          save to write options to Supabase.
        </p>
      ) : null}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">No reference lists in this area yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Lists are added here when setup options are defined for {sectionLabel ?? "this module"}.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {groups.map((group) => (
              <section key={group} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</h2>
                <ul className="space-y-0.5">
                  {(filteredKeysByGroup.get(group) ?? []).map((key) => {
                    const meta = referenceDataMeta[key];
                    const count = catalog[key]?.length ?? 0;
                    const shared = isSharedReferenceDataKey(key);
                    const usageLines = formatReferenceDataUsage(key);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => openKey(key)}
                          className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm ${
                            activeKey === key
                              ? "bg-[#fdf2f8] font-medium text-[#b51266]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex w-full items-center justify-between gap-2">
                            <span>{meta?.label ?? key}</span>
                            <span className="shrink-0 text-xs text-slate-400">{count}</span>
                          </span>
                          {usageLines.length > 0 ? (
                            <span className="mt-0.5 line-clamp-2 text-xs font-normal text-slate-500">
                              {shared ? "Shared: " : "Used: "}
                              {usageLines.slice(0, 2).join("; ")}
                              {usageLines.length > 2 ? ` (+${usageLines.length - 2} more)` : ""}
                            </span>
                          ) : null}
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
                    {isSharedReferenceDataKey(activeKey) || formatReferenceDataUsage(activeKey).length > 0 ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {isSharedReferenceDataKey(activeKey) ? "Shared across workspace" : "Used in workspace"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {isSharedReferenceDataKey(activeKey)
                            ? "One list for every module below. Changes apply everywhere it is used."
                            : "Changes apply on the pages and tabs below."}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {(sharedReferenceDataUsage(activeKey) ?? referenceDataUsage(activeKey) ?? []).map(
                            ({ area, pages }) => (
                            <li key={area} className="text-sm text-slate-700">
                              <span className="font-medium text-slate-800">{area}</span>
                              <span className="text-slate-500"> — </span>
                              {pages.join(", ")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  {source === "local" ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!canLeaveDraft()) return;
                        resetKey(activeKey);
                        setDraftText((catalog[activeKey] ?? []).join("\n"));
                        setSaveState("idle");
                      }}
                      className="text-sm font-medium text-slate-600 hover:text-[#b51266]"
                    >
                      Reset to default
                    </button>
                  ) : null}
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
                  className="mt-4 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
                  disabled={!isDirty || saveState === "saving"}
                >
                  {saveState === "saving" ? "Saving..." : "Save options"}
                </button>
                {saveError ? (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {saveError}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {saveState === "saved" ? "Saved." : isDirty ? "Unsaved changes." : "No changes."}
                </p>
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
                {listCount === 0
                  ? "No lists to edit in this area."
                  : "Select a list on the left to edit its options."}
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
