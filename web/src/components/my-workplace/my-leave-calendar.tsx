"use client";

import { useMemo, useState } from "react";
import type { EmployeeLeaveRequestRow } from "@/lib/employee";
import { addDays, formatMonthYear, isoFromDate, isSameDay, monthGridDays } from "@/lib/personal-calendar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISIBLE_STATUSES = new Set(["Requested", "Approved", "Taken"]);

function statusClass(status: string): string {
  if (status === "Approved" || status === "Taken") return "bg-emerald-100 text-emerald-900";
  if (status === "Requested") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

export function MyLeaveCalendar({ leaveRequests }: { leaveRequests: EmployeeLeaveRequestRow[] }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const today = useMemo(() => new Date(), []);

  const events = useMemo(() => {
    const rows: { id: string; date: string; label: string; status: string }[] = [];
    for (const leave of leaveRequests) {
      if (!leave.startDate || !leave.endDate || !VISIBLE_STATUSES.has(leave.status)) continue;
      let cursor = new Date(`${leave.startDate}T12:00:00`);
      const end = new Date(`${leave.endDate}T12:00:00`);
      while (cursor <= end) {
        const iso = isoFromDate(cursor);
        rows.push({
          id: `${leave.id}-${iso}`,
          date: iso,
          label: leave.leaveType || "Leave",
          status: leave.status,
        });
        cursor = addDays(cursor, 1);
      }
    }
    return rows;
  }, [leaveRequests]);

  const byDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const gridDays = monthGridDays(anchor);

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Leave calendar</h2>
          <p className="text-sm text-slate-600">Your requested and approved leave at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor((current) => addDays(current, -30))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-slate-900">{formatMonthYear(anchor)}</span>
          <button
            type="button"
            onClick={() => setAnchor((current) => addDays(current, 30))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 p-px">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-slate-50 px-2 py-2 text-center text-xs font-medium text-slate-500">
            {label}
          </div>
        ))}
        {gridDays.map((day) => {
          const iso = isoFromDate(day);
          const dayEvents = byDate.get(iso) ?? [];
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = isSameDay(day, today);
          return (
            <div
              key={iso}
              className={`min-h-[5.5rem] bg-white p-2 ${inMonth ? "" : "opacity-40"} ${isToday ? "ring-2 ring-inset ring-[#d4147a]/30" : ""}`}
            >
              <p className={`text-xs font-medium ${isToday ? "text-[#b51266]" : "text-slate-700"}`}>{day.getDate()}</p>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <p key={event.id} className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${statusClass(event.status)}`}>
                    {event.label}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
