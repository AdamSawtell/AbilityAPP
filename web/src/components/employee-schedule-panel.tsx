"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { useData } from "@/lib/data-store";
import {
  addDaysIso,
  formatShiftTimeRange,
  normalizeRosterShift,
  shiftDurationHours,
  weekStartFromDate,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftsForEmployeeWeek(
  shifts: RosterShiftRecord[],
  employeeId: string,
  weekStart: string
): RosterShiftRecord[] {
  const end = addDaysIso(weekStart, 6);
  return shifts
    .map(normalizeRosterShift)
    .filter(
      (s) =>
        s.employeeId === employeeId &&
        s.status !== "Cancelled" &&
        s.shiftDate >= weekStart &&
        s.shiftDate <= end
    )
    .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`));
}

export function EmployeeSchedulePanel({ employeeId }: { employeeId: string }) {
  const { rosterShifts, clients, locations } = useData();
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(new Date().toISOString().slice(0, 10)));
  const [fortnight, setFortnight] = useState(false);

  const weekStarts = useMemo(
    () => (fortnight ? [weekStart, addDaysIso(weekStart, 7)] : [weekStart]),
    [fortnight, weekStart]
  );

  const days = useMemo(
    () => weekStarts.flatMap((start) => DAY_LABELS.map((_, i) => addDaysIso(start, i))),
    [weekStarts]
  );

  const shifts = useMemo(
    () =>
      weekStarts.flatMap((start) => shiftsForEmployeeWeek(rosterShifts, employeeId, start)),
    [rosterShifts, employeeId, weekStarts]
  );

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, RosterShiftRecord[]>();
    for (const day of days) map.set(day, []);
    for (const shift of shifts) {
      map.get(shift.shiftDate)?.push(shift);
    }
    return map;
  }, [days, shifts]);

  const totalHours = useMemo(
    () => Math.round(shifts.reduce((sum, s) => sum + shiftDurationHours(s), 0) * 10) / 10,
    [shifts]
  );

  function prevWeek() {
    setWeekStart(addDaysIso(weekStart, fortnight ? -14 : -7));
  }

  function nextWeek() {
    setWeekStart(addDaysIso(weekStart, fortnight ? 14 : 7));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Assigned roster shifts for this worker — use the week navigator to plan ahead.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={prevWeek}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={nextWeek}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Next
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={fortnight}
            onChange={(e) => setFortnight(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show fortnight
        </label>
        <label className="ml-auto text-sm">
          <span className="mr-2 text-slate-600">Week starting</span>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(weekStartFromDate(e.target.value))}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shifts</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{shifts.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hours</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Horizon</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{fortnight ? "2 weeks" : "1 week"}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(7rem, 1fr))` }}>
          {days.map((day) => (
            <div key={day} className="border-r border-slate-100 last:border-r-0">
              <div className="border-b border-slate-100 bg-slate-50/80 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                {DAY_LABELS[(new Date(`${day}T12:00:00`).getDay() + 6) % 7]}
                <div className="font-normal text-slate-500">{day.slice(5)}</div>
              </div>
              <div className="min-h-[8rem] space-y-2 p-2">
                {(shiftsByDay.get(day) ?? []).map((shift) => {
                  const client = clients.find((c) => c.id === shift.clientId);
                  const location = locations.find((l) => l.id === shift.locationId);
                  return (
                    <Link
                      key={shift.id}
                      href="/rostering"
                      className="block rounded-lg border border-slate-200 bg-slate-50/80 p-2 text-xs hover:border-[#d4147a]/40"
                    >
                      <p className="font-medium text-slate-900">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
                      {client ? (
                        <ClientRecordLink
                          id={client.id}
                          searchKey={client.searchKey}
                          name={client.name}
                          className="mt-1 block text-[#b51266] hover:underline"
                        />
                      ) : null}
                      <p className="mt-0.5 text-slate-500">{location?.searchKey || shift.status}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
