"use client";

import { useMemo, useState } from "react";
import {
  countPortalServicesInWeek,
  groupPortalServicesByWeek,
  portalWeekDays,
} from "@/lib/portal/week-calendar";
import type { PortalServiceItem } from "@/lib/portal/types";
import { localDateIso } from "@/lib/booking-cancellation";
import { addDaysIso, formatDayHeading, formatShiftTimeRange, weekStartFromDate } from "@/lib/roster-shift";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayLabel(isoDate: string): string {
  return DAY_LABELS[(new Date(`${isoDate}T12:00:00`).getDay() + 6) % 7];
}

export function PortalServicesWeekCalendar({ services }: { services: PortalServiceItem[] }) {
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(localDateIso()));

  const days = useMemo(() => portalWeekDays(weekStart), [weekStart]);
  const byDay = useMemo(() => groupPortalServicesByWeek(services, weekStart), [services, weekStart]);
  const shiftCount = useMemo(() => countPortalServicesInWeek(services, weekStart), [services, weekStart]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setWeekStart(addDaysIso(weekStart, -7))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Previous week
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(addDaysIso(weekStart, 7))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Next week
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(weekStartFromDate(localDateIso()))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          This week
        </button>
        <p className="ml-auto text-sm text-slate-600">
          Week of {formatDayHeading(weekStart)} – {formatDayHeading(addDaysIso(weekStart, 6))}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Supports this week</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{shiftCount}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[640px]" style={{ gridTemplateColumns: "repeat(7, minmax(5.5rem, 1fr))" }}>
          {days.map((day) => (
            <div key={day} className="border-r border-slate-100 last:border-r-0">
              <div className="border-b border-slate-100 bg-slate-50/80 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                {dayLabel(day)}
                <div className="font-normal text-slate-500">{day.slice(5)}</div>
              </div>
              <div className="min-h-[7rem] space-y-2 p-2">
                {(byDay.get(day) ?? []).length ? (
                  (byDay.get(day) ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[#f9d4e8] bg-[#fdf2f8]/60 p-2 text-xs"
                    >
                      <p className="font-medium text-slate-900">
                        {formatShiftTimeRange(item.startTime, item.endTime)}
                      </p>
                      <p className="mt-1 text-slate-700">{item.shiftType}</p>
                      <p className="mt-0.5 text-slate-600">{item.workerName || "To be confirmed"}</p>
                      <p className="mt-0.5 text-slate-500">{item.locationName}</p>
                    </div>
                  ))
                ) : (
                  <p className="px-1 py-2 text-center text-[11px] text-slate-400">No supports</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
