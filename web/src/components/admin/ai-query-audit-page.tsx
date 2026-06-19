"use client";

import { useCallback, useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { AuditMetricCard, auditInputClass } from "@/components/admin/audit-monitoring-shared";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { useAuth } from "@/lib/auth-store";
import { formatAuditDateTime } from "@/lib/audit";
import { AI_QUERY_OUTCOME_LABELS } from "@/lib/ai-query-audit/constants";
import { RISK_SEVERITY_LABELS, RISK_STATUS_LABELS } from "@/lib/session-audit/constants";
import type { AiQueryAuditRecord, AiQueryDashboardMetrics, AiQueryInvestigationDetail } from "@/lib/ai-query-audit/types";
import { truncateText } from "@/lib/audit-monitoring/shared";

function InvestigationPanel({ id, onClose, canInvestigate }: { id: string; onClose: () => void; canInvestigate: boolean }) {
  const [detail, setDetail] = useState<AiQueryInvestigationDetail | null>(null);
  const [note, setNote] = useState("");
  const [riskStatus, setRiskStatus] = useState("new");

  const load = useCallback(async () => {
    const res = await fetch(`/api/system/ai-query-audit/${id}`, { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as AiQueryInvestigationDetail;
      setDetail(data);
      setRiskStatus(data.record.riskStatus);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!detail) return null;
  const r = detail.record;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">AI query investigation</h2>
            <p className="text-xs text-slate-500">{r.agentName} · {formatAuditDateTime(r.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100">Close</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 px-6 py-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm">
            <p className="text-xs font-medium uppercase text-slate-500">User query</p>
            <p className="mt-1 whitespace-pre-wrap">{r.userMessage}</p>
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <p className="text-xs font-medium uppercase text-slate-500">Assistant response</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{truncateText(r.assistantMessage, 1500)}</p>
          </div>
          {detail.dbAccessLog.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Related DB tool access</h3>
              <ul className="space-y-1 text-sm">
                {detail.dbAccessLog.map((row, i) => (
                  <li key={i} className="rounded border px-2 py-1">{formatAuditDateTime(row.createdAt)} — {row.toolName} {row.action} {row.target}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {canInvestigate ? (
            <section className="rounded-xl border p-4">
              <select className={`${auditInputClass} mb-3 w-full`} value={riskStatus} onChange={(e) => setRiskStatus(e.target.value)}>
                {Object.entries(RISK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <textarea className={`${auditInputClass} w-full`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              <button type="button" onClick={() => void fetch(`/api/system/ai-query-audit/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ note, riskStatus }) }).then(() => load())} className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm text-white">Save</button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AiQueryAuditView() {
  const { users, canProcess } = useAuth();
  const { hasAccess, isSystemOperator } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("admin-ai-query-audit");
  const canInvestigate = isSystemOperator || canProcess("manage-ai-query-audit-risk");

  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");
  const [metrics, setMetrics] = useState<AiQueryDashboardMetrics | null>(null);
  const [records, setRecords] = useState<AiQueryAuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ userId: "", outcome: "", riskLevel: "", search: "" });

  useEffect(() => {
    if (!hasPageAccess) return;
    void fetch(`/api/system/ai-query-audit?mode=dashboard&range=${range}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setMetrics(d.metrics));
    const params = new URLSearchParams();
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.outcome) params.set("outcome", filters.outcome);
    if (filters.riskLevel) params.set("riskLevel", filters.riskLevel);
    if (filters.search) params.set("search", filters.search);
    void fetch(`/api/system/ai-query-audit?${params}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setRecords(d.records); setTotal(d.total); } });
  }, [hasPageAccess, range, filters]);

  if (!hasPageAccess) {
    return (
      <SystemShell title="AI Query Audit" audit={{ moduleLabel: "AI Query Audit" }}>
        <p className="text-sm text-slate-600">You do not have access to AI Query Audit.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell title="AI Query Audit" subtitle="Review AI assistant queries — chat log is the source of truth" audit={{ moduleLabel: "AI Query Audit" }} actions={<a href="/api/system/ai-query-audit/export" className="rounded-lg border bg-white px-4 py-2 text-sm">Export CSV</a>}>
      <div className="mb-6 flex gap-2">
        {(["today", "7d", "30d"] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-full px-3 py-1 text-xs font-medium ${range === r ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"}`}>{r === "today" ? "Today" : r === "7d" ? "Last 7 days" : "Last 30 days"}</button>
        ))}
      </div>
      {metrics ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AuditMetricCard label="Total queries" value={metrics.totalQueries} />
          <AuditMetricCard label="Successful" value={metrics.successfulQueries} />
          <AuditMetricCard label="Errors" value={metrics.errorQueries} />
          <AuditMetricCard label="Tool calls" value={metrics.toolCalls} />
          <AuditMetricCard label="Unique users" value={metrics.uniqueUsers} />
          <AuditMetricCard label="Risk events" value={metrics.riskEvents} sub={`${metrics.highRiskEvents} high`} />
          <AuditMetricCard label="Top agent" value={metrics.mostActiveAgent?.agentName ?? "—"} />
          <AuditMetricCard label="Top user" value={metrics.mostActiveUser?.userName ?? "—"} />
        </div>
      ) : null}
      <div className="mb-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4">
        <select className={auditInputClass} value={filters.userId} onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}>
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
        </select>
        <select className={auditInputClass} value={filters.outcome} onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))}>
          <option value="">All outcomes</option>
          {Object.entries(AI_QUERY_OUTCOME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={auditInputClass} value={filters.riskLevel} onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value }))}>
          <option value="">All risk</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <input className={auditInputClass} placeholder="Search queries…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Query</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.userName}</td>
                <td className="px-4 py-3">{r.agentName}</td>
                <td className="max-w-xs truncate px-4 py-3">{truncateText(r.userMessage, 80)}</td>
                <td className="px-4 py-3">{formatAuditDateTime(r.createdAt)}</td>
                <td className="px-4 py-3">{AI_QUERY_OUTCOME_LABELS[r.outcome]}</td>
                <td className="px-4 py-3">{r.riskLevel !== "none" ? RISK_SEVERITY_LABELS[r.riskLevel as keyof typeof RISK_SEVERITY_LABELS] : "—"}</td>
                <td className="px-4 py-3 text-right"><button type="button" className="text-[#b51266]" onClick={() => setSelectedId(r.id)}>Investigate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t px-4 py-2 text-xs text-slate-500">{total} quer(ies)</p>
      </div>
      <p className="mt-4 text-xs text-slate-500">Query text lives in the existing AI chat log. DB tool access comes from the AI access log — not duplicated here.</p>
      {selectedId ? <InvestigationPanel id={selectedId} onClose={() => setSelectedId(null)} canInvestigate={canInvestigate} /> : null}
    </SystemShell>
  );
}
