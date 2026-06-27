"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AuthSession } from "@/lib/access/types";
import type { AppUserRecord } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import {
  addDays,
  employeeForUser,
  eventKindLabel,
  eventsByDate,
  formatDayHeading,
  formatMonthYear,
  formatWeekRange,
  isoFromDate,
  isSameDay,
  isSameMonth,
  monthGridDays,
  personalCalendarEvents,
  type CalendarViewMode,
  type PersonalCalendarEvent,
  weekDays,
} from "@/lib/personal-calendar";
import type { TaskRecord } from "@/lib/task";
import type { IncidentRecord } from "@/lib/incident";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { RosterShiftRequestRecord } from "@/lib/roster-shift-request";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventStyles(event: PersonalCalendarEvent): string {
  if (event.urgency === "overdue") {
    return "bg-red-50 text-red-900 ring-red-200 hover:bg-red-100";
  }
  switch (event.kind) {
    case "task-user":
      return "bg-[#fdf2f8] text-[#9d174d] ring-[#f9a8d4]/60 hover:bg-[#fce7f3]";
    case "task-role":
      return "bg-violet-50 text-violet-900 ring-violet-200 hover:bg-violet-100";
    case "roster-shift":
      return "bg-teal-50 text-teal-900 ring-teal-200 hover:bg-teal-100";
    case "shift-request":
      return "bg-cyan-50 text-cyan-900 ring-cyan-200 hover:bg-cyan-100";
    case "leave-request":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200 hover:bg-emerald-100";
    case "credential-expiry":
      return "bg-indigo-50 text-indigo-900 ring-indigo-200 hover:bg-indigo-100";
    case "document-expiry":
      return "bg-sky-50 text-sky-900 ring-sky-200 hover:bg-sky-100";
    case "visa-expiry":
    case "licence-expiry":
      return "bg-amber-50 text-amber-900 ring-amber-200 hover:bg-amber-100";
    case "incident-deadline":
      return "bg-rose-50 text-rose-900 ring-rose-200 hover:bg-rose-100";
    default:
      return "bg-slate-50 text-slate-800 ring-slate-200 hover:bg-slate-100";
  }
}

function CalendarEventChip({ event, compact }: { event: PersonalCalendarEvent; compact?: boolean }) {
  const summary = event.subtitle?.trim() || "Open record";
  return (
    <div className="group relative">
      <Link
        href={event.href}
        title={`${eventKindLabel(event.kind)}: ${event.title}`}
        className={`block truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium ring-1 transition ${eventStyles(event)} ${
          compact ? "leading-tight" : ""
        }`}
      >
        {event.title}
      </Link>
      <div className="pointer-events-none invisible absolute left-0 z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <p className="font-semibold text-slate-900">{event.title}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {eventKindLabel(event.kind)} · {event.date}
        </p>
        <p className="mt-1 text-slate-600">{summary}</p>
      </div>
    </div>
  );
}

function DayEventList({ events, emptyLabel }: { events: PersonalCalendarEvent[]; emptyLabel?: string }) {
  if (!events.length) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyLabel ?? "Nothing scheduled"}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((event) => (
        <li key={event.id}>
          <Link href={event.href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
            <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${eventStyles(event)}`}>
              {eventKindLabel(event.kind)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{event.title}</p>
              {event.subtitle ? <p className="text-sm text-slate-500">{event.subtitle}</p> : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HomeCalendar({
  tasks,
  incidents,
  session,
  users,
  employees,
  rosterShifts = [],
  shiftRequests = [],
}: {
  tasks: TaskRecord[];
  incidents: IncidentRecord[];
  session: AuthSession;
  users: AppUserRecord[];
  employees: EmployeeRecord[];
  rosterShifts?: RosterShiftRecord[];
  shiftRequests?: RosterShiftRequestRecord[];
}) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());

  const employee = useMemo(() => employeeForUser(users, employees, session.userId), [users, employees, session.userId]);

  const events = useMemo(
    () => personalCalendarEvents(tasks, session, employee, incidents, rosterShifts, shiftRequests),
    [tasks, session, employee, incidents, rosterShifts, shiftRequests]
  );

  const byDate = useMemo(() => eventsByDate(events), [events]);

  const heading =
    view === "month"
      ? formatMonthYear(anchor)
      : view === "week"
        ? formatWeekRange(anchor)
        : formatDayHeading(anchor);

  function goToday() {
    setAnchor(new Date());
  }

  function goPrev() {
    setAnchor((current) => {
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() - 1, 1, 12);
      if (view === "week") return addDays(current, -7);
      return addDays(current, -1);
    });
  }

  function goNext() {
    setAnchor((current) => {
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() + 1, 1, 12);
      if (view === "week") return addDays(current, 7);
      return addDays(current, 1);
    });
  }

  const monthDays = view === "month" ? monthGridDays(anchor) : [];
  const week = view === "week" ? weekDays(anchor) : [];
  const dayIso = isoFromDate(anchor);
  const dayEvents = byDate.get(dayIso) ?? [];

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My calendar</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Tasks for you and {session.activeRoleName}
            {employee ? " · your shifts, requests, leave, credentials" : ""}
            {incidents.length ? " · NDIS incident deadlines" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                  view === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Previous"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <p className="text-center text-sm font-semibold text-slate-900 sm:text-base">{heading}</p>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Next"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {view === "month" ? (
        <div className="p-3 sm:p-4">
          <div className="mb-1 grid grid-cols-7 gap-px">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
            {monthDays.map((day) => {
              const iso = isoFromDate(day);
              const dayItems = byDate.get(iso) ?? [];
              const inMonth = isSameMonth(day, anchor);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setAnchor(day);
                    setView("day");
                  }}
                  className={`min-h-[88px] bg-white p-1.5 text-left transition hover:bg-slate-50 sm:min-h-[104px] sm:p-2 ${
                    inMonth ? "" : "bg-slate-50/80"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday ? "bg-[#d4147a] text-white" : inMonth ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayItems.slice(0, 3).map((event) => (
                      <CalendarEventChip key={event.id} event={event} compact />
                    ))}
                    {dayItems.length > 3 ? (
                      <p className="px-1 text-[10px] font-medium text-slate-500">+{dayItems.length - 3} more</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-7 sm:divide-x sm:divide-y-0">
          {week.map((day) => {
            const iso = isoFromDate(day);
            const dayItems = byDate.get(iso) ?? [];
            const isToday = isSameDay(day, today);
            return (
              <div key={iso} className="min-h-[200px] bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setAnchor(day);
                    setView("day");
                  }}
                  className="w-full border-b border-slate-100 px-2 py-2 text-center hover:bg-slate-50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {day.toLocaleDateString("en-AU", { weekday: "short" })}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-semibold ${
                      isToday ? "text-[#b51266]" : "text-slate-900"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </button>
                <div className="space-y-1 p-2">
                  {dayItems.length ? (
                    dayItems.map((event) => <CalendarEventChip key={event.id} event={event} />)
                  ) : (
                    <p className="px-1 py-4 text-center text-[10px] text-slate-400">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "day" ? <DayEventList events={dayEvents} emptyLabel="Nothing on this day for your account" /> : null}

      <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f9a8d4]" /> Assigned to you
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-300" /> Role tasks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-300" /> Allocated shifts
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" /> Shift requests
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" /> Credential / document expiry
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> Leave
        </span>
      </div>
    </section>
  );
}
