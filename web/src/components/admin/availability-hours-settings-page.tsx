"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import {
  AVAILABILITY_HOURS_POLICY_FIELDS,
  type AvailabilityHoursPolicy,
  type OvernightHoursMode,
} from "@/lib/availability-hours-policy";
import { SettingsFormSkeleton } from "@/components/ui/page-skeletons";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { CONTRACTED_HOURS_PERIOD_OPTIONS } from "@/lib/contracted-hours";

const inputClass =
  "w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const DEFAULTS: AvailabilityHoursPolicy = {
  maxHoursPerPeriod: 76,
  maxHoursPeriod: "fortnight",
  overMaxApprovalRoleId: "role-rostering-manager",
  overnightHoursMode: "include",
};

const OVERNIGHT_OPTIONS: { value: OvernightHoursMode; label: string }[] = [
  { value: "include", label: "Include overnight spans in the total" },
  { value: "exclude", label: "Exclude overnight spans from the total" },
  { value: "ask", label: "Ask the worker each time they save" },
];

export function AvailabilityHoursSettingsView() {
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("system-availability-policy");

  const [saved, setSaved] = useState<AvailabilityHoursPolicy>(DEFAULTS);
  const [draft, setDraft] = useState<AvailabilityHoursPolicy>(DEFAULTS);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/system/settings/availability", { credentials: "include" });
      if (!res.ok) {
        setError("Could not load availability hours settings.");
        return;
      }
      const data = (await res.json()) as {
        settings?: AvailabilityHoursPolicy;
        roles?: { id: string; name: string }[];
      };
      const value = { ...DEFAULTS, ...(data.settings ?? {}) };
      setSaved(value);
      setDraft(value);
      setRoles(data.roles ?? []);
    } catch {
      setError("Could not load availability hours settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPageAccess) void load();
  }, [hasPageAccess, load]);

  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(saved);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/system/settings/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { settings?: AvailabilityHoursPolicy; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      const value = { ...DEFAULTS, ...(data.settings ?? draft) };
      setSaved(value);
      setDraft(value);
      setMessage("Availability hours policy saved.");
      showSuccessToast(SAVE_TOAST_MESSAGES.settings);
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDraft(saved);
    setMessage("");
    setError("");
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Availability hours" audit={{ moduleLabel: "Availability hours" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure availability hours rules.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Availability hours"
      subtitle="Organisation maximum, over-max approval, and overnight counting for My availability."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Workforce planning", href: "/system/setup/workforce" },
        { label: "Availability hours" },
      ]}
      audit={{ moduleLabel: "Availability hours" }}
    >
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Availability hours policy</h2>
        <p className="mt-1 text-sm text-slate-600">
          Staff weekly availability must meet their contracted minimum (on the employee record). The organisation
          maximum and approval role apply when they need to offer more hours.
        </p>

        {loading ? <SettingsFormSkeleton rows={4} /> : null}

        {!loading ? (
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {AVAILABILITY_HOURS_POLICY_FIELDS.maxHoursPerPeriod.label}
              </span>
              <input
                type="number"
                min={1}
                step={0.5}
                className={inputClass}
                value={draft.maxHoursPerPeriod}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    maxHoursPerPeriod: Number.parseFloat(e.target.value) || DEFAULTS.maxHoursPerPeriod,
                  }))
                }
              />
              <span className="mt-1 block text-xs text-slate-500">
                {AVAILABILITY_HOURS_POLICY_FIELDS.maxHoursPerPeriod.hint}
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {AVAILABILITY_HOURS_POLICY_FIELDS.maxHoursPeriod.label}
              </span>
              <select
                className={inputClass}
                value={draft.maxHoursPeriod}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    maxHoursPeriod: e.target.value as AvailabilityHoursPolicy["maxHoursPeriod"],
                  }))
                }
              >
                {CONTRACTED_HOURS_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                {AVAILABILITY_HOURS_POLICY_FIELDS.maxHoursPeriod.hint}
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {AVAILABILITY_HOURS_POLICY_FIELDS.overMaxApprovalRoleId.label}
              </span>
              <select
                className={inputClass}
                value={draft.overMaxApprovalRoleId}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, overMaxApprovalRoleId: e.target.value }))
                }
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                {AVAILABILITY_HOURS_POLICY_FIELDS.overMaxApprovalRoleId.hint}
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {AVAILABILITY_HOURS_POLICY_FIELDS.overnightHoursMode.label}
              </span>
              <select
                className={inputClass}
                value={draft.overnightHoursMode}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    overnightHoursMode: e.target.value as OvernightHoursMode,
                  }))
                }
              >
                {OVERNIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                {AVAILABILITY_HOURS_POLICY_FIELDS.overnightHoursMode.hint}
              </span>
            </label>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving || !hasUnsavedChanges}
            onClick={() => void handleSave()}
            className="rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {hasUnsavedChanges ? (
            <button type="button" onClick={handleDiscard} className="text-sm text-slate-600 hover:text-slate-900">
              Discard
            </button>
          ) : null}
        </div>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <p className="mt-6 text-sm">
          <Link href="/help/workforce-setup" className="font-medium text-[#d4147a] hover:underline">
            How availability hours work
          </Link>
        </p>
      </div>
    </SystemShell>
  );
}
