"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import {
  SHIFT_CHECKIN_MONITORING_FIELDS,
  type ShiftCheckinMonitoringSettings,
} from "@/lib/shift-checkin-monitoring";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const DEFAULTS: ShiftCheckinMonitoringSettings = {
  lateCheckinGraceMinutes: 10,
  missedCheckinMinutes: 20,
  missedCheckoutGraceMinutes: 30,
  hoursVarianceThreshold: 0.25,
};

export function ShiftCheckinMonitoringSettingsView() {
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("system-shift-monitoring");

  const [saved, setSaved] = useState<ShiftCheckinMonitoringSettings>(DEFAULTS);
  const [draft, setDraft] = useState<ShiftCheckinMonitoringSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/system/settings/shift-monitoring", { credentials: "include" });
      if (!res.ok) {
        setError("Could not load shift monitoring settings.");
        return;
      }
      const data = (await res.json()) as { settings?: ShiftCheckinMonitoringSettings };
      const value = { ...DEFAULTS, ...(data.settings ?? {}) };
      setSaved(value);
      setDraft(value);
    } catch {
      setError("Could not load shift monitoring settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPageAccess) void load();
  }, [hasPageAccess, load]);

  const hasUnsavedChanges =
    draft.lateCheckinGraceMinutes !== saved.lateCheckinGraceMinutes ||
    draft.missedCheckinMinutes !== saved.missedCheckinMinutes ||
    draft.missedCheckoutGraceMinutes !== saved.missedCheckoutGraceMinutes ||
    draft.hoursVarianceThreshold !== saved.hoursVarianceThreshold;

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/system/settings/shift-monitoring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { settings?: ShiftCheckinMonitoringSettings; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      const value = { ...DEFAULTS, ...(data.settings ?? draft) };
      setSaved(value);
      setDraft(value);
      setMessage("Shift check-in monitoring saved.");
      showSuccessToast(SAVE_TOAST_MESSAGES.settings);
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Shift check-in monitoring" audit={{ moduleLabel: "Shift check-in monitoring" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure shift monitoring.</p>
      </SystemShell>
    );
  }

  const numberField = (
    key: keyof ShiftCheckinMonitoringSettings,
    label: string,
    hint: string,
    step: number,
    max: number
  ) => (
    <label className="block max-w-xs text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        className={inputClass}
        value={draft[key]}
        onChange={(e) => {
          setDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }));
          setMessage("");
        }}
      />
      <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
    </label>
  );

  return (
    <SystemShell
      title="Shift check-in monitoring"
      subtitle="Escalation timing for shift check-in / check-out and the timesheet hours variance."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Workforce planning", href: "/system/setup/workforce" },
        { label: "Shift check-in monitoring" },
      ]}
      audit={{ moduleLabel: "Shift check-in monitoring" }}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">{SHIFT_CHECKIN_MONITORING_FIELDS.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{SHIFT_CHECKIN_MONITORING_FIELDS.description}</p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {numberField(
                "lateCheckinGraceMinutes",
                SHIFT_CHECKIN_MONITORING_FIELDS.lateCheckin.label,
                SHIFT_CHECKIN_MONITORING_FIELDS.lateCheckin.hint,
                1,
                1440
              )}
              {numberField(
                "missedCheckinMinutes",
                SHIFT_CHECKIN_MONITORING_FIELDS.missedCheckin.label,
                SHIFT_CHECKIN_MONITORING_FIELDS.missedCheckin.hint,
                1,
                1440
              )}
              {numberField(
                "missedCheckoutGraceMinutes",
                SHIFT_CHECKIN_MONITORING_FIELDS.missedCheckout.label,
                SHIFT_CHECKIN_MONITORING_FIELDS.missedCheckout.hint,
                1,
                1440
              )}
              {numberField(
                "hoursVarianceThreshold",
                SHIFT_CHECKIN_MONITORING_FIELDS.variance.label,
                SHIFT_CHECKIN_MONITORING_FIELDS.variance.hint,
                0.05,
                8
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Missed check-in and missed check-out create a follow-up task for the worker&apos;s manager (coordinator
              fallback) and a Home alert for rostering. Late check-ins show as a Home warning only. Tasks are created
              when the scheduled workforce automations run.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || !hasUnsavedChanges}
                onClick={() => void handleSave()}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {hasUnsavedChanges ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(saved);
                    setMessage("");
                    setError("");
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Discard
                </button>
              ) : null}
            </div>

            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </>
        )}

        <p className="mt-4 text-xs text-slate-500">
          <Link href="/help/delivery" className="font-medium text-[#b51266] hover:underline">
            How shift check-in and escalation works
          </Link>
        </p>
      </section>
    </SystemShell>
  );
}
