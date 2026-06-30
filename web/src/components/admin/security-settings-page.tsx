"use client";

import { useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { auditMetaFrom } from "@/lib/audit";
import { ORGANIZATION_ID, normalizeIdleTimeoutMinutes } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { useSystemAuthOptional } from "@/lib/system-auth-store";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20";

export function SecuritySettingsView() {
  const systemAuth = useSystemAuthOptional();
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("admin-security");
  const { organization, updateOrganization } = useOrganization();
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState(organization.idleTimeoutMinutes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIdleTimeoutMinutes(normalizeIdleTimeoutMinutes(organization.idleTimeoutMinutes));
  }, [organization.idleTimeoutMinutes]);

  async function saveIdleTimeout() {
    const normalized = normalizeIdleTimeoutMinutes(idleTimeoutMinutes);
    if (normalized !== idleTimeoutMinutes) {
      setError("Idle timeout must be a whole number from 5 to 120.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/system/settings/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idleTimeoutMinutes: normalized }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not save security settings.");
      }
      updateOrganization({
        ...organization,
        idleTimeoutMinutes: normalized,
        updatedBy: systemAuth?.session?.displayName ?? systemAuth?.session?.username ?? "System",
      });
      setMessage("Security settings saved.");
      showSuccessToast(SAVE_TOAST_MESSAGES.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save security settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Security settings" audit={{ moduleLabel: "Security settings" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure security settings.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Security settings"
      subtitle="Set the idle timeout used to protect unattended workspace sessions."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "System settings", href: "/system/settings/record-retention" },
        { label: "Security settings" },
      ]}
      audit={{
        entityType: "organization",
        entityId: ORGANIZATION_ID,
        meta: auditMetaFrom(organization),
      }}
    >
      {message ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Idle session timeout</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Staff see a warning after this many inactive minutes. If they do not click Stay signed in
          within 2 minutes, AbilityVua logs them out and records the session as timed out.
        </p>
        <label className="mt-5 block max-w-xs text-sm font-medium text-slate-700">
          Idle session timeout (minutes)
          <input
            type="number"
            min={5}
            max={120}
            step={1}
            value={idleTimeoutMinutes}
            disabled={saving}
            onChange={(e) => setIdleTimeoutMinutes(Number(e.target.value))}
            className={`${inputClass} mt-1`}
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">Allowed range: 5 to 120 minutes. Default: 15 minutes.</p>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveIdleTimeout()}
          className="mt-5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save security settings"}
        </button>
      </section>
    </SystemShell>
  );
}
