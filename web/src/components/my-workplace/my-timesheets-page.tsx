"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs, useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatTimesheetPeriod, type TimesheetRecord } from "@/lib/timesheet";
import { timesheetSubmitBlocked } from "@/lib/timesheet-workflow";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { EmptyState } from "@/components/ui/empty-state";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
};

export function MyTimesheetsPage() {
  const { session } = useAuth();
  const { employee } = useMyEmployee();
  const { timesheets, upsertTimesheet } = useData();
  const employeeId = employee?.id?.trim() ?? session?.employeeBpId?.trim() ?? "";
  const actor = session?.displayName ?? "Self-service";

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const mySheets = useMemo(
    () =>
      timesheets
        .filter((sheet) => sheet.employeeId === employeeId)
        .sort((a, b) => (b.periodStart || "").localeCompare(a.periodStart || "")),
    [timesheets, employeeId]
  );

  function submitSheet(sheet: TimesheetRecord) {
    setError("");
    setMessage("");
    const block = timesheetSubmitBlocked(sheet);
    if (block) {
      setError(block);
      return;
    }
    upsertTimesheet({
      ...sheet,
      status: "Submitted",
      updatedBy: actor,
    });
    setMessage(`${sheet.documentNo} submitted for supervisor approval.`);
    showSuccessToast(SAVE_TOAST_MESSAGES.timesheetSubmit);
  }

  return (
    <MyWorkplaceGuard windowKey="my-timesheets">
      <AppShell
        title="My timesheets"
        subtitle="Review and submit your pay period timesheets."
        breadcrumbs={myWorkplaceBreadcrumbs("My timesheets")}
        audit={{ moduleLabel: "My timesheets" }}
      >
        <MyWorkplaceSubnav />
        {!employeeId ? (
          <p className="text-sm text-slate-600">
            Link your user account to an employee record to see timesheets assigned to you.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Submit draft timesheets when your shifts are complete. Supervisors approve submitted timesheets before
              payroll export.
            </p>
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
            ) : null}
            {message ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                {message}
              </p>
            ) : null}
            {mySheets.length ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Timesheet</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySheets.map((sheet) => (
                      <tr key={sheet.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <Link href={`/timesheets/${sheet.id}`} className="font-medium text-[#b51266] hover:underline">
                            {sheet.documentNo}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatTimesheetPeriod(sheet.periodStart, sheet.periodEnd)}
                        </td>
                        <td className="px-4 py-3">{sheet.totalHours.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[sheet.status] ?? "bg-slate-100"}`}
                          >
                            {sheet.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {sheet.status === "Draft" ? (
                            <button
                              type="button"
                              onClick={() => submitSheet(sheet)}
                              className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b51266]"
                            >
                              Submit
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                variant="empty"
                icon="document"
                heading="No timesheets yet"
                message="Timesheets appear here after your roster shifts are generated and assigned to you."
                action={{ label: "View my shifts", href: "/my/shifts" }}
              />
            )}
          </div>
        )}
      </AppShell>
    </MyWorkplaceGuard>
  );
}
