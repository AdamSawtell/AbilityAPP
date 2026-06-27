"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { ClientActivityRow } from "@/lib/client-line-tables";
import type { EmployeeActivityRow } from "@/lib/employee";
import type { LocationActivityRow } from "@/lib/location";
import {
  addDays,
  formatDayHeading,
  formatFortnightRange,
  formatMonthYear,
  formatWeekRange,
  fortnightDays,
  isoFromDate,
  isSameDay,
  isSameMonth,
  monthGridDays,
  weekDays,
} from "@/lib/personal-calendar";
import {
  recordCalendarEvents,
  recordCalendarEventsByDate,
  recordCalendarKindLabel,
  recordCalendarRangeForView,
  type RecordCalendarEntityKind,
  type RecordCalendarEvent,
  type RecordCalendarViewMode,
} from "@/lib/record-calendar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventStyles(event: RecordCalendarEvent): string {
  if (event.urgency === "overdue") return "bg-red-50 text-red-900 ring-red-200 hover:bg-red-100";
  if (event.urgency === "today" || event.urgency === "soon") {
    if (event.kind === "task") return "bg-violet-50 text-violet-900 ring-violet-300 hover:bg-violet-100";
  }
  switch (event.kind) {
    case "task":
      return "bg-violet-50 text-violet-900 ring-violet-200 hover:bg-violet-100";
    case "shift-actual":
      return "bg-teal-50 text-teal-900 ring-teal-200 hover:bg-teal-100";
    case "shift-template":
      return "bg-indigo-50 text-indigo-900 ring-indigo-200 hover:bg-indigo-100";
    case "activity":
      return "bg-slate-50 text-slate-800 ring-slate-200 hover:bg-slate-100";
    default:
      return "bg-slate-50 text-slate-800 ring-slate-200 hover:bg-slate-100";
  }
}

