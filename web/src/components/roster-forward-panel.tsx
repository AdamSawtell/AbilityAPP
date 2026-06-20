"use client";

import { useMemo } from "react";
import { ClientRecordLink } from "@/components/record-link";
import type { ClientRecord } from "@/lib/client";
import {
  addDaysIso,
  formatDayHeading,
  forwardWeekStarts,
  normalizeRosterShift,
  shiftDurationHours,
  shiftsForWeek,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import { detectRosterShiftConflicts } from "@/lib/roster-shift-conflicts";

type WeekSummary = {
  weekStart: string;
  shiftCount: number;
  hours: number;
  conflictCount: number;
};

type ClientWeekRow = {
  client: ClientRecord;
  byWeek: WeekSummary[];
  totalHours: number;
};

function summarizeWeek(
  weekStart: string,
  shifts: RosterShiftRecord[],
  allShifts: RosterShiftRecord[]
): WeekSummary {
  const weekShifts = shiftsForWeek(shifts, weekStart).filter((s) => s.status !== "Cancelled");
  let conflictCount = 0;
  for (const shift of weekShifts) {
    const issues = detectRosterShiftConflicts(shift, { existing: allShifts });
    if (issues.some((i) => i.severity === "error")) conflictCount += 1;
  }
  return {
    weekStart,
    shiftCount: weekShifts.length,
    hours: weekShifts.reduce((sum, s) => sum + shiftDurationHours(s), 0),
    conflictCount,
  };
}

export function RosterForwardPanel({
  rosterShifts,
  clients,
  anchorWeekStart,
  weekCount,
  onAnchorChange,
  onWeekCountChange,
}: {
  rosterShifts: RosterShiftRecord[];
  clients: ClientRecord[];
  anchorWeekStart: string;
  weekCount: number;
  onAnchorChange: (weekStart: string) => void;
  onWeekCountChange: (count: number) => void;
}) {
  const normalized = useMemo(() => rosterShifts.map(normalizeRosterShift), [rosterShifts]);
  const weeks = useMemo(() => forwardWeekStarts(anchorWeekStart, weekCount), [anchorWeekStart, weekCount]);

  const weekTotals = useMemo(
    () => weeks.map((weekStart) => summarizeWeek(weekStart, normalized, normalized)),
    [weeks, normalized]
  );

  const clientRows = useMemo(() => {
    const clientIds = [...new Set(normalized.map((s) => s.clientId).filter(Boolean))];
    const rows: ClientWeekRow[] = [];
    for (const clientId of clientIds) {
      const client = clients.find((c) => c.id === clientId);
      if (!client) continue;
      const clientShifts = normalized.filter((s) => s.clientId === clientId);
      const byWeek = weeks.map((weekStart) => summarizeWeek(weekStart, clientShifts, normalized));
      rows.push({
        client,
        byWeek,
        totalHours: byWeek.reduce((sum, w) => sum + w.hours, 0),
      });
    }
    return rows.sort((a, b) => a.client.name.localeCompare(b.client.name));
  }, [clients, normalized, weeks]);

  const grandTotalHours = weekTotals.reduce((sum, w) => sum + w.hours, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onAnchorChange(addDaysIso(anchorWeekStart, -7 * weekCount))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Previous {weekCount} weeks
        </button>
        <p className="text-sm font-medium text-slate-800">
          Forward plan from {formatDayHeading(anchorWeekStart)} — {formatDayHeading(addDaysIso(weeks[weeks.length - 1] ?? anchorWeekStart, 6))}
        </p>
        <button
          type="button"
          onClick={() => onAnchorChange(addDaysIso(anchorWeekStart, 7 * weekCount))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Next {weekCount} weeks
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Horizon
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
            value={weekCount}
            onChange={(e) => onWeekCountChange(Number(e.target.value))}
          >
            {[4, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n} weeks
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total rostered hours</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{grandTotalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shifts in horizon</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {weekTotals.reduce((sum, w) => sum + w.shiftCount, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Conflicts flagged</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">
            {weekTotals.reduce((sum, w) => sum + w.conflictCount, 0)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
              <th className="sticky left-0 z-10 bg-slate-50/95 px-4 py-3 font-semibold text-slate-700">Client</th>
              {weeks.map((weekStart) => (
                <th key={weekStart} className="min-w-[7rem] px-3 py-3 font-semibold text-slate-700">
                  W/C {formatDayHeading(weekStart)}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {clientRows.length ? (
              clientRows.map((row) => (
                <tr key={row.client.id} className="border-b border-slate-100 last:border-0">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <ClientRecordLink
                      id={row.client.id}
                      searchKey={row.client.searchKey}
                      name={row.client.name}
                      className="font-medium text-slate-900 hover:underline"
                    />
                  </td>
                  {row.byWeek.map((cell) => (
                    <td key={`${row.client.id}-${cell.weekStart}`} className="px-3 py-3 text-slate-700">
                      {cell.shiftCount ? (
                        <span>
                          {cell.hours.toFixed(1)}h
                          <span className="ml-1 text-xs text-slate-500">({cell.shiftCount})</span>
                          {cell.conflictCount ? (
                            <span className="ml-1 text-xs font-medium text-rose-700">{cell.conflictCount} conflict</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 font-medium text-slate-900">{row.totalHours.toFixed(1)}h</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={weeks.length + 2} className="px-4 py-8 text-center text-slate-500">
                  No rostered shifts in this horizon — use Week view to add shifts.
                </td>
              </tr>
            )}
          </tbody>
          {clientRows.length ? (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/50 font-medium text-slate-800">
                <td className="sticky left-0 z-10 bg-slate-50/95 px-4 py-3">All clients</td>
                {weekTotals.map((cell) => (
                  <td key={`total-${cell.weekStart}`} className="px-3 py-3">
                    {cell.hours.toFixed(1)}h ({cell.shiftCount})
                  </td>
                ))}
                <td className="px-4 py-3">{grandTotalHours.toFixed(1)}h</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
