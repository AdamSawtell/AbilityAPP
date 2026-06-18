"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useReferenceData } from "@/lib/config-store";
import type { EmployeeRecord } from "@/lib/employee";
import { addDays, formatMonthYear, isoFromDate, isSameDay, monthGridDays } from "@/lib/personal-calendar";
import { WorkforcePlanningSubnav } from "@/components/workforce/workforce-planning-subnav";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type LeaveCalendarEvent = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  status: string;
  date: string;
  notes: string;
  startDate: string;
  endDate: string;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISIBLE_STATUSES = new Set(["Requested", "Approved", "Taken"]);

function statusPill(status: string) {
  if (status === "Approved" || status === "Taken") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (status === "Requested") {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function WorkforcePlanningPage() {
  const { employees, upsertEmployee } = useData();
  const { canProcess } = useAuth();
  const { getOptions } = useReferenceData();
  const leaveTypes = getOptions("leaveType");
  const canSubmitOnBehalf = canProcess("submit-leave-on-behalf");
  const [anchor, setAnchor] = useState(() => new Date());
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const today = useMemo(() => new Date(), []);

  const activeEmployees = useMemo(
    () => [...employees].filter((e) => e.employmentStatus !== "Terminated").sort((a, b) => a.name.localeCompare(b.name)),
    [employees]
  );

  async function submitLeaveOnBehalf(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");
    try {
      const res = await fetch("/api/workforce/leave", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, leaveType, startDate, endDate, notes }),
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Submit failed");
      if (body.employee) upsertEmployee(body.employee);
      setSubmitMessage("Leave request submitted for the selected employee.");
      setEmployeeId("");
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setNotes("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const leaveEvents = useMemo<LeaveCalendarEvent[]>(() => {
    const events: LeaveCalendarEvent[] = [];
    for (const employee of employees) {
      for (const leave of employee.leaveRequests) {
        if (!leave.startDate || !leave.endDate) continue;
        if (!VISIBLE_STATUSES.has(leave.status)) continue;
        let cursor = new Date(`${leave.startDate}T12:00:00`);
        const end = new Date(`${leave.endDate}T12:00:00`);
        while (cursor <= end) {
          const iso = isoFromDate(cursor);
          events.push({
            id: `${leave.id}-${iso}`,
            employeeId: employee.id,
            employeeName: employee.name,
            leaveType: leave.leaveType || "Leave",
            status: leave.status,
            date: iso,
            notes: leave.notes,
            startDate: leave.startDate,
            endDate: leave.endDate,
          });
          cursor = addDays(cursor, 1);
        }
      }
    }
    return events;
  }, [employees]);

  const byDate = useMemo(() => {
    const map = new Map<string, LeaveCalendarEvent[]>();
    for (const event of leaveEvents) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [leaveEvents]);

  const upcoming = useMemo(() => {
    const todayIso = isoFromDate(today);
    const seen = new Set<string>();
    const rows: LeaveCalendarEvent[] = [];
    for (const event of leaveEvents) {
      if (event.endDate < todayIso) continue;
      const key = `${event.employeeId}:${event.startDate}:${event.endDate}:${event.leaveType}:${event.status}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(event);
    }
    return rows
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.employeeName.localeCompare(b.employeeName))
      .slice(0, 50);
  }, [leaveEvents, today]);

  const monthDays = monthGridDays(anchor);

  return (
    <AppShell
      title="Workforce planning"
      subtitle="Organisation leave calendar, upcoming leave, and pending requests."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Workforce planning" }]}
      audit={{ moduleLabel: "Workforce planning" }}
    >
      <WorkforcePlanningSubnav />
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Organisation leave calendar</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnchor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Prev
            </button>
            <p className="w-40 text-center text-sm font-semibold text-slate-900">{formatMonthYear(anchor)}</p>
            <button
              type="button"
              onClick={() => setAnchor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
        <div className="p-4">
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
              const dayEvents = byDate.get(iso) ?? [];
              const isTodayCell = isSameDay(day, today);
              return (
                <div key={iso} className="min-h-[108px] bg-white p-2">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isTodayCell ? "bg-[#d4147a] text-white" : "text-slate-700"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        href={`/employees/${event.employeeId}?tab=Leave`}
                        title={`${event.employeeName} · ${event.leaveType} · ${event.startDate} to ${event.endDate}${event.notes ? ` · ${event.notes}` : ""}`}
                        className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${statusPill(
                          event.status
                        )}`}
                      >
                        {event.employeeName}
                      </Link>
                    ))}
                    {dayEvents.length > 3 ? (
                      <p className="px-1 text-[10px] text-slate-500">+{dayEvents.length - 3} more</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming leave and requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Leave type</th>
                <th className="px-4 py-2.5">Dates</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcoming.length ? (
                upcoming.map((row) => (
                  <tr key={`${row.id}-row`} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/employees/${row.employeeId}?tab=Leave`} className="font-medium text-[#b51266] hover:underline">
                        {row.employeeName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{row.leaveType}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {row.startDate} to {row.endDate}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusPill(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No upcoming leave. Add leave requests from employee records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canSubmitOnBehalf ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Submit leave on behalf</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter leave for an employee who cannot use My workplace themselves. The request appears on their employee record for approval.
          </p>
          <form onSubmit={submitLeaveOnBehalf} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Employee</span>
              <select className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                <option value="">Select employee…</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Leave type</span>
              <select className={inputClass} value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required>
                <option value="">Select type…</option>
                {leaveTypes.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Start date</span>
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">End date</span>
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes (optional)</span>
              <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit leave request"}
              </button>
              {submitMessage ? <p className="mt-3 text-sm text-emerald-700">{submitMessage}</p> : null}
              {submitError ? <p className="mt-3 text-sm text-red-600">{submitError}</p> : null}
            </div>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}
