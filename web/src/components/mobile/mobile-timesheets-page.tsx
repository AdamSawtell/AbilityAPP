"use client";

import { useMemo, useState } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatTimesheetPeriod, type TimesheetRecord } from "@/lib/timesheet";
import { timesheetSubmitBlocked } from "@/lib/timesheet-workflow";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
};

export function MobileTimesheetsPage() {
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
    upsertTimesheet({ ...sheet, status: "Submitted", updatedBy: actor });
    setMessage(`${sheet.documentNo} submitted.`);
    showSuccessToast(SAVE_TOAST_MESSAGES.timesheetSubmit);
  }

  return (
    <MobileAuthGuard windowKey="my-timesheets">
      <MobileEmployeeShell title="My timesheets" subtitle="Review and submit pay period timesheets">
        {error ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
        ) : null}
        {message ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            {message}
          </p>
        ) : null}

        {!employeeId ? (
          <p className="text-sm text-slate-500">Link your user to an employee record.</p>
        ) : mySheets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No timesheets yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {mySheets.map((sheet) => (
              <li key={sheet.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{sheet.documentNo}</p>
                    <p className="text-sm text-slate-600">
                      {formatTimesheetPeriod(sheet.periodStart, sheet.periodEnd)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[sheet.status] ?? statusTone.Draft}`}
                  >
                    {sheet.status}
                  </span>
                </div>
                {sheet.status === "Draft" ? (
                  <button
                    type="button"
                    onClick={() => submitSheet(sheet)}
                    className="mt-3 min-h-11 w-full rounded-xl bg-[#b51266] text-sm font-semibold text-white"
                  >
                    Submit for approval
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
