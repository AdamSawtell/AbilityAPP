"use client";

import type { TimesheetLine } from "@/lib/timesheet";
import {
  verificationStatusClass,
  verificationStatusLabel,
  type TimesheetVerificationSummary,
} from "@/lib/timesheet-verification";

export function TimesheetVerificationPanel({
  summary,
  lines,
}: {
  summary: TimesheetVerificationSummary;
  lines: TimesheetLine[];
}) {
  if (!lines.length) return null;

  const lineLabel = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId);
    if (!line?.shiftDate) return "Shift line";
    return `${line.shiftDate} ${line.startTime?.slice(0, 5) || "—"} – ${line.endTime?.slice(0, 5) || "—"}`;
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Shift verification</h2>
          <p className="mt-1 text-sm text-slate-600">
            Compare rostered hours to worker check-in/out before approving for payroll.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-950">
            {summary.verifiedCount} verified
          </span>
          {summary.issueCount ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-950">
              {summary.issueCount} need review
            </span>
          ) : null}
        </div>
      </div>

      {summary.blockReason ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Approval blocked: {summary.blockReason}
        </p>
      ) : summary.verifiedCount === lines.length ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          All linked shifts are verified against check-in/out data.
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {summary.lines.map((row) => (
          <li
            key={row.lineId}
            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{lineLabel(row.lineId)}</p>
              <p className="mt-0.5 text-slate-600">{row.message}</p>
              {row.actualHours != null ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  Rostered {row.scheduledHours.toFixed(2)} h · Actual {row.actualHours.toFixed(2)} h
                  {row.varianceHours != null && row.varianceHours !== 0
                    ? ` · Variance ${row.varianceHours > 0 ? "+" : ""}${row.varianceHours.toFixed(2)} h`
                    : null}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${verificationStatusClass(row.status)}`}
            >
              {verificationStatusLabel(row.status)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
