"use client";

import { useEffect, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import type { MobileSyncAuditRow } from "@/lib/mobile/mobile-sync-server";

export function MobileSyncReconciliationPage() {
  const { hasAccess } = useAdminPageAccess("system");
  const allowed = hasAccess("system");
  const [rows, setRows] = useState<MobileSyncAuditRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    void fetch("/api/system/reports/mobile-sync", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load sync audit");
        const data = (await res.json()) as { rows: MobileSyncAuditRow[] };
        setRows(data.rows ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [allowed]);

  return (
    <SystemShell
      title="Mobile offline sync reconciliation"
      subtitle="Finance-readable audit of offline check-in/out sync attempts (CFO C-02)"
      audit={{ moduleLabel: "Mobile sync reconciliation" }}
    >
      {!allowed ? (
        <p className="text-sm text-slate-600">System operator access required.</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-600">No offline sync events recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Synced</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Shift</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Sync ID</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-xs text-slate-600">{formatWhen(row.syncedAt)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2">{row.actionType}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.shiftId}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.employeeId}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{row.syncId.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.rejectionReason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SystemShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "accepted"
      ? "bg-emerald-50 text-emerald-800"
      : status === "duplicate"
        ? "bg-sky-50 text-sky-800"
        : "bg-rose-50 text-rose-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
