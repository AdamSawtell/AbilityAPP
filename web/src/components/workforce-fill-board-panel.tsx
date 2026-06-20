"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClientRecordLink, EmployeeRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { buildFillBoardVacancies } from "@/lib/roster-fill-board";
import { formatShiftTimeRange, normalizeRosterShift, weekStartFromDate } from "@/lib/roster-shift";

export function WorkforceFillBoardPanel() {
  const { rosterShifts, employees, clients, upsertRosterShift } = useData();
  const { session, canWriteWindow } = useAuth();
  const canAssign = canWriteWindow("rostering");
  const actor = session?.displayName || "SuperUser";

  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(new Date().toISOString().slice(0, 10)));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyShiftId, setBusyShiftId] = useState<string | null>(null);

  const vacancies = useMemo(
    () =>
      buildFillBoardVacancies({
        shifts: rosterShifts,
        employees,
        clients,
        weekStart,
      }),
    [rosterShifts, employees, clients, weekStart]
  );

  function assignWorker(shiftId: string, employeeId: string) {
    if (!canAssign) return;
    setError("");
    setMessage("");
    setBusyShiftId(shiftId);
    const shift = rosterShifts.find((s) => s.id === shiftId);
    if (!shift) {
      setError("Shift not found.");
      setBusyShiftId(null);
      return;
    }
    const next = normalizeRosterShift({ ...shift, employeeId, updatedBy: actor });
    const saveError = upsertRosterShift(next);
    setBusyShiftId(null);
    if (saveError) {
      setError(saveError);
      return;
    }
    const worker = employees.find((e) => e.id === employeeId);
    setMessage(`Assigned ${worker?.name ?? employeeId} to shift on ${next.shiftDate}.`);
  }

  return (
    <section id="fill-board" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Roster fill board</h2>
        <p className="mt-1 text-sm text-slate-600">
          Vacant shifts with suggested workers — assign directly or open Rostering for full editing.
        </p>
      </div>

      <label className="block max-w-xs text-sm">
        <span className="mb-1 block font-medium text-slate-700">Focus week starting</span>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(weekStartFromDate(e.target.value))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}

      {!vacancies.length ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          No vacant shifts in the current horizon — publish RoC lines or create draft shifts to fill.
        </p>
      ) : (
        <ul className="space-y-4">
          {vacancies.map(({ shift, shiftHours, candidates }) => {
            const client = clients.find((c) => c.id === shift.clientId);
            return (
              <li key={shift.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vacant shift</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {shift.shiftDate} · {formatShiftTimeRange(shift.startTime, shift.endTime)} · {shiftHours.toFixed(1)}h
                    </p>
                    {client ? (
                      <ClientRecordLink
                        id={client.id}
                        searchKey={client.searchKey}
                        name={client.name}
                        className="mt-1 inline-block text-sm text-[#b51266] hover:underline"
                      />
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">{shift.status}</p>
                  </div>
                  <Link href="/rostering" className="text-sm text-[#b51266] hover:underline">
                    Open rostering
                  </Link>
                </div>

                {candidates.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested workers</p>
                    <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {candidates.map((candidate) => (
                        <li
                          key={candidate.employeeId}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <EmployeeRecordLink
                              id={candidate.employeeId}
                              searchKey={candidate.employeeName}
                              name={candidate.employeeName}
                              className="font-medium text-slate-900 hover:underline"
                            />
                            <p className="text-xs text-slate-600">
                              {candidate.remainingHours.toFixed(1)}h free this week · {candidate.topHint}
                            </p>
                          </div>
                          {canAssign ? (
                            <button
                              type="button"
                              disabled={busyShiftId === shift.id}
                              onClick={() => assignWorker(shift.id, candidate.employeeId)}
                              className="rounded-lg border border-[#b51266] bg-white px-3 py-1.5 text-xs font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60"
                            >
                              Assign
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-amber-800">No workers with remaining capacity for this shift.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