function CalendarEventChip({ event, compact }: { event: RecordCalendarEvent; compact?: boolean }) {
  const label = recordCalendarKindLabel(event.kind);
  const className = `block truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium ring-1 transition ${eventStyles(event)} ${
    compact ? "leading-tight" : ""
  } ${event.href ? "" : "cursor-default opacity-80"}`;

  const tooltip = `${label}: ${event.title}`;

  if (!event.href) {
    return (
      <div className="group relative" title={tooltip}>
        <span className={className}>{event.title}</span>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link href={event.href} title={tooltip} className={className}>
        {event.title}
      </Link>
      <div className="pointer-events-none invisible absolute left-0 z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <p className="font-semibold text-slate-900">{event.title}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label} · {event.date}
        </p>
        {event.subtitle ? <p className="mt-1 text-slate-600">{event.subtitle}</p> : null}
      </div>
    </div>
  );
}

function DayEventList({ events, emptyLabel }: { events: RecordCalendarEvent[]; emptyLabel?: string }) {
  if (!events.length) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyLabel ?? "Nothing scheduled"}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((event) => (
        <li key={event.id}>
          {event.href ? (
            <Link href={event.href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${eventStyles(event)}`}
              >
                {recordCalendarKindLabel(event.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{event.title}</p>
                {event.subtitle ? <p className="text-sm text-slate-500">{event.subtitle}</p> : null}
              </div>
            </Link>
          ) : (
            <div className="flex items-start gap-3 px-4 py-3 opacity-80">
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${eventStyles(event)}`}
              >
                {recordCalendarKindLabel(event.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{event.title}</p>
                {event.subtitle ? <p className="text-sm text-slate-500">{event.subtitle}</p> : null}
                <p className="mt-1 text-xs text-slate-400">No access to open this record</p>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RecordCalendarPanel({
  entityKind,
  entityId,
  activities,
  description,
}: {
  entityKind: RecordCalendarEntityKind;
  entityId: string;
  activities: ClientActivityRow[] | EmployeeActivityRow[] | LocationActivityRow[];
  description: string;
}) {
  const { tasks, rosterShifts, rosterOfCares } = useData();
  const { session } = useAuth();
  const windowKeys = session?.windowKeys ?? [];

  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<RecordCalendarViewMode>("fortnight");
  const [showRocTemplates, setShowRocTemplates] = useState(false);
  const [anchor, setAnchor] = useState(() => new Date());

  const { rangeStart, rangeEnd } = useMemo(
    () => recordCalendarRangeForView(view, anchor),
    [view, anchor]
  );

  const events = useMemo(
    () =>
      recordCalendarEvents({
        entityKind,
        entityId,
        rangeStart,
        rangeEnd,
        windowKeys,
        tasks,
        rosterShifts,
        rosterOfCares,
        activities,
        includeRocTemplates: showRocTemplates,
      }),
    [
      entityKind,
      entityId,
      rangeStart,
      rangeEnd,
      windowKeys,
      tasks,
      rosterShifts,
      rosterOfCares,
      activities,
      showRocTemplates,
    ]
  );

  const byDate = useMemo(() => recordCalendarEventsByDate(events), [events]);

  const heading =
    view === "fortnight"
      ? formatFortnightRange(anchor)
      : view === "month"
        ? formatMonthYear(anchor)
        : view === "week"
          ? formatWeekRange(anchor)
          : formatDayHeading(anchor);

  function goToday() {
    setAnchor(new Date());
  }

  function goPrev() {
    setAnchor((current) => {
      if (view === "fortnight") return addDays(current, -14);
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() - 1, 1, 12);
      if (view === "week") return addDays(current, -7);
      return addDays(current, -1);
    });
  }

  function goNext() {
    setAnchor((current) => {
      if (view === "fortnight") return addDays(current, 14);
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() + 1, 1, 12);
      if (view === "week") return addDays(current, 7);
      return addDays(current, 1);
    });
  }

  const monthDays = view === "month" ? monthGridDays(anchor) : [];
  const week = view === "week" ? weekDays(anchor) : [];
  const fortnight = view === "fortnight" ? fortnightDays(anchor) : [];
  const dayIso = isoFromDate(anchor);
  const dayEvents = byDate.get(dayIso) ?? [];

  const visibleKinds = showRocTemplates
    ? (["task", "shift-actual", "shift-template", "activity"] as const)
    : (["task", "shift-actual", "activity"] as const);

  const kindCounts = useMemo(() => {
    const counts = { task: 0, "shift-actual": 0, "shift-template": 0, activity: 0 };
    for (const event of events) counts[event.kind] += 1;
    return counts;
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Calendar</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showRocTemplates}
              onChange={(e) => setShowRocTemplates(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show RoC templates (master roster)
          </label>
        </div>
        <dl className="mt-3 flex flex-wrap gap-3 text-xs">
          {visibleKinds.map((kind) => (
            <div key={kind} className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 font-medium ring-1 ${eventStyles({ kind, id: "", date: "", title: "", href: null })}`}
              >
                {recordCalendarKindLabel(kind)}
              </span>
              <span className="text-slate-500">{kindCounts[kind]}</span>
            </div>
          ))}
        </dl>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">{heading}</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(["fortnight", "week", "month", "day"] as const).map((mode) => (
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
            <button
              type="button"
              onClick={goPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>

        {view === "fortnight" ? (
          <div className="overflow-x-auto p-4">
            <div className="min-w-[56rem]">
              <div
                className="grid gap-px rounded-lg border border-slate-200 bg-slate-200 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
              >
                {fortnight.map((day, index) => (
                  <div
                    key={isoFromDate(day)}
                    className={`bg-slate-50 py-2 ${index === 7 ? "border-l-2 border-slate-300" : ""}`}
                  >
                    {WEEKDAY_LABELS[index % 7]}
                  </div>
                ))}
              </div>
              <div
                className="grid gap-px border border-t-0 border-slate-200 bg-slate-200"
                style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
              >
                {fortnight.map((day, index) => {
                  const iso = isoFromDate(day);
                  const dayItems = byDate.get(iso) ?? [];
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={iso}
                      className={`min-h-[120px] bg-white p-1.5 ${index === 7 ? "border-l-2 border-slate-300" : ""}`}
                    >
                      <p
                        className={`mb-1 text-right text-xs font-medium ${isToday ? "text-[#b51266]" : "text-slate-700"}`}
                      >
                        {day.getDate()}
                      </p>
                      <div className="space-y-0.5">
                        {dayItems.map((event) => (
                          <CalendarEventChip key={event.id} event={event} compact />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {view === "month" ? (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px rounded-lg border border-slate-200 bg-slate-200 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="bg-slate-50 py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px border border-t-0 border-slate-200 bg-slate-200">
              {monthDays.map((day) => {
                const iso = isoFromDate(day);
                const dayItems = byDate.get(iso) ?? [];
                const inMonth = isSameMonth(day, anchor);
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={iso}
                    className={`min-h-[88px] bg-white p-1.5 ${inMonth ? "" : "bg-slate-50/80 text-slate-400"}`}
                  >
                    <p
                      className={`mb-1 text-right text-xs font-medium ${isToday ? "text-[#b51266]" : inMonth ? "text-slate-700" : "text-slate-400"}`}
                    >
                      {day.getDate()}
                    </p>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map((event) => (
                        <CalendarEventChip key={event.id} event={event} compact />
                      ))}
                      {dayItems.length > 3 ? (
                        <p className="px-1 text-[10px] text-slate-500">+{dayItems.length - 3} more</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {view === "week" ? (
          <div className="grid gap-px border-t border-slate-100 sm:grid-cols-7">
            {week.map((day) => {
              const iso = isoFromDate(day);
              const dayItems = byDate.get(iso) ?? [];
              return (
                <div key={iso} className="min-h-[120px] border-r border-slate-100 p-2 last:border-r-0">
                  <p
                    className={`mb-2 text-xs font-semibold ${isSameDay(day, today) ? "text-[#b51266]" : "text-slate-700"}`}
                  >
                    {day.toLocaleDateString("en-AU", { weekday: "short", day: "numeric" })}
                  </p>
                  <div className="space-y-1">
                    {dayItems.map((event) => (
                      <CalendarEventChip key={event.id} event={event} compact />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {view === "day" ? <DayEventList events={dayEvents} /> : null}
      </section>
    </div>
  );
}
