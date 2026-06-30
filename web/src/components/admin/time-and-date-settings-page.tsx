"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { SystemClock } from "@/components/system-clock";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import {
  COMMON_ORGANIZATION_TIMEZONES,
  DEFAULT_ORGANIZATION_TIMEZONE,
  normalizeOrganizationTimezone,
} from "@/lib/system-timezone";
import { SettingsFormSkeleton } from "@/components/ui/page-skeletons";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function TimeAndDateSettingsView() {
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("system-time-and-date");

  const [timezone, setTimezone] = useState(DEFAULT_ORGANIZATION_TIMEZONE);
  const [draft, setDraft] = useState(DEFAULT_ORGANIZATION_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/system/timezone", { credentials: "include" });
      if (!res.ok) {
        setError("Could not load timezone settings.");
        return;
      }
      const data = (await res.json()) as { timezone?: string };
      const value = normalizeOrganizationTimezone(data.timezone);
      setTimezone(value);
      setDraft(value);
    } catch {
      setError("Could not load timezone settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPageAccess) void load();
  }, [hasPageAccess, load]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/system/timezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ timezone: draft.trim() }),
      });
      const data = (await res.json()) as { timezone?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save timezone.");
        return;
      }
      const saved = normalizeOrganizationTimezone(data.timezone ?? draft);
      setTimezone(saved);
      setDraft(saved);
      setMessage("Organisation timezone saved. The sidebar clock and My shifts dates update immediately.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("abilityvua-timezone-changed"));
      }
    } catch {
      setError("Could not save timezone.");
    } finally {
      setSaving(false);
    }
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Time & date" audit={{ moduleLabel: "Time & date" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure organisation time.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Time & date"
      subtitle="Organisation timezone for the sidebar clock, My shifts, and roster dates."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Organisation", href: "/system/organization" },
        { label: "Time & date" },
      ]}
      audit={{ moduleLabel: "Time & date" }}
    >
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Live preview</h2>
        <p className="mt-1 text-sm text-slate-600">
          This is what staff see under the AbilityVua logo in the workspace and System sidebars.
        </p>
        <div className="mt-4 inline-block rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <SystemClock />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Organisation timezone</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use an IANA timezone name (for example <code className="text-slate-800">Australia/Adelaide</code> for South
          Australia). AbilityVua does not let you set a manual clock offset — the server time is always correct; only
          the display timezone changes.
        </p>

        {loading ? <SettingsFormSkeleton rows={1} /> : null}
        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            {message}
          </p>
        ) : null}

        {!loading ? (
          <div className="mt-4 max-w-xl space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">Timezone</span>
              <input
                list="org-timezone-options"
                className={`${inputClass} w-full`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <datalist id="org-timezone-options">
                {COMMON_ORGANIZATION_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} />
                ))}
              </datalist>
              <span className="mt-1.5 block text-xs text-slate-500">
                Current saved value: {timezone}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || draft.trim() === timezone}
                onClick={() => void handleSave()}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save timezone"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDraft(timezone)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <p className="mt-4 text-sm text-slate-500">
        Session retention, idle timeout, and concurrent login rules are on{" "}
        <Link href="/system/settings/record-retention" className="font-medium text-[#b51266] hover:underline">
          System Settings → Record retention
        </Link>
        .
      </p>
    </SystemShell>
  );
}
