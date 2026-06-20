"use client";

import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { formatAuditDateTime } from "@/lib/audit";
import { CONCURRENT_SESSION_MODES } from "@/lib/session-audit/constants";
import type { RetentionJobRun, RetentionPolicyRecord } from "@/lib/session-audit/types";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function RecordRetentionSettingsView() {
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("admin-record-retention");

  const [policies, setPolicies] = useState<RetentionPolicyRecord[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [runs, setRuns] = useState<RetentionJobRun[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/system/settings/retention", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as {
        policies: RetentionPolicyRecord[];
        settings: Record<string, string>;
        runs: RetentionJobRun[];
      };
      setPolicies(data.policies);
      setSettings(data.settings);
      setRuns(data.runs);
    }
  }, []);

  useEffect(() => {
    if (hasPageAccess) void load();
  }, [hasPageAccess, load]);

  async function savePolicy(recordType: string, retentionDays: number) {
    setSaving(true);
    await fetch("/api/system/settings/retention", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ recordType, retentionDays }),
    });
    setMessage("Retention settings saved.");
    await load();
    setSaving(false);
  }

  async function saveSetting(key: string, value: string) {
    setSaving(true);
    await fetch("/api/system/settings/retention", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ settingKey: key, settingValue: value }),
    });
    setMessage("System setting saved.");
    if (key === "timezone" && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("abilityapp-timezone-changed"));
    }
    await load();
    setSaving(false);
  }

  async function runRetentionNow() {
    setSaving(true);
    const res = await fetch("/api/system/settings/retention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "run_retention" }),
    });
    if (res.ok) {
      const data = (await res.json()) as { runs: RetentionJobRun[]; totalDeleted: number };
      setMessage(`Retention complete — ${data.totalDeleted} record(s) removed across all policies.`);
      await load();
    }
    setSaving(false);
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Record retention settings" audit={{ moduleLabel: "Record retention" }}>
        <p className="text-sm text-slate-600">You do not have access to record retention settings.</p>
      </SystemShell>
    );
  }

  const sessionPolicy = policies.find((p) => p.recordType === "user_session");
  const processPolicy = policies.find((p) => p.recordType === "process_audit");
  const aiQueryPolicy = policies.find((p) => p.recordType === "ai_query_meta");

  function policySection(
    title: string,
    description: string,
    recordType: string,
    policy: RetentionPolicyRecord | undefined,
    defaultDays: number
  ) {
    return (
      <section key={recordType} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mb-4 text-xs text-slate-500">{description}</p>
        <label className="block max-w-xs text-xs font-medium text-slate-600">
          Retention (days)
          <input
            type="number"
            min={1}
            className={`${inputClass} mt-1 w-full`}
            value={policy?.retentionDays ?? defaultDays}
            onChange={(e) => {
              const days = Number(e.target.value);
              setPolicies((prev) =>
                prev.map((p) => (p.recordType === recordType ? { ...p, retentionDays: days } : p))
              );
            }}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void savePolicy(recordType, policy?.retentionDays ?? defaultDays)}
          className="mt-4 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
        >
          Save retention
        </button>
      </section>
    );
  }

  return (
    <SystemShell
      title="Record retention settings"
      subtitle="Configure how long system-generated session data is kept. Audit records are permanent and never deleted."
      audit={{ moduleLabel: "Record retention" }}
    >
      {message ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">{message}</p>
      ) : null}

      {policySection(
        "User session data",
        "User session records are removed after the retention period. The existing audit trail is never affected.",
        "user_session",
        sessionPolicy,
        90
      )}
      {policySection(
        "Process audit data",
        "Process execution records and related risk metadata are removed after the retention period.",
        "process_audit",
        processPolicy,
        90
      )}
      {policySection(
        "AI query audit metadata",
        "AI chat logs and query audit metadata are removed after the retention period.",
        "ai_query_meta",
        aiQueryPolicy,
        90
      )}

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Session security settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Allow multiple concurrent sessions
            <select
              className={`${inputClass} mt-1 w-full`}
              value={settings.concurrent_sessions_mode ?? "warn"}
              onChange={(e) => void saveSetting("concurrent_sessions_mode", e.target.value)}
            >
              {CONCURRENT_SESSION_MODES.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Session idle timeout (minutes)
            <input
              type="number"
              min={15}
              className={`${inputClass} mt-1 w-full`}
              defaultValue={settings.session_timeout_minutes ?? "480"}
              onBlur={(e) => void saveSetting("session_timeout_minutes", e.target.value)}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-2">
            <span className="font-medium text-slate-700">Organisation timezone</span>
            <p className="mt-1 text-[11px] font-normal text-slate-500">
              Configure under{" "}
              <a href="/system/settings/time-and-date" className="font-medium text-[#b51266] hover:underline">
                Organisation → Time &amp; date
              </a>
              .
            </p>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Retention job history</h2>
          <button
            type="button"
            disabled={saving}
            onClick={() => void runRetentionNow()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Run retention now
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          For production, schedule nightly POST to <code className="text-slate-700">/api/system/audit-maintenance</code> with header{" "}
          <code className="text-slate-700">x-audit-cron-secret</code> and body{" "}
          <code className="text-slate-700">{`{"action":"run_retention"}`}</code>. Set{" "}
          <code className="text-slate-700">AUDIT_CRON_SECRET</code> in the environment.
        </p>
        {runs.length === 0 ? (
          <p className="text-sm text-slate-500">No retention runs recorded yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2">Type</th>
                <th className="pb-2">Started</th>
                <th className="pb-2">Deleted</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 capitalize">{r.recordType.replace(/_/g, " ")}</td>
                  <td className="py-2">{formatAuditDateTime(r.startedAt)}</td>
                  <td className="py-2">{r.recordsDeleted}</td>
                  <td className="py-2">{r.durationMs != null ? `${r.durationMs}ms` : "—"}</td>
                  <td className="py-2 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </SystemShell>
  );
}
