"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmployeeRecordLink } from "@/components/record-link";
import { WorkforcePlanningSubnav } from "@/components/workforce/workforce-planning-subnav";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  createRosterShift,
  formatShiftTimeRange,
  normalizeRosterShift,
  rosterShiftDropdowns,
  shiftDurationHours,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function sessionMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function costLabel(value: string): string {
  if (value === "billable") return "Billable";
  if (value === "admin_costed") return "Admin-costed";
  return "Non-billable";
}

function purposeLabel(value: string | undefined): string {
  return value === "staff_meeting" ? "Meeting" : "Training";
}

function groupKey(shift: RosterShiftRecord): string {
  return shift.trainingSessionGroupId?.trim() || shift.id;
}

export function TrainingMeetingsPage() {
  const { employees, locations, rosterShifts, timesheets, addRecurringRosterShifts, upsertRosterShift } = useData();
  const { canWriteWindow, session } = useAuth();
  const canEdit = canWriteWindow("training-meetings");
  const actor = session?.displayName || "SuperUser";
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.employmentStatus !== "Terminated").sort((a, b) => a.name.localeCompare(b.name)),
    [employees]
  );

  const [title, setTitle] = useState("Manual handling refresher");
  const [sessionType, setSessionType] = useState<"training_session" | "staff_meeting">("training_session");
  const [sessionCategory, setSessionCategory] = useState("Mandatory compliance");
  const [sessionDate, setSessionDate] = useState("2025-10-09");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [costAllocation, setCostAllocation] = useState<"billable" | "non_billable" | "admin_costed">("admin_costed");
  const [costCentre, setCostCentre] = useState("Training");
  const [estimatedHourlyCost, setEstimatedHourlyCost] = useState(48);
  const [notes, setNotes] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sessionShifts = useMemo(
    () =>
      rosterShifts
        .map(normalizeRosterShift)
        .filter((shift) => shift.shiftPurpose === "training_session" || shift.shiftPurpose === "staff_meeting")
        .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`)),
    [rosterShifts]
  );

  const sessions = useMemo(() => {
    const byGroup = new Map<string, RosterShiftRecord[]>();
    for (const shift of sessionShifts) {
      const key = groupKey(shift);
      byGroup.set(key, [...(byGroup.get(key) ?? []), shift]);
    }
    return [...byGroup.entries()]
      .map(([key, rows]) => ({ key, rows, lead: rows[0] }))
      .sort((a, b) => `${a.lead.shiftDate}${a.lead.startTime}`.localeCompare(`${b.lead.shiftDate}${b.lead.startTime}`));
  }, [sessionShifts]);

  const costSummary = useMemo(() => {
    const map = new Map<string, { costCentre: string; hours: number; cost: number; attendees: number }>();
    for (const shift of sessionShifts) {
      if (shift.attendanceStatus !== "Attended") continue;
      const centre = shift.costCentre?.trim() || "Unallocated";
      const hours = shiftDurationHours(shift);
      const row = map.get(centre) ?? { costCentre: centre, hours: 0, cost: 0, attendees: 0 };
      row.hours += hours;
      row.cost += hours * Number(shift.estimatedHourlyCost ?? 0);
      row.attendees += 1;
      map.set(centre, row);
    }
    return [...map.values()].sort((a, b) => b.cost - a.cost);
  }, [sessionShifts]);

  function toggleAttendee(employeeId: string) {
    setAttendeeIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    );
  }

  function billingClassificationForCost() {
    return costAllocation === "billable" ? "billable" : costAllocation === "admin_costed" ? "admin_costed" : "non_billable_internal_cost";
  }

  function scheduleSession() {
    setMessage("");
    setError("");
    if (!canEdit) return;
    if (!title.trim()) {
      setError("Enter a session title.");
      return;
    }
    if (!attendeeIds.length) {
      setError("Select at least one attendee.");
      return;
    }
    if (sessionMinutes(endTime) <= sessionMinutes(startTime)) {
      setError("Set an end time after the start time.");
      return;
    }
    const groupId = `tsg-${Date.now()}`;
    const prefix = sessionType === "staff_meeting" ? "MTG" : "TRN";
    const rows = attendeeIds.map((employeeId, index) => {
      const employee = employees.find((e) => e.id === employeeId);
      const refSuffix = (employee?.searchKey || employee?.name || employeeId).replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
      return createRosterShift(
        {
          id: `${groupId}-${employeeId}`,
          shiftRef: `${prefix}-${String(sessions.length + 1).padStart(3, "0")}-${refSuffix}-${index + 1}`,
          clientId: "",
          employeeId,
          locationId,
          serviceBookingId: "",
          shiftDate: sessionDate,
          startTime,
          endTime,
          shiftType: sessionType === "staff_meeting" ? "Meeting" : "Training",
          status: "Published",
          notes,
          trainingSessionGroupId: groupId,
          sessionTitle: title.trim(),
          sessionCategory,
          costAllocation,
          costCentre,
          estimatedHourlyCost,
          attendanceStatus: "Scheduled",
          shiftPurpose: sessionType,
          billingClassification: billingClassificationForCost(),
          payStatus: "payable",
          createdBy: actor,
          updatedBy: actor,
        },
        rosterShifts
      );
    });
    const saveError = addRecurringRosterShifts(rows);
    if (saveError) {
      setError(saveError);
      return;
    }
    setMessage(`Scheduled ${title.trim()} for ${attendeeIds.length} attendee${attendeeIds.length === 1 ? "" : "s"}.`);
  }

  function updateAttendance(shift: RosterShiftRecord, attendanceStatus: string) {
    const linkedTimesheet = timesheets.some((sheet) =>
      sheet.lines.some((line) => line.rosterShiftId === shift.id)
    );
    if (shift.attendanceStatus === "Attended" && attendanceStatus !== "Attended" && linkedTimesheet) {
      setError("This attendee already has a generated timesheet line. Remove or reverse the timesheet line before changing attendance.");
      return;
    }
    const signed = attendanceStatus === "Attended" || attendanceStatus === "Did not attend";
    const next = normalizeRosterShift({
      ...shift,
      attendanceStatus,
      attendanceSignedOffAt: signed ? new Date().toISOString() : "",
      attendanceSignedOffBy: signed ? actor : "",
      status: signed ? "Completed" : shift.status === "Completed" ? "Published" : shift.status,
      payStatus: attendanceStatus === "Did not attend" ? "non_payable" : "payable",
      updatedBy: actor,
    });
    const saveError = upsertRosterShift(next);
    if (saveError) {
      setError(saveError);
      return;
    }
    setMessage("Attendance updated.");
  }

  return (
    <AppShell
      title="Training and meetings"
      subtitle="Schedule non-service sessions on the roster, notify staff through their roster view, sign attendance, and track cost allocation."
      audit={{ moduleLabel: "Training and meetings" }}
    >
      <WorkforcePlanningSubnav />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Schedule session</h2>
              <p className="mt-1 text-sm text-slate-600">
                Group sessions create one roster-visible row per attendee under the same session group.
              </p>
            </div>
            <Link href="/rostering?week=2025-10-06" className="text-sm text-[#b51266] hover:underline">
              Open roster
            </Link>
          </div>

          {message ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p> : null}
          {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p> : null}

          <fieldset disabled={!canEdit} className="mt-5 grid gap-4 sm:grid-cols-2 disabled:opacity-75">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Title</span>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Type</span>
              <select className={inputClass} value={sessionType} onChange={(e) => setSessionType(e.target.value as "training_session" | "staff_meeting")}>
                <option value="training_session">Training session</option>
                <option value="staff_meeting">Meeting</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Category</span>
              <select className={inputClass} value={sessionCategory} onChange={(e) => setSessionCategory(e.target.value)}>
                {rosterShiftDropdowns.sessionCategory.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Date</span>
              <input className={inputClass} type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Start</span>
                <input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">End</span>
                <input className={inputClass} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </label>
            </div>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Location</span>
              <select className={inputClass} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                <option value="">No location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.searchKey} - {location.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Cost allocation</span>
              <select className={inputClass} value={costAllocation} onChange={(e) => setCostAllocation(e.target.value as "billable" | "non_billable" | "admin_costed")}>
                <option value="billable">Billable</option>
                <option value="non_billable">Non-billable</option>
                <option value="admin_costed">Admin-costed</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Cost centre</span>
              <input className={inputClass} value={costCentre} onChange={(e) => setCostCentre(e.target.value)} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Estimated hourly cost</span>
              <input className={inputClass} type="number" min="0" step="0.01" value={estimatedHourlyCost} onChange={(e) => setEstimatedHourlyCost(Number(e.target.value))} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
              <textarea className={`${inputClass} min-h-[72px] resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </fieldset>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendees</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {activeEmployees.map((employee) => (
                <label key={employee.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={attendeeIds.includes(employee.id)} onChange={() => toggleAttendee(employee.id)} disabled={!canEdit} />
                  <span>{employee.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={scheduleSession}
            disabled={!canEdit}
            className="mt-5 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Schedule on roster
          </button>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cost summary</h2>
            {!costSummary.length ? (
              <p className="mt-3 text-sm text-slate-600">No attended training or meeting costs yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {costSummary.map((row) => (
                  <li key={row.costCentre} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-slate-900">{row.costCentre}</p>
                    <p className="mt-1 text-sm text-slate-600">{row.attendees} attended rows · {row.hours.toFixed(1)}h</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">${row.cost.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Scheduled sessions</h2>
        <div className="mt-4 space-y-4">
          {sessions.map(({ key, lead, rows }) => (
            <article key={key} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{purposeLabel(lead.shiftPurpose)}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{lead.sessionTitle || lead.shiftRef}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {lead.shiftDate} · {formatShiftTimeRange(lead.startTime, lead.endTime)} · {lead.sessionCategory || "Uncategorised"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {costLabel(lead.costAllocation ?? "")} · {lead.costCentre || "No cost centre"} · {rows.length} attendee{rows.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Link href={`/rostering?week=${lead.shiftDate}`} className="text-sm text-[#b51266] hover:underline">
                  View on roster
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {rows.map((shift) => {
                  const employee = employees.find((e) => e.id === shift.employeeId);
                  return (
                    <li key={shift.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div>
                        {employee ? (
                          <EmployeeRecordLink id={employee.id} searchKey={employee.searchKey} name={employee.name} className="font-medium text-[#b51266] hover:underline" />
                        ) : (
                          <span className="font-medium text-slate-900">{shift.employeeId || "Unassigned"}</span>
                        )}
                        <p className="text-xs text-slate-500">
                          {shift.attendanceStatus || "Scheduled"}
                          {shift.attendanceSignedOffBy ? ` · signed by ${shift.attendanceSignedOffBy}` : ""}
                        </p>
                      </div>
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        value={shift.attendanceStatus || "Scheduled"}
                        disabled={!canEdit}
                        onChange={(e) => updateAttendance(shift, e.target.value)}
                      >
                        {rosterShiftDropdowns.attendanceStatus.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
