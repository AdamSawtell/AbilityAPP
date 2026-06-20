"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientRecordLink, EmployeeRecordLink } from "@/components/record-link";
import { useData } from "@/lib/data-store";
import {
  addDaysIso,
  formatShiftTimeRange,
  initialRosterShifts,
  normalizeRosterShift,
  shiftsForWeek,
  weekStartFromDate,
} from "@/lib/roster-shift";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDayHeading(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function RosteringWeekView() {
  const { clients, employees, locations, serviceBookings } = useData();
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate("2025-10-06"));

  const shifts = useMemo(
    () => shiftsForWeek(initialRosterShifts.map(normalizeRosterShift), weekStart),
    [weekStart]
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

  return (
    <AppShell
      title="Rostering"
      subtitle="Read-only week view — shifts linked to client, worker, location, and service booking."
      audit={{ moduleLabel: "Rostering" }}
    >
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

      <div className="grid gap-3 lg:grid-cols-7">
        {days.map((day) => {
          const dayShifts = shiftsByDay.get(day) ?? [];
          return (
            <div key={day} className="min-h-48 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{formatDayHeading(day)}</p>
              {dayShifts.length ? (
                <div className="space-y-2">
                  {dayShifts.map((shift) => {
                    const client = clients.find((c) => c.id === shift.clientId);
                    const employee = employees.find((e) => e.id === shift.employeeId);
                    const location = locations.find((l) => l.id === shift.locationId);
                    const booking = serviceBookings.find((b) => b.id === shift.serviceBookingId);
                    return (
                      <div key={shift.id} className="rounded-lg border border-[#f9a8d4]/40 bg-[#fdf2f8]/60 p-2 text-xs">
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
                        ) : null}
                        {location ? <p className="mt-0.5 text-slate-500">{location.name}</p> : null}
                        {booking ? (
                          <Link href={`/service-bookings/${booking.id}`} className="mt-1 inline-block text-[#b51266] hover:underline">
                            Booking {booking.documentNo}
                          </Link>
                        ) : null}
                      </div>
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

      <p className="mt-4 text-sm text-slate-500">
        WP-D.1 read-only calendar. Create/edit shifts and conflict checks arrive in WP-D.2 and WP-D.3.
      </p>
    </AppShell>
  );
}
