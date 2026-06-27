"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClientRecordLink, EmployeeRecordLink } from "@/components/record-link";
import { ShiftRequestReviewPanel } from "@/components/shift-request-review-panel";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { buildFillBoardVacancies } from "@/lib/roster-fill-board";
import {
  filterVacanciesByFillBoardFilter,
  requestsForShift,
  type FillBoardFilter,
} from "@/lib/roster-shift-request";
import { formatShiftTimeRange, normalizeRosterShift, weekStartFromDate } from "@/lib/roster-shift";

const FILTER_OPTIONS: { id: FillBoardFilter; label: string }[] = [
  { id: "all", label: "All vacant" },
  { id: "open_no_requests", label: "Open — no requests" },
  { id: "open_with_requests", label: "Open with requests" },
  { id: "awaiting_decision", label: "Awaiting decision" },
  { id: "critical_fill", label: "Critical fill" },
];

export function WorkforceFillBoardPanel() {
  const {
    rosterShifts,
    rosterShiftRequests,
    employees,
    clients,
    payPeriodInstances,
    upsertRosterShift,
    approveShiftRequest,
    rejectShiftRequest,
    setShiftCriticalFill,
  } = useData();
  const { session, canWriteWindow } = useAuth();
  const canAssign = canWriteWindow("rostering");
  const actor = session?.displayName || "SuperUser";

  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(new Date().toISOString().slice(0, 10)));
  const [filter, setFilter] = useState<FillBoardFilter>("all");
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyShiftId, setBusyShiftId] = useState<string | null>(null);

  const filteredShifts = useMemo(
    () => filterVacanciesByFillBoardFilter(rosterShifts, rosterShiftRequests, filter),
    [rosterShifts, rosterShiftRequests, filter]
  );

  const vacancies = useMemo(
    () =>
      buildFillBoardVacancies({
        shifts: filteredShifts,
        employees,
        clients,
        weekStart,
        payPeriodInstances,
      }),
    [filteredShifts, employees, clients, weekStart, payPeriodInstances]
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
    const next = normalizeRosterShift({ ...shift, employeeId, openFillStatus: "Filled", updatedBy: actor });
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
          Vacant shifts with employee requests, critical fill flags, and suggested workers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === option.id
                ? "bg-[#d4147a] text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
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
          No vacant shifts match this filter — try another filter or publish RoC lines.
        </p>
      ) : (
        <ul className="space-y-4">
          {vacancies.map(({ shift, shiftHours, candidates }) => {
            const client = clients.find((c) => c.id === shift.clientId);
            const shiftRequests = requestsForShift(rosterShiftRequests, shift.id);
            const pending = shiftRequests.filter((r) => r.status === "requested");
            const criticalOnly = shiftRequests.filter(
              (r) => r.responseType === "available_if_critical" && r.status === "requested"
            );
            return (
              <li
                key={shift.id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${
                  shift.criticalFill ? "border-rose-300" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {shift.criticalFill ? "Critical fill" : "Vacant shift"}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {shift.shiftDate} · {formatShiftTimeRange(shift.startTime, shift.endTime)} ·{" "}
                      {shiftHours.toFixed(1)}h
                    </p>
                    {client ? (
                      <ClientRecordLink
                        id={client.id}
                        searchKey={client.searchKey}
                        name={client.name}
                        className="mt-1 inline-block text-sm text-[#b51266] hover:underline"
                      />
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">
                      {shift.openFillStatus || "Open"} · {pending.length} request(s)
                      {criticalOnly.length ? ` · ${criticalOnly.length} available if critical` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedShiftId((current) => (current === shift.id ? null : shift.id))
                      }
                      className="text-sm text-[#b51266] hover:underline"
                    >
                      {expandedShiftId === shift.id ? "Hide requests" : "Review requests"}
                    </button>
                    <Link href="/rostering" className="text-sm text-[#b51266] hover:underline">
                      Open rostering
                    </Link>
                  </div>
                </div>

                {expandedShiftId === shift.id ? (
                  <ShiftRequestReviewPanel
                    shift={shift}
                    requests={rosterShiftRequests}
                    employees={employees}
                    clients={clients}
                    rosterShifts={rosterShifts}
                    canManage={canAssign}
                    busyRequestId={busyShiftId}
                    onApprove={(requestId) => approveShiftRequest(requestId, actor)}
                    onReject={(requestId, reason) => rejectShiftRequest(requestId, actor, reason)}
                    onToggleCriticalFill={(criticalFill) =>
                      setShiftCriticalFill(shift.id, criticalFill, actor)
                    }
                  />
                ) : null}

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
