"use client";

import { useEffect, useState } from "react";
import {
  AgencyPortalGuard,
  AgencyPortalLogoutButton,
} from "@/components/agency-portal/agency-portal-hub-page";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";
import { formatAgencyTimesheetPeriod } from "@/lib/agency-timesheet";
import type { AgencyPortalTimesheetItem } from "@/lib/agency-portal/types";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value || 0);
}

export function AgencyPortalTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<AgencyPortalTimesheetItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agency-portal/timesheets", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load");
        const data = (await res.json()) as { timesheets: AgencyPortalTimesheetItem[] };
        setTimesheets(data.timesheets);
      })
      .catch(() => setError("Could not load timesheets."));
  }, []);

  return (
    <AgencyPortalGuard>
      {() => (
        <AgencyPortalShell
          title="Timesheets"
          subtitle="Approved timesheets ready for invoicing"
          actions={<AgencyPortalLogoutButton />}
        >
          <AgencyPortalNav active="timesheets" />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {!timesheets ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : timesheets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
              No approved timesheets yet. Your provider generates these after completed agency shifts.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timesheets.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.documentNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatAgencyTimesheetPeriod(row.periodStart, row.periodEnd)}
                      </td>
                      <td className="px-4 py-3">{row.totalHours.toFixed(2)}</td>
                      <td className="px-4 py-3">{formatMoney(row.totalVendorCost)}</td>
                      <td className="px-4 py-3">
                        {row.hasInvoice ? (
                          <span className="text-emerald-700">Submitted</span>
                        ) : (
                          <span className="text-amber-700">Ready to invoice</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
