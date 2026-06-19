"use client";

import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { AuditMetricCard, auditInputClass } from "@/components/admin/audit-monitoring-shared";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { useAuth } from "@/lib/auth-store";
import { ACCESS_PROCESSES } from "@/lib/access/catalog";
import { formatAuditDateTime } from "@/lib/audit";
import { PROCESS_OUTCOME_LABELS, PROCESS_STATUS_LABELS } from "@/lib/process-audit/constants";
import { RISK_SEVERITY_LABELS, RISK_STATUS_LABELS } from "@/lib/session-audit/constants";
import type { ProcessAuditRecord, ProcessDashboardMetrics, ProcessInvestigationDetail } from "@/lib/process-audit/types";

function InvestigationPanel({
  id,
  onClose,
  canInvestigate,
}: {
  id: string;
  onClose: () => void;
  canInvestigate: boolean;
}) {
  const [detail, setDetail] = useState<ProcessInvestigationDetail | null>(null);
  const [note, setNote] = useState("");
  const [riskStatus, setRiskStatus] = useState("new");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/system/process-audit/${id}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as ProcessInvestigationDetail;
      setDetail(data);
      setRiskStatus(data.record.riskStatus);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    await fetch(`/api/system/process-audit/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ note: note.trim() || undefined, riskStatus }),
    });
    setNote("");
    void load();
  }

  if (loading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
        <div className="rounded-xl bg-white p-8 text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  const r = detail.record;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Process investigation</h2>
            <p className="text-xs text-slate-500">{r.processLabel} · {formatAuditDateTime(r.startedAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100">Close</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-4">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><p className="text-xs text-slate-500">User</p><p className="font-medium">{r.userName}</p></div>
            <div><p className="text-xs text-slate-500">Outcome</p><p className="font-medium">{PROCESS_OUTCOME_LABELS[r.outcome]}</p></div>
            <div><p className="text-xs text-slate-500">Entity</p><p className="font-medium">{r.entityLabel || r.entityId || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Session</p><p className="font-medium">{r.sessionId || "—"}</p></div>
            <div><p className="text-xs text-slate-500">IP</p><p className="font-medium">{r.ipAddress || "—"}</p></div>
            <div><p className="text-xs text-slate-500">Detail</p><p className="font-medium">{r.detail || "—"}</p></div>
          </div>
          {detail.risks.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Risk indicators</h3>
              <ul className="space-y-2">
                {detail.risks.map((risk) => (
                  <li key={risk.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                    {risk.indicatorLabel} · {RISK_SEVERITY_LABELS[risk.severity]}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {canInvestigate ? (
            <section className="rounded-xl border p-4">
              <h3 className="mb-3 text-sm font-semibold">Investigation</h3>
              <select className={`${auditInputClass} mb-3 w-full`} value={riskStatus} onChange={(e) => setRiskStatus(e.target.value)}>
                {Object.entries(RISK_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <textarea className={`${auditInputClass} w-full`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note" />
              <button type="button" onClick={() => void save()} className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white">Save</button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ProcessAuditView() {
  const { users, roles, canProcess } = useAuth();
  const { hasAccess, isSystemOperator } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("admin-process-audit");
  const canInvestigate = isSystemOperator || canProcess("manage-process-audit-risk");

  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");
  const [metrics, setMetrics] = useState<ProcessDashboardMetrics | null>(null);
  const [records, setRecords] = useState<ProcessAuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ userId: "", processId: "", outcome: "", riskLevel: "", search: "" });

  const loadDashboard = useCallback(async () => {
    const res = await fetch(`/api/system/process-audit?mode=dashboard&range=${range}`, { credentials: "include" });
    if (res.ok) setMetrics(((await res.json()) as { metrics: ProcessDashboardMetrics }).metrics);
  }, [range]);

  const loadRecords = useCallback(async (append = false) => {
    const params = new URLSearchParams();
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.processId) params.set("processId", filters.processId);
    if (filters.outcome) params.set("outcome", filters.outcome);
    if (filters.riskLevel) params.set("riskLevel", filters.riskLevel);
    if (filters.search) params.set("search", filters.search);
    if (append && nextCursor) params.set("cursor", nextCursor);
    const res = await fetch(`/api/system/process-audit?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { records: ProcessAuditRecord[]; total: number; nextCursor: string | null };
      setRecords((prev) => (append ? [...prev, ...data.records] : data.records));
      setTotal(data.total);
      setNextCursor(data.nextCursor);
    }
  }, [filters, nextCursor]);

  useEffect(() => {
    if (!hasPageAccess) return;
    void loadDashboard();
    void loadRecords(false);
  }, [hasPageAccess, loadDashboard, filters]);

  if (!hasPageAccess) {
    return (
      <SystemShell title="Process Audit" audit={{ moduleLabel: "Process Audit" }}>
        <p className="text-sm text-slate-600">You do not have access to Process Audit.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Process Audit"
      subtitle="Track who ran which workspace process, when, and with what outcome"
      audit={{ moduleLabel: "Process Audit" }}
      actions={
        <a href="/api/system/process-audit/export" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Export CSV
        </a>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {(["today", "7d", "30d"] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-full px-3 py-1 text-xs font-medium ${range === r ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"}`}>
            {r === "today" ? "Today" : r === "7d" ? "Last 7 days" : "Last 30 days"}
          </button>
        ))}
      </div>
      {metrics ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AuditMetricCard label="Total executions" value={metrics.totalExecutions} />
          <AuditMetricCard label="Successful" value={metrics.successfulExecutions} />
          <AuditMetricCard label="Failed" value={metrics.failedExecutions} />
          <AuditMetricCard label="Denied" value={metrics.deniedExecutions} />
          <AuditMetricCard label="Unique users" value={metrics.uniqueUsers} />
          <AuditMetricCard label="Risk events" value={metrics.riskEvents} sub={`${metrics.highRiskEvents} high`} />
          <AuditMetricCard label="Most active process" value={metrics.mostActiveProcess?.processLabel ?? "—"} sub={metrics.mostActiveProcess ? `${metrics.mostActiveProcess.count} runs` : undefined} />
          <AuditMetricCard label="Most active user" value={metrics.mostActiveUser?.userName ?? "—"} sub={metrics.mostActiveUser ? `${metrics.mostActiveUser.count} runs` : undefined} />
        </div>
      ) : null}
      <div className="mb-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select className={auditInputClass} value={filters.userId} onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}>
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
        </select>
        <select className={auditInputClass} value={filters.processId} onChange={(e) => setFilters((f) => ({ ...f, processId: e.target.value }))}>
          <option value="">All processes</option>
          {ACCESS_PROCESSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select className={auditInputClass} value={filters.outcome} onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))}>
          <option value="">All outcomes</option>
          {Object.entries(PROCESS_OUTCOME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={auditInputClass} value={filters.riskLevel} onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value }))}>
          <option value="">All risk levels</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
        </select>
        <input className={auditInputClass} placeholder="Search…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th><th className="px-4 py-3">Process</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium">{r.userName}</td>
                <td className="px-4 py-3">{r.processLabel}</td>
                <td className="px-4 py-3 text-slate-600">{r.entityLabel || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatAuditDateTime(r.startedAt)}</td>
                <td className="px-4 py-3">{PROCESS_OUTCOME_LABELS[r.outcome]}</td>
                <td className="px-4 py-3">{r.riskLevel !== "none" ? RISK_SEVERITY_LABELS[r.riskLevel as keyof typeof RISK_SEVERITY_LABELS] : "—"}</td>
                <td className="px-4 py-3 text-right"><button type="button" className="text-[#b51266] hover:underline" onClick={() => setSelectedId(r.id)}>Investigate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t px-4 py-2 text-xs text-slate-500">{total} execution(s) · last 7 days by default</p>
        {nextCursor ? (
          <div className="border-t px-4 py-3 text-center">
            <button type="button" className="text-sm font-medium text-[#b51266] hover:underline" onClick={() => void loadRecords(true)}>
              Load more
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-slate-500">Process records are system-generated and read-only. Record changes remain in the existing audit trail.</p>
      {selectedId ? <InvestigationPanel id={selectedId} onClose={() => setSelectedId(null)} canInvestigate={canInvestigate} /> : null}
    </SystemShell>
  );
}
