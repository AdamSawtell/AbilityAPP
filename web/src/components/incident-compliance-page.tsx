"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentNdisChecklist } from "@/components/incident-ndis-checklist";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatDisplayDateTime, isNdisReportOverdue, type IncidentRecord } from "@/lib/incident";
import { ndisChecklistProgress } from "@/lib/incident-ndis";
import { downloadCsv, rowsToCsv } from "@/lib/reports/export";
import {
  buildNdisReportableIncidentsReport,
  NDIS_REPORTABLE_COLUMNS,
} from "@/lib/reports/runners/incident-register";
import { buildIncidentComplianceDigest } from "@/lib/reports/runners/incident-compliance-digest";

function exportNdisCsv(incidents: IncidentRecord[]) {
  const result = buildNdisReportableIncidentsReport(incidents);
  const csv = rowsToCsv(result.rows, result.columns);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`ndis-reportable-incidents-${date}.csv`, csv);
}

export function IncidentCompliancePage() {
  const { incidents } = useData();
  const { canReport } = useAuth();
  const [digestText, setDigestText] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  const digest = useMemo(() => buildIncidentComplianceDigest(incidents), [incidents]);

  const reportable = useMemo(() => incidents.filter((i) => i.isReportable), [incidents]);
  const openReportable = useMemo(
    () => reportable.filter((i) => i.status !== "Closed"),
    [reportable]
  );
  const overdue = useMemo(() => openReportable.filter(isNdisReportOverdue), [openReportable]);
  const incomplete = useMemo(
    () => openReportable.filter((i) => !ndisChecklistProgress(i).complete),
    [openReportable]
  );

  async function loadDigestPreview() {
    setDigestLoading(true);
    try {
      const res = await fetch("/api/incidents/compliance-digest?format=text", { credentials: "include" });
      const text = await res.text();
      setDigestText(res.ok ? text : "Could not load digest.");
    } catch {
      setDigestText("Could not load digest.");
    } finally {
      setDigestLoading(false);
    }
  }

  return (
    <AppShell
      title="NDIS compliance"
      subtitle="Track reportable incidents, submission deadlines, and audit-ready exports."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Incident reports", href: "/incidents" },
        { label: "NDIS compliance" },
      ]}
      audit={{ moduleLabel: "NDIS incident compliance" }}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportNdisCsv(incidents)}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Export NDIS CSV
          </button>
          {canReport("incident-register") ? (
            <Link
              href="/reports/incident-register"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Full incident register
            </Link>
          ) : null}
          {canReport("ndis-reportable-incidents") ? (
            <Link
              href="/reports/ndis-reportable-incidents"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Report view
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Open reportable</p>
          <p className="mt-1 text-3xl font-semibold text-amber-950">{openReportable.length}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-900">NDIS overdue</p>
          <p className="mt-1 text-3xl font-semibold text-rose-950">{overdue.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Checklist incomplete</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{incomplete.length}</p>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Compliance digest</h2>
            <p className="mt-1 text-sm text-slate-600">
              Summary for managers and scheduled email jobs. API:{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-xs">/api/incidents/compliance-digest</code>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canReport("incident-compliance-digest") ? (
              <Link
                href="/reports/incident-compliance-digest"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Export digest CSV
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void loadDigestPreview()}
              disabled={digestLoading}
              className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
            >
              {digestLoading ? "Loading…" : "Preview digest"}
            </button>
          </div>
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          {digest.sections.map((section) => (
            <li key={section.label} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="font-medium text-slate-900">{section.label}</span>: {section.count}
            </li>
          ))}
        </ul>
        {digestText ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 whitespace-pre-wrap">
            {digestText}
          </pre>
        ) : null}
      </section>

      {overdue.length > 0 ? (
        <section className="mb-8 rounded-xl border border-rose-200 bg-rose-50/50 p-5">
          <h2 className="font-semibold text-rose-900">Overdue Commission notification</h2>
          <ul className="mt-3 divide-y divide-rose-100">
            {overdue.map((incident) => (
              <li key={incident.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/incidents/${incident.id}`} className="font-medium text-rose-900 hover:underline">
                    {incident.documentNo} — {incident.title || "Untitled"}
                  </Link>
                  <p className="text-sm text-rose-800/90">
                    {incident.reportableType}
                    {incident.reportDeadlineAt ? ` · due ${formatDisplayDateTime(incident.reportDeadlineAt)}` : ""}
                  </p>
                </div>
                <Link
                  href={`/incidents/${incident.id}?tab=${encodeURIComponent("Notifications")}`}
                  className="text-sm font-medium text-rose-800 hover:underline"
                >
                  Log notification
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Open reportable incidents</h2>
          <p className="mt-1 text-sm text-slate-600">
            Export includes {NDIS_REPORTABLE_COLUMNS.length} audit columns for Commission review.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Checklist</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {openReportable.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No open NDIS reportable incidents.
                  </td>
                </tr>
              ) : (
                openReportable.map((incident) => {
                  const progress = ndisChecklistProgress(incident);
                  return (
                    <tr key={incident.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link href={`/incidents/${incident.id}`} className="font-medium text-[#b51266] hover:underline">
                          {incident.documentNo}
                        </Link>
                        <p className="truncate text-slate-600">{incident.title}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{incident.reportableType || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={isNdisReportOverdue(incident) ? "font-medium text-rose-700" : "text-slate-600"}>
                          {incident.reportDeadlineAt ? formatDisplayDateTime(incident.reportDeadlineAt) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {progress.doneRequired}/{progress.totalRequired}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{incident.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openReportable[0] ? (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-slate-600">
            Example checklist for <strong>{openReportable[0].documentNo}</strong>:
          </p>
          <IncidentNdisChecklist incident={openReportable[0]} />
        </section>
      ) : null}
    </AppShell>
  );
}
