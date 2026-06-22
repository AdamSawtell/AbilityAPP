"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  collectComplaintsFeedback,
  complaintsFeedbackCsv,
  summarizeComplaintsFeedback,
} from "@/lib/complaints-feedback";
import { downloadCsv } from "@/lib/reports/export";

export function ComplaintsListView() {
  const { clients, incidents } = useData();
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("complaints");

  const rows = useMemo(() => collectComplaintsFeedback(clients, incidents), [clients, incidents]);
  const summary = useMemo(() => summarizeComplaintsFeedback(clients, incidents), [clients, incidents]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Complaints and participant feedback logged on client Activity (type Complaint or Feedback) and incident reports
        with category Complaint. Use this register for quality review and board reporting — there is no separate complaints
        database.
      </p>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total entries</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open complaints</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.openComplaints}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Feedback</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.feedbackCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Via incidents</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.incidentComplaints}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadCsv("complaints-feedback-register.csv", complaintsFeedbackCsv(rows))}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
        {canCreate ? (
          <>
            <Link
              href="/incidents/new"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log complaint (incident)
            </Link>
            <Link
              href="/clients"
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Log on client Activity
            </Link>
          </>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No complaints or feedback logged yet. Add an Activity line with type Complaint or Feedback on a client record,
          or create an incident with category Complaint.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-slate-700">{row.recordedAt.slice(0, 10) || "—"}</td>
                  <td className="px-4 py-3">
                    {row.clientId ? (
                      <ClientRecordLink
                        id={row.clientId}
                        searchKey={row.clientSearchKey}
                        name={row.clientName}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">{row.source}</td>
                  <td className="px-4 py-3 text-slate-700">{row.type}</td>
                  <td className="px-4 py-3">
                    <Link href={row.href} className="font-medium text-[#b51266] hover:underline">
                      {row.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.status === "Closed" || row.status === "Logged" ? "—" : "Open"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ComplaintsPageView() {
  return (
    <AppShell
      title="Complaints and feedback"
      subtitle="Register drawn from client Activity and complaint-category incidents."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Complaints and feedback" }]}
      audit={{ moduleLabel: "Complaints and feedback" }}
    >
      <ComplaintsListView />
    </AppShell>
  );
}
