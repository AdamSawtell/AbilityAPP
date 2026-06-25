"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrganizationRecord } from "@/lib/organization";
import {
  emptyOrgThemeFields,
  normalizeHexColour,
  orgThemeContrastWarnings,
  SYSTEM_BRAND,
  THEME_PRESET_SWATCHES,
} from "@/lib/org-theme";
import { resolveOrgThemeFromRecord, useOrgThemePreviewState } from "@/components/org-theme-provider";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

type ThemeKey =
  | "themePrimaryColour"
  | "themeAccentColour"
  | "themeBackgroundColour"
  | "themeTextColour";

const FIELDS: { key: ThemeKey; label: string; hint?: string; fallback: string }[] = [
  { key: "themePrimaryColour", label: "Primary colour", hint: "Buttons, links, and focus rings across the app.", fallback: SYSTEM_BRAND.primary },
  { key: "themeAccentColour", label: "Accent colour", hint: "Sign-in backdrop and secondary brand accents.", fallback: SYSTEM_BRAND.accent },
  { key: "themeBackgroundColour", label: "Background colour (optional)", hint: "Workspace background. Leave blank for default.", fallback: SYSTEM_BRAND.background },
  { key: "themeTextColour", label: "Text colour (optional)", hint: "Primary body text. Leave blank for default.", fallback: SYSTEM_BRAND.text },
];

export function OrgAppThemeSection({
  record,
  onChange,
}: {
  record: OrganizationRecord;
  onChange: (key: ThemeKey, value: string) => void;
}) {
  const { setPreview } = useOrgThemePreviewState();
  const [previewLive, setPreviewLive] = useState(false);

  const resolved = useMemo(() => resolveOrgThemeFromRecord(record), [record]);
  const warnings = useMemo(() => orgThemeContrastWarnings(resolved), [resolved]);

  useEffect(() => {
    if (previewLive) {
      setPreview(resolved);
    } else {
      setPreview(null);
    }
  }, [previewLive, resolved, setPreview]);

  useEffect(() => {
    return () => setPreview(null);
  }, [setPreview]);

  function applyPreset(primary: string, accent: string) {
    onChange("themePrimaryColour", primary);
    onChange("themeAccentColour", accent);
    setPreviewLive(true);
  }

  function resetTheme() {
    for (const key of Object.keys(emptyOrgThemeFields()) as ThemeKey[]) {
      onChange(key, "");
    }
    setPreviewLive(false);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">App theme</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customise the staff app shell colours. Document branding (footer and bank details) stays on the section
            below. Leave fields blank to use AbilityVua defaults.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPreviewLive((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              previewLive
                ? "border-brand-primary bg-brand-muted-surface text-brand-link"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {previewLive ? "Preview on" : "Preview live"}
          </button>
          <button
            type="button"
            onClick={resetTheme}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset theme
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {THEME_PRESET_SWATCHES.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.primary, preset.accent)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="flex gap-0.5">
              <span className="h-4 w-4 rounded-full ring-1 ring-slate-200" style={{ background: preset.primary }} />
              <span className="h-4 w-4 rounded-full ring-1 ring-slate-200" style={{ background: preset.accent }} />
            </span>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const value = String(record[field.key] ?? "");
          const normalized = normalizeHexColour(value);
          return (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label={`${field.label} picker`}
                  value={normalized || field.fallback}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="#d4147a"
                  value={value}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              </div>
              {field.hint ? <p className="mt-1 text-xs text-slate-400">{field.hint}</p> : null}
            </div>
          );
        })}
      </div>

      {warnings.length ? (
        <ul className="mb-4 space-y-2">
          {warnings.map((w) => (
            <li
              key={w.id}
              className={`rounded-lg px-3 py-2 text-xs ${
                w.severity === "error"
                  ? "border border-rose-200 bg-rose-50 text-rose-950"
                  : "border border-amber-200 bg-amber-50 text-amber-950"
              }`}
            >
              {w.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-xs text-emerald-700">Colour contrast looks acceptable for common UI pairings.</p>
      )}

      <div
        className="rounded-xl border border-brand-border-accent p-4"
        style={{ background: "var(--brand-background)" }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview strip</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-hover"
          >
            Primary button
          </button>
          <a href="#" className="text-sm font-medium text-brand-link hover:text-brand-link-hover hover:underline">
            Sample link
          </a>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background: resolved.primary,
              color: "#fff",
            }}
          >
            Badge
          </span>
        </div>
        {!resolved.customized ? (
          <p className="mt-2 text-xs text-slate-500">Using system defaults until you pick colours or a preset.</p>
        ) : null}
      </div>
    </section>
  );
}
