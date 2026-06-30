"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { LEAVE_SELF_SERVICE_SETTINGS } from "@/lib/leave-self-service-policy";
import { SettingsFormSkeleton } from "@/components/ui/page-skeletons";

const inputClass =
  "w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function LeaveSelfServiceSettingsView() {
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("system-leave-policy");

  const [minimumHours, setMinimumHours] = useState(76);
  const [draft, setDraft] = useState(76);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/system/settings/leave", { credentials: "include" });
      if (!res.ok) {
        setError("Could not load leave settings.");
        return;
      }
      const data = (await res.json()) as { minimumHours?: number };
      const value = Number(data.minimumHours ?? 76);
      setMinimumHours(value);
      setDraft(value);
    } catch {
      setError("Could not load leave settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPageAccess) void load();
  }, [hasPageAccess, load]);

  const hasUnsavedChanges = draft !== minimumHours;

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/system/settings/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ minimumHours: draft }),
      });
      const data = (await res.json()) as { minimumHours?: number; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save leave settings.");
        return;
      }
      const saved = Number(data.minimumHours ?? draft);
      setMinimumHours(saved);
      setDraft(saved);
      setMessage("Leave self-service notice saved.");
    } catch {
      setError("Could not save leave settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDraft(minimumHours);
    setMessage("");
    setError("");
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Leave self-service" audit={{ moduleLabel: "Leave self-service" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure leave notice rules.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Leave self-service"
      subtitle="Minimum notice for staff submitting leave from My workplace."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Workforce planning", href: "/system/setup/workforce" },
        { label: "Leave self-service" },
      ]}
      audit={{ moduleLabel: "Leave self-service" }}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">{LEAVE_SELF_SERVICE_SETTINGS.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{LEAVE_SELF_SERVICE_SETTINGS.description}</p>

        {loading ? (
          <SettingsFormSkeleton rows={4} />
        ) : (
          <>
            <label className="mt-4 block max-w-xs text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                {LEAVE_SELF_SERVICE_SETTINGS.fieldLabel}
              </span>
              <input
                type="number"
                min={0}
                max={8760}
                step={1}
                className={inputClass}
                value={draft}
                onChange={(e) => {
                  setDraft(Number(e.target.value));
                  setMessage("");
                }}
              />
              <span className="mt-1.5 block text-xs text-slate-500">{LEAVE_SELF_SERVICE_SETTINGS.fieldHint}</span>
            </label>

            <p className="mt-4 text-xs text-slate-500">
              Example: at {draft || 0} hours, a support worker can submit leave online until{" "}
              {draft || 0} hours before their first roster shift in the leave range. After that they must phone in.
              Managers with submit on behalf are not blocked.
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
                  onClick={handleDiscard}
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
          Staff see this rule on My workplace → Leave.{" "}
          <Link href="/help/my-workplace" className="font-medium text-[#b51266] hover:underline">
            How to submit leave
          </Link>
        </p>
      </section>
    </SystemShell>
  );
}
