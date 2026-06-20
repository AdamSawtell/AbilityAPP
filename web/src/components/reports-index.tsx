"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { ACCESS_REPORTS, reportsByModuleGroup } from "@/lib/reports/catalog";

const MODULE_ORDER = ["Core", "Clients", "Enquiries", "Locations", "People", "Services"] as const;

export function ReportsIndexView() {
  const { session, canWindow, canReport } = useAuth();

  const grouped = useMemo(
    () => reportsByModuleGroup(session?.reportIds ?? []),
    [session?.reportIds]
  );

  const accessible = ACCESS_REPORTS.filter((r) => canReport(r.id));

  return (
    <AppShell
      title="Reports"
      subtitle="Review and export data by module. Column layout is temporary while a report window is open."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Reports" }]}
      audit={{ moduleLabel: "Reports" }}
    >
      {!canWindow("reports") ? (
        <p className="text-sm text-slate-500">Your role does not have access to reports.</p>
      ) : accessible.length === 0 ? (
        <p className="text-sm text-slate-500">No reports are assigned to your role. Ask an administrator to grant report access.</p>
      ) : (
        <div className="space-y-8">
          {canWindow("financial-close") ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Month-end</h2>
              <Link
                href="/financial-close"
                className="inline-flex rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#f9a8d4] hover:bg-[#fdf2f8]"
              >
                <div>
                  <p className="font-medium text-slate-900">Financial close checklist</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Plan, billing, and payroll sign-off before month-end close.
                  </p>
                </div>
              </Link>
            </section>
          ) : null}
          {MODULE_ORDER.map((module) => {
            const reports = grouped.get(module);
            if (!reports?.length) return null;
            return (
              <section key={module}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{module}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {reports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports/${report.id}`}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#f9a8d4] hover:bg-[#fdf2f8]"
                    >
                      <p className="font-medium text-slate-900">{report.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{report.description}</p>
                      <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {report.exportFormats.join(", ").toUpperCase()} · up to {report.maxColumns} columns
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
