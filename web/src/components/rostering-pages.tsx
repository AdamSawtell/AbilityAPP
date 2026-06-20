"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RosterForwardPanel } from "@/components/roster-forward-panel";
import { RosterGapsPanel } from "@/components/roster-gaps-panel";
import { RosterShiftEditor } from "@/components/roster-shift-editor";
import { ClientRecordLink, EmployeeRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  addDaysIso,
  formatDayHeading,
  formatShiftTimeRange,
  normalizeRosterShift,
  shiftsForWeek,
  weekStartFromDate,
} from "@/lib/roster-shift";
import { detectRosterShiftConflicts } from "@/lib/roster-shift-conflicts";
import { gapsForWeek, isVacantShift, type RosterGap } from "@/lib/roster-gap-analysis";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RosteringWeekView() {
  const { clients, employees, locations, serviceBookings, rosterShifts } = useData();
  const { canWriteWindow } = useAuth();
  const canEditRoster = canWriteWindow("rostering");
  const [view, setView] = useState<"week" | "forward" | "gaps">("week");
  const [forwardWeeks, setForwardWeeks] = useState(8);
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate("2025-10-06"));
  const [editorShift, setEditorShift] = useState<ReturnType<typeof normalizeRosterShift> | null | "new">(null);
  const [newShiftDate, setNewShiftDate] = useState("");
  const [editorPrefill, setEditorPrefill] = useState<{ clientId?: string; serviceBookingId?: string } | null>(null);

  const shifts = useMemo(
    () => shiftsForWeek(rosterShifts.map(normalizeRosterShift), weekStart),
    [rosterShifts, weekStart]
  );

  const days = useMemo(() => DAY_LABELS.map((_, index) => addDaysIso(weekStart, index)), [weekStart]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, typeof shifts>();
    for (const day of days) map.set(day, []);
    for (const shift of shifts) {
      map.get(shift.shiftDate)?.push(shift);
    }
    return map;
  }, [days, shifts]);

  const conflictByShiftId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof detectRosterShiftConflicts>>();
    for (const shift of rosterShifts.map(normalizeRosterShift)) {
      const issues = detectRosterShiftConflicts(shift, { existing: rosterShifts.map(normalizeRosterShift) });
      if (issues.length) map.set(shift.id, issues);
    }
    return map;
  }, [rosterShifts]);

  const weekGaps = useMemo(
    () => gapsForWeek(weekStart, rosterShifts.map(normalizeRosterShift), serviceBookings),
    [weekStart, rosterShifts, serviceBookings]
  );

  function handleFillGap(gap: RosterGap) {
    if (gap.code === "VACANT_SHIFT" && gap.shiftId) {
      const shift = rosterShifts.find((s) => s.id === gap.shiftId);
      if (shift) {
        setEditorPrefill(null);
        setEditorShift(normalizeRosterShift(shift));
      }
      return;
    }
    if (gap.code === "COVERAGE_GAP") {
      setNewShiftDate(gap.weekStart ?? weekStart);
      setEditorPrefill({
        clientId: gap.clientId,
        serviceBookingId: gap.serviceBookingId,
      });
      setEditorShift("new");
      setView("week");
    }
  }

  function openNewShift(date?: string) {
    setEditorPrefill(null);
    setNewShiftDate(date ?? weekStart);
    setEditorShift("new");
  }

  return (
    <>
      <AppShell
        title="Rostering"
        subtitle={
          view === "week"
            ? "Week calendar — create and edit shifts linked to client, worker, location, and service booking."
            : view === "forward"
              ? "Forward plan — roster hours and conflicts across the next 4–12 weeks."
              : "Gap analysis — vacant shifts and weeks missing staffed coverage for active bookings."
        }
        audit={{ moduleLabel: "Rostering" }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setView("week")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "week" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setView("forward")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "forward" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Forward plan
              </button>
              <button
                type="button"
                onClick={() => setView("gaps")}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  view === "gaps" ? "bg-[#d4147a] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Gaps
                {weekGaps.length ? (
                  <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                    {weekGaps.length}
                  </span>
                ) : null}
              </button>
            </div>
            {canEditRoster && view === "week" ? (
              <button
                type="button"
                onClick={() => openNewShift()}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
              >
                New shift
              </button>
            ) : null}
          </div>
        }
      >
        {view === "forward" ? (
          <RosterForwardPanel
            rosterShifts={rosterShifts}
            serviceBookings={serviceBookings}
            clients={clients}
            anchorWeekStart={weekStart}
            weekCount={forwardWeeks}
            onAnchorChange={setWeekStart}
            onWeekCountChange={setForwardWeeks}
          />
        ) : view === "gaps" ? (
          <RosterGapsPanel
            rosterShifts={rosterShifts}
            serviceBookings={serviceBookings}
            clients={clients}
            anchorWeekStart={weekStart}
            weekCount={forwardWeeks}
            onFillGap={canEditRoster ? handleFillGap : undefined}
          />
        ) : (
          <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setWeekStart(addDaysIso(weekStart, -7))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Previous week
          </button>
          <p className="text-sm font-medium text-slate-800">
            Week of {formatDayHeading(weekStart)} – {formatDayHeading(addDaysIso(weekStart, 6))}
          </p>
          <button
            type="button"
            onClick={() => setWeekStart(addDaysIso(weekStart, 7))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Next week
          </button>
          <Link href="/service-bookings" className="ml-auto text-sm font-medium text-[#b51266] hover:underline">
            Service bookings
          </Link>
        </div>

        {weekGaps.length ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">
              {weekGaps.length} gap{weekGaps.length === 1 ? "" : "s"} this week
            </p>
            <p className="mt-1 text-amber-900/90">
              Open the <button type="button" onClick={() => setView("gaps")} className="font-medium underline">Gaps</button> tab to
              assign workers or add coverage for active bookings.
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-7">
          {days.map((day) => {
            const dayShifts = shiftsByDay.get(day) ?? [];
            return (
              <div key={day} className="min-h-48 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDayHeading(day)}</p>
                  {canEditRoster ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNewShiftDate(day);
                        openNewShift(day);
                      }}
                      className="text-[10px] font-medium text-[#b51266] hover:underline"
                    >
                      Add
                    </button>
                  ) : null}
                </div>
                {dayShifts.length ? (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => {
                      const client = clients.find((c) => c.id === shift.clientId);
                      const employee = employees.find((e) => e.id === shift.employeeId);
                      const location = locations.find((l) => l.id === shift.locationId);
                      const booking = serviceBookings.find((b) => b.id === shift.serviceBookingId);
                      const conflicts = conflictByShiftId.get(shift.id) ?? [];
                      const hasError = conflicts.some((c) => c.severity === "error");
                      const vacant = isVacantShift(shift);
                      return (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => canEditRoster && setEditorShift(shift)}
                          className={`w-full rounded-lg border p-2 text-left text-xs ${
                            hasError
                              ? "border-rose-300 bg-rose-50/80"
                              : vacant
                                ? "border-amber-300 bg-amber-50/80"
                                : "border-[#f9a8d4]/40 bg-[#fdf2f8]/60"
                          } ${canEditRoster ? "cursor-pointer hover:border-[#d4147a]/50 hover:shadow-sm" : "cursor-default"}`}
                        >
                          <p className="font-semibold text-slate-900">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
                          {client ? (
                            <ClientRecordLink
                              id={client.id}
                              searchKey={client.searchKey}
                              name={client.name}
                              className="mt-1 block text-slate-700 hover:underline"
                            />
                          ) : (
                            <p className="mt-1 text-slate-600">No client</p>
                          )}
                          {employee ? (
                            <EmployeeRecordLink
                              id={employee.id}
                              searchKey={employee.searchKey}
                              name={employee.name}
                              className="mt-0.5 block text-slate-600 hover:underline"
                            />
                          ) : (
                            <p className="mt-0.5 text-amber-800">Vacant — no worker</p>
                          )}
                          {location ? <p className="mt-0.5 text-slate-500">{location.name}</p> : null}
                          {booking ? (
                            <Link
                              href={`/service-bookings/${booking.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 inline-block text-[#b51266] hover:underline"
                            >
                              Booking {booking.documentNo}
                            </Link>
                          ) : null}
                          {vacant ? (
                            <span className="mt-1 inline-flex rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-950">
                              Vacant
                            </span>
                          ) : null}
                          {shift.recurrenceGroupId ? (
                            <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900">
                              Recurring
                            </span>
                          ) : null}
                          {conflicts.length ? (
                            <span
                              className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                hasError ? "bg-rose-200 text-rose-950" : "bg-amber-100 text-amber-950"
                              }`}
                            >
                              {hasError ? "Conflict" : "Overlap warning"}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No shifts</p>
                )}
              </div>
            );
          })}
        </div>
          </>
        )}
      </AppShell>

      {editorShift ? (
        <RosterShiftEditor
          initial={editorShift === "new" ? null : editorShift}
          defaultDate={newShiftDate}
          prefill={editorPrefill ?? undefined}
          onClose={() => {
            setEditorShift(null);
            setEditorPrefill(null);
          }}
        />
      ) : null}
    </>
  );
}
