"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ReportTable } from "@/components/report-table";
import { useAuth } from "@/lib/auth-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { ReportResult } from "@/lib/reports/types";

const STARTER_SQL = `select search_key, name, status, email, phone
from client
order by name
limit 100`;

export function ReportsAdvanceView() {
  const { canWindow } = useAuth();
  const [sql, setSql] = useState(STARTER_SQL);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [ranAt, setRanAt] = useState<string | null>(null);

  const canUse = canWindow("reports-advance");

  const runQuery = useCallback(async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/reports/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sql }),
      });
      const data = (await res.json()) as {
        error?: string;
        columns?: ReportResult["columns"];
        rows?: ReportResult["rows"];
        rowCount?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Query failed");
        setResult(null);
        return;
      }
      setResult({
        columns: data.columns ?? [],
        rows: data.rows ?? [],
      });
      setRanAt(new Date().toLocaleString());
    } catch {
      setError("Could not run query. Check your connection and try again.");
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, [sql]);

  if (!canUse) {
    return (
      <AppShell
        title="Reports Advance"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Reports", href: "/reports" },
          { label: "Reports Advance" },
        ]}
      >
        <p className="text-sm text-slate-500">Your role does not have access to Reports Advance.</p>
        <Link href="/reports" className="mt-4 inline-block text-sm font-medium text-[#d4147a] hover:underline">
          Back to reports
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Reports Advance"
      subtitle="Write read-only SQL against the database. Results can be reviewed and exported to CSV."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Reports", href: "/reports" },
        { label: "Reports Advance" },
      ]}
      audit={{ moduleLabel: "Reports Advance — SQL console" }}
    >
      <div className="space-y-4">
        {!isSupabaseConfigured() ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Reports Advance requires Supabase. Configure environment variables to run queries.
          </p>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">SQL console</h2>
            <p className="text-xs text-slate-500">SELECT only · single statement · max 5,000 rows</p>
          </div>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            spellCheck={false}
            className="min-h-[180px] w-full rounded-lg border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-sm text-emerald-100 outline-none focus:border-[#d4147a]"
            placeholder="SELECT …"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void runQuery()}
              disabled={running || !isSupabaseConfigured()}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
            >
              {running ? "Running…" : "Run query"}
            </button>
            <button
              type="button"
              onClick={() => setSql(STARTER_SQL)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Reset example
            </button>
          </div>
          {error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}
        </section>

        {result ? (
          <ReportTable
            title="Query results"
            description={
              ranAt
                ? `Ran ${ranAt} · column layout is temporary while this window is open`
                : "Column layout is temporary while this window is open"
            }
            columns={result.columns}
            rows={result.rows}
            maxColumns={Math.max(result.columns.length, 20)}
            exportFilename={`reports-advance-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`}
          />
        ) : (
          <p className="text-sm text-slate-500">Run a query to see results here.</p>
        )}
      </div>
    </AppShell>
  );
}
