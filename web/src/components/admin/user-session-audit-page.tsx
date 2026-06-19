"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { useAuth } from "@/lib/auth-store";
import { formatAuditDateTime } from "@/lib/audit";
import {
  RISK_SEVERITY_LABELS,
  RISK_STATUS_LABELS,
  SESSION_EVENT_LABELS,
  SESSION_STATUS_LABELS,
} from "@/lib/session-audit/constants";
import { summarizeAuditForSession } from "@/lib/session-audit/audit-bridge.client";
import type {
  SessionDashboardMetrics,
  SessionInvestigationDetail,
  UserSessionRecord,
} from "@/lib/session-audit/types";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function SessionInvestigationPanel({
  sessionId,
  onClose,
  canInvestigate,
}: {
  sessionId: string;
  onClose: () => void;
  canInvestigate: boolean;
}) {
  const [detail, setDetail] = useState<SessionInvestigationDetail | null>(null);
  const [note, setNote] = useState("");
  const [riskStatus, setRiskStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/system/session-audit/${sessionId}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as SessionInvestigationDetail & { showSensitive?: boolean };
      const auditSummary = summarizeAuditForSession(
        data.session.userId,
        data.session.loginAt,
        data.session.logoutAt || null,
        data.session.id
      );
      setDetail({ ...data, auditSummary });
      setRiskStatus(data.session.riskStatus);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveInvestigation() {
    await fetch(`/api/system/session-audit/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ note: note.trim() || undefined, riskStatus: riskStatus || undefined }),
    });
    setNote("");
    void load();
  }

  if (loading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div className="rounded-xl bg-white p-8 text-sm text-slate-500">Loading session…</div>
      </div>
    );
  }

  const s = detail.session;
  const timeline = [
    ...detail.events.map((e) => ({
      at: e.createdAt,
      label: SESSION_EVENT_LABELS[e.eventType] ?? e.eventType,
      detail: e.detail,
    })),
    ...detail.auditSummary.events.map((e) => ({
      at: e.at,
      label: `Audit: ${e.summary}`,
      detail: e.detail,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Session investigation</h2>
            <p className="text-xs text-slate-500">{s.userName} · {formatAuditDateTime(s.loginAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs text-slate-500">Status</p><p className="font-medium">{SESSION_STATUS_LABELS[s.status]}</p></div>
            <div><p className="text-xs text-slate-500">Duration</p><p className="font-medium">{formatDuration(s.durationSeconds)}</p></div>
            <div><p className="text-xs text-slate-500">Role</p><p className="font-medium">{s.roleName || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Auth method</p><p className="font-medium">{s.authMethod}</p></div>
            <div><p className="text-xs text-slate-500">IP address</p><p className="font-medium">{s.ipAddress || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Device</p><p className="font-medium">{s.deviceInfo || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Browser</p><p className="font-medium">{s.browser || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Transactions</p><p className="font-medium">{detail.auditSummary.totalEvents}</p></div>
          </section>

          {detail.risks.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Risk indicators</h3>
              <ul className="space-y-2">
                {detail.risks.map((r) => (
                  <li key={r.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                    <span className="font-medium">{r.indicatorLabel}</span>
                    <span className="ml-2 text-xs uppercase text-amber-800">{RISK_SEVERITY_LABELS[r.severity]}</span>
                    {r.detail ? <p className="mt-1 text-xs text-amber-900">{r.detail}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canInvestigate ? (
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold">Investigation</h3>
              <label className="mb-3 block text-xs text-slate-500">
                Risk status
                <select className={`${inputClass} mt-1 w-full`} value={riskStatus} onChange={(e) => setRiskStatus(e.target.value)}>
                  {Object.entries(RISK_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-500">
                Add note
                <textarea className={`${inputClass} mt-1 w-full`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <button
                type="button"
                onClick={() => void saveInvestigation()}
                className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                Save investigation update
              </button>
              {detail.notes.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {detail.notes.map((n) => (
                    <li key={n.id} className="text-sm">
                      <p className="font-medium text-slate-800">{n.authorName}</p>
                      <p className="text-xs text-slate-500">{formatAuditDateTime(n.createdAt)}</p>
                      <p className="mt-1 text-slate-700">{n.note}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 text-sm font-semibold">Related audit activity</h3>
            <p className="mb-2 text-xs text-slate-500">
              {detail.auditSummary.recordsModified} records · {detail.auditSummary.tablesAffected.join(", ") || "No tables"}
            </p>
            {detail.auditSummary.events.length === 0 ? (
              <p className="text-sm text-slate-500">No audit entries linked to this session window.</p>
            ) : (
              <ul className="max-h-48 overflow-y-auto space-y-1 text-sm">
                {detail.auditSummary.events.map((e) => (
                  <li key={e.id} className="rounded border border-slate-100 px-2 py-1">
                    <span className="text-xs text-slate-500">{formatAuditDateTime(e.at)}</span> — {e.summary}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Session timeline</h3>
            <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
              {timeline.map((t, i) => (
                <li key={`${t.at}-${i}`} className="text-sm">
                  <p className="text-xs text-slate-500">{formatAuditDateTime(t.at)}</p>
                  <p className="font-medium text-slate-800">{t.label}</p>
                  {t.detail ? <p className="text-xs text-slate-600">{t.detail}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

export function UserSessionAuditView() {
  const { users, roles, canProcess } = useAuth();
  const { hasAccess, isSystemOperator } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("admin-user-session-audit");
  const canInvestigate = isSystemOperator || canProcess("manage-session-audit-risk");

  const [range, setRange] = useState<"today" | "7d" | "30d" | "custom">("7d");
  const [metrics, setMetrics] = useState<SessionDashboardMetrics | null>(null);
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    userId: "",
    roleId: "",
    status: "",
    riskLevel: "",
    search: "",
  });

  const loadDashboard = useCallback(async () => {
    const res = await fetch(`/api/system/session-audit?mode=dashboard&range=${range}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { metrics: SessionDashboardMetrics };
      setMetrics(data.metrics);
    }
  }, [range]);

  const loadSessions = useCallback(async (append = false) => {
    setLoading(!append);
    const params = new URLSearchParams();
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.roleId) params.set("roleId", filters.roleId);
    if (filters.status) params.set("status", filters.status);
    if (filters.riskLevel) params.set("riskLevel", filters.riskLevel);
    if (filters.search) params.set("search", filters.search);
    if (append && nextCursor) params.set("cursor", nextCursor);
    const res = await fetch(`/api/system/session-audit?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { sessions: UserSessionRecord[]; total: number; nextCursor: string | null };
      setSessions((prev) => (append ? [...prev, ...data.sessions] : data.sessions));
      setTotal(data.total);
      setNextCursor(data.nextCursor);
    }
    setLoading(false);
  }, [filters, nextCursor]);

  useEffect(() => {
    if (!hasPageAccess) return;
    void loadDashboard();
    void loadSessions(false);
  }, [hasPageAccess, loadDashboard, filters]);

  const exportUrl = useMemo(() => "/api/system/session-audit/export", []);

  if (!hasPageAccess) {
    return (
      <SystemShell title="User Session Audit" audit={{ moduleLabel: "User Session Audit" }}>
        <p className="text-sm text-slate-600">You do not have access to User Session Audit.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="User Session Audit"
      subtitle="Login activity, risk detection, and forensic session investigation"
      audit={{ moduleLabel: "User Session Audit" }}
      actions={
        <a
          href={exportUrl}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </a>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {(["today", "7d", "30d"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              range === r ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
            }`}
          >
            {r === "today" ? "Today" : r === "7d" ? "Last 7 days" : "Last 30 days"}
          </button>
        ))}
      </div>

      {metrics ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total logins" value={metrics.totalLogins} />
          <MetricCard label="Failed logins" value={metrics.failedLogins} />
          <MetricCard label="Unique users" value={metrics.uniqueUsers} />
          <MetricCard label="Active sessions" value={metrics.activeSessions} />
          <MetricCard label="Risk events" value={metrics.riskEvents} sub={`${metrics.highRiskEvents} high`} />
          <MetricCard
            label="Avg session"
            value={formatDuration(metrics.averageSessionDurationSeconds)}
          />
          <MetricCard label="Longest session" value={formatDuration(metrics.longestSessionSeconds)} />
          <MetricCard
            label="Most active user"
            value={metrics.mostActiveUser?.userName ?? "—"}
            sub={metrics.mostActiveUser ? `${metrics.mostActiveUser.count} logins` : undefined}
          />
          <MetricCard
            label="Most active role"
            value={metrics.mostActiveRole?.roleName ?? "—"}
            sub={metrics.mostActiveRole ? `${metrics.mostActiveRole.count} logins` : undefined}
          />
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select className={inputClass} value={filters.userId} onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}>
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>
        <select className={inputClass} value={filters.roleId} onChange={(e) => setFilters((f) => ({ ...f, roleId: e.target.value }))}>
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select className={inputClass} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {Object.entries(SESSION_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className={inputClass} value={filters.riskLevel} onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value }))}>
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <input
          className={inputClass}
          placeholder="Search user, role, IP…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No sessions match your filters.</td></tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium">{s.userName}</td>
                  <td className="px-4 py-3 text-slate-600">{s.roleName || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatAuditDateTime(s.loginAt)}</td>
                  <td className="px-4 py-3">{SESSION_STATUS_LABELS[s.status]}</td>
                  <td className="px-4 py-3">
                    {s.riskLevel !== "none" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {RISK_SEVERITY_LABELS[s.riskLevel as keyof typeof RISK_SEVERITY_LABELS] ?? s.riskLevel}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">{formatDuration(s.durationSeconds)}</td>
                  <td className="px-4 py-3 text-slate-600">{s.ipAddress || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className="text-[#b51266] hover:underline"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">{total} session(s) · last 7 days by default</p>
        {nextCursor ? (
          <div className="border-t px-4 py-3 text-center">
            <button type="button" className="text-sm font-medium text-[#b51266] hover:underline" onClick={() => void loadSessions(true)}>
              Load more
            </button>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Session records are system-generated and read-only. Related record changes come from the existing audit trail — not duplicated here.{" "}
        <Link href="/system/settings/record-retention" className="text-[#b51266] hover:underline">
          Record retention settings
        </Link>
      </p>

      {selectedId ? (
        <SessionInvestigationPanel
          sessionId={selectedId}
          onClose={() => setSelectedId(null)}
          canInvestigate={canInvestigate}
        />
      ) : null}
    </SystemShell>
  );
}
