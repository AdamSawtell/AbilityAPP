"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientRecordLink } from "@/components/record-link";
import { isBuddyShift } from "@/lib/buddy-shift";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs, useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { ShiftGeoLinks } from "@/components/shift-geo-links";
import { ShiftGeofenceAlerts } from "@/components/shift-geofence-alerts";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  countMyShiftsView,
  filterMyShiftsView,
  groupShiftsByDate,
  nextMyShiftAction,
  type MyShiftsView,
} from "@/lib/my-shifts-grouping";
import {
  canWorkerCheckIn,
  canWorkerCheckOut,
  formatCheckInTimestamp,
  shiftCheckInStatus,
  shiftCheckInStatusLabel,
  shiftsAssignedToWorker,
  shiftsForWorkerSchedule,
} from "@/lib/roster-shift-checkin";
import { formatShiftTimeRange } from "@/lib/roster-shift";
import { addDaysIso, weekStartFromDate } from "@/lib/roster-shift";
import { shiftTimesheetDeliveryStatus } from "@/lib/shift-timesheet-bridge";
import { captureGeolocation } from "@/lib/geolocation";
import { shiftGeofenceAlerts } from "@/lib/shift-geofence";
import {
  DEFAULT_ORGANIZATION_TIMEZONE,
  organizationTodayIso,
} from "@/lib/system-timezone";
import { useSystemTimezoneOptional } from "@/lib/system-timezone-store";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";

function statusBadgeClass(status: ReturnType<typeof shiftCheckInStatus>): string {
  switch (status) {
    case "checked-in":
      return "bg-sky-100 text-sky-950";
    case "completed":
      return "bg-emerald-100 text-emerald-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

const VIEW_OPTIONS: { id: MyShiftsView; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

export function MyShiftsPage() {
  const { session } = useAuth();
  const { employee } = useMyEmployee();
  const { clients, locations, rosterShifts, timesheets, checkInRosterShift, checkOutRosterShift } = useData();
  const timezoneCtx = useSystemTimezoneOptional();
  const timezone = timezoneCtx?.timezone ?? DEFAULT_ORGANIZATION_TIMEZONE;
  const orgToday = useMemo(() => organizationTodayIso(timezone), [timezone]);
  const employeeId = employee?.id?.trim() ?? session?.employeeBpId?.trim() ?? "";
  const updatedBy = session?.displayName ?? "Self-service";

  const shifts = useMemo(
    () => shiftsForWorkerSchedule(rosterShifts, employeeId, orgToday),
    [rosterShifts, employeeId, orgToday]
  );
  // "All" must show every assigned shift, including those beyond the rolling
  // schedule window, so a claimed future shift is always verifiable (KAREN-BUG-0004).
  const allAssigned = useMemo(
    () => shiftsAssignedToWorker(rosterShifts, employeeId),
    [rosterShifts, employeeId]
  );

  const [view, setView] = useState<MyShiftsView>("today");
  const [layout, setLayout] = useState<"list" | "week">("list");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notesByShift, setNotesByShift] = useState<Record<string, string>>({});

  const counts = useMemo(() => {
    const base = countMyShiftsView(shifts, employeeId, orgToday);
    return { ...base, all: allAssigned.length };
  }, [shifts, allAssigned, employeeId, orgToday]);
  const filtered = useMemo(
    () =>
      view === "all"
        ? filterMyShiftsView(allAssigned, "all", employeeId, orgToday)
        : filterMyShiftsView(shifts, view, employeeId, orgToday),
    [shifts, allAssigned, view, employeeId, orgToday]
  );
  const groups = useMemo(() => groupShiftsByDate(filtered, orgToday), [filtered, orgToday]);

  const weekDays = useMemo(() => {
    const start = weekStartFromDate(orgToday);
    return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
  }, [orgToday]);

  const shiftsByWeekDay = useMemo(() => {
    const map = new Map<string, RosterShiftRecord[]>();
    for (const day of weekDays) map.set(day, []);
    // Use the full assigned set so a claimed shift in the visible week is never
    // dropped from the week grid (KAREN-BUG-0004).
    for (const shift of allAssigned) {
      if (map.has(shift.shiftDate)) map.get(shift.shiftDate)!.push(shift);
    }
    return map;
  }, [allAssigned, weekDays]);
  const actionShift = useMemo(() => nextMyShiftAction(shifts, employeeId, orgToday), [shifts, employeeId, orgToday]);
  const draftCount = useMemo(() => shifts.filter((s) => s.status === "Draft").length, [shifts]);

  const handleCheckIn = useCallback(
    async (shiftId: string) => {
      setError("");
      setBusyId(shiftId);
      try {
        const geo = await captureGeolocation();
        const message = await checkInRosterShift(shiftId, employeeId, updatedBy, geo);
        if (message) setError(message);
      } finally {
        setBusyId(null);
      }
    },
    [checkInRosterShift, employeeId, updatedBy]
  );

  const handleCheckOut = useCallback(
    async (shiftId: string) => {
      setError("");
      setBusyId(shiftId);
      try {
        const geo = await captureGeolocation();
        const message = await checkOutRosterShift(
          shiftId,
          employeeId,
          updatedBy,
          notesByShift[shiftId] ?? "",
          geo
        );
        if (message) setError(message);
      } finally {
        setBusyId(null);
      }
    },
    [checkOutRosterShift, employeeId, notesByShift, updatedBy]
  );

  return (
    <MyWorkplaceGuard windowKey="my-shifts">
      <AppShell
        title="My shifts"
        subtitle="Check in and out on your phone — grouped by day with quick actions for today's work."
        breadcrumbs={myWorkplaceBreadcrumbs("My shifts")}
        audit={{ moduleLabel: "My shifts" }}
      >
        <MyWorkplaceSubnav />

        {!employeeId ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your login is not linked to an employee record. Ask HR to link your user on the employee System access tab.
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
        ) : null}

        {actionShift && employeeId ? (
          <NextActionBanner
            shift={actionShift}
            client={clients.find((c) => c.id === actionShift.clientId)}
            busy={busyId === actionShift.id}
            notes={notesByShift[actionShift.id] ?? ""}
            onNotesChange={(value) =>
              setNotesByShift((prev) => ({ ...prev, [actionShift.id]: value }))
            }
            onCheckIn={() => void handleCheckIn(actionShift.id)}
            onCheckOut={() => void handleCheckOut(actionShift.id)}
            employeeId={employeeId}
            anchorDate={orgToday}
          />
        ) : null}

        {draftCount ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {draftCount} shift{draftCount === 1 ? "" : "s"} shown as Draft — check-in opens after your coordinator
            publishes the shift on the roster.
          </p>
        ) : null}

        <div
          className="mb-4 flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm"
          role="tablist"
          aria-label="Shift date range"
        >
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={view === option.id}
              onClick={() => setView(option.id)}
              className={`min-h-11 flex-1 rounded-lg px-3 py-2 font-medium transition-colors ${
                view === option.id
                  ? "bg-white text-[#b51266] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {option.label}
              {counts[option.id] ? (
                <span className="ml-1.5 text-xs font-normal text-slate-500">({counts[option.id]})</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-4 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setLayout("list")}
            className={`rounded-lg px-3 py-1.5 ${layout === "list" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700"}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setLayout("week")}
            className={`rounded-lg px-3 py-1.5 ${layout === "week" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700"}`}
          >
            Week calendar
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-slate-600">
            <p>
              {view === "today"
                ? "No shifts scheduled for today (organisation time)."
                : view === "upcoming"
                  ? "No upcoming shifts in the next two weeks."
                  : "No shifts are assigned to you yet."}
            </p>
            {employeeId ? (
              <ul className="mt-3 list-inside list-disc space-y-1 text-slate-500">
                <li>Sign in as the worker linked to the shift (not SuperUser unless linked).</li>
                <li>Shift must be assigned to you and status Published (Draft shifts appear once saved).</li>
                <li>Coordinator publishes on Rostering → edit shift → status Published, or Publish week.</li>
              </ul>
            ) : null}
          </div>
        ) : layout === "week" ? (
          <div className="grid grid-cols-2 gap-2 pb-8 sm:grid-cols-4 lg:grid-cols-7">
            {weekDays.map((day) => (
              <div key={day} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <p className="text-center text-xs font-semibold text-slate-700">{day.slice(5)}</p>
                <ul className="mt-2 space-y-2">
                  {(shiftsByWeekDay.get(day) ?? []).map((shift) => (
                    <li key={shift.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                      <p className="font-medium text-slate-900">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
                      <p className="text-slate-600">
                        {clients.find((c) => c.id === shift.clientId)?.preferredName ||
                          clients.find((c) => c.id === shift.clientId)?.name ||
                          "Client"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            {groups.map((group) => (
              <section key={group.date}>
                <h2 className="sticky top-0 z-10 -mx-1 mb-3 bg-[#f8fafc]/95 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur-sm">
                  {group.label}
                </h2>
                <ul className="space-y-3">
                  {group.shifts.map((shift) => (
                    <MyShiftCard
                      key={shift.id}
                      shift={shift}
                      client={clients.find((c) => c.id === shift.clientId)}
                      location={locations.find((l) => l.id === shift.locationId)}
                      timesheets={timesheets}
                      locations={locations}
                      employeeId={employeeId}
                      busy={busyId === shift.id}
                      notes={notesByShift[shift.id] ?? ""}
                      onNotesChange={(value) =>
                        setNotesByShift((prev) => ({ ...prev, [shift.id]: value }))
                      }
                      onCheckIn={() => void handleCheckIn(shift.id)}
                      onCheckOut={() => void handleCheckOut(shift.id)}
                      highlight={group.label === "Today" || group.label === "Yesterday"}
                      anchorDate={orgToday}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </AppShell>
    </MyWorkplaceGuard>
  );
}

function NextActionBanner({
  shift,
  client,
  busy,
  notes,
  onNotesChange,
  onCheckIn,
  onCheckOut,
  employeeId,
  anchorDate,
}: {
  shift: RosterShiftRecord;
  client?: ClientRecord;
  busy: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  employeeId: string;
  anchorDate: string;
}) {
  const canIn = canWorkerCheckIn(shift, employeeId, new Date(), anchorDate).ok;
  const canOut = canWorkerCheckOut(shift, employeeId).ok;
  if (!canIn && !canOut) return null;

  return (
    <div className="mb-4 rounded-2xl border-2 border-[#d4147a]/30 bg-[#fdf2f8] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">Next action</p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {formatShiftTimeRange(shift.startTime, shift.endTime)}
        {client ? ` · ${client.searchKey}` : ""}
      </p>
      {canOut ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-700">Notes (optional)</span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {canIn ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCheckIn}
            className="min-h-12 w-full rounded-xl bg-[#b51266] px-4 py-3 text-base font-semibold text-white hover:bg-[#9e1058] disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Saving…" : "Check in now"}
          </button>
        ) : null}
        {canOut ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCheckOut}
            className="min-h-12 w-full rounded-xl border-2 border-[#b51266] bg-white px-4 py-3 text-base font-semibold text-[#b51266] hover:bg-white/80 disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Saving…" : "Check out & verify"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MyShiftCard({
  shift,
  client,
  location,
  timesheets,
  locations,
  employeeId,
  busy,
  notes,
  onNotesChange,
  onCheckIn,
  onCheckOut,
  highlight,
  anchorDate,
}: {
  shift: RosterShiftRecord;
  client?: ClientRecord;
  location?: LocationRecord;
  timesheets: import("@/lib/timesheet").TimesheetRecord[];
  locations: LocationRecord[];
  employeeId: string;
  busy: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  highlight: boolean;
  anchorDate: string;
}) {
  const status = shiftCheckInStatus(shift);
  const canIn = canWorkerCheckIn(shift, employeeId, new Date(), anchorDate).ok;
  const canOut = canWorkerCheckOut(shift, employeeId).ok;
  const checkInGate = canWorkerCheckIn(shift, employeeId, new Date(), anchorDate);
  const isDraft = shift.status === "Draft";
  const delivery = shiftTimesheetDeliveryStatus({ shift, timesheets, locations });

  return (
    <li
      className={`list-none rounded-2xl border bg-white p-4 shadow-sm ${
        highlight ? "border-[#d4147a]/40 ring-1 ring-[#d4147a]/20" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-slate-900">
            {formatShiftTimeRange(shift.startTime, shift.endTime)}
          </p>
          {client ? (
            <ClientRecordLink
              id={client.id}
              searchKey={client.searchKey}
              name={client.name}
              className="mt-1 block truncate text-sm text-slate-700 hover:underline"
            />
          ) : null}
          {location ? <p className="mt-0.5 truncate text-sm text-slate-500">{location.name}</p> : null}
          {shift.shiftType ? (
            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {shift.shiftType}
            </span>
          ) : null}
          {isBuddyShift(shift) ? (
            <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
              Buddy shift
            </span>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(status)}`}>
          {isDraft ? "Draft" : shiftCheckInStatusLabel(status)}
        </span>
      </div>

      {shift.checkedInAt ? (
        <p className="mt-3 text-xs text-slate-600">
          Checked in {formatCheckInTimestamp(shift.checkedInAt)}
          {shift.checkedOutAt ? ` · Out ${formatCheckInTimestamp(shift.checkedOutAt)}` : null}
        </p>
      ) : null}
      {!canIn && !canOut && (status === "not-started" || isDraft) && !checkInGate.ok ? (
        <p className="mt-2 text-xs text-slate-500">{checkInGate.message}</p>
      ) : null}
      {shift.checkInNotes ? (
        <p className="mt-2 text-sm text-slate-600">Notes: {shift.checkInNotes}</p>
      ) : null}
      <ShiftGeoLinks shift={shift} />
      <ShiftGeofenceAlerts alerts={shiftGeofenceAlerts(shift, location)} />

      {delivery.message ? (
        <p className="mt-3 text-sm text-slate-600">
          {delivery.message}{" "}
          {delivery.href ? (
            <Link href={delivery.href} className="font-medium text-[#b51266] hover:underline">
              View timesheet
            </Link>
          ) : null}
        </p>
      ) : null}

      {canOut ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-700">Notes (optional)</span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base sm:text-sm"
            placeholder="Handover notes or anything the coordinator should know"
          />
        </label>
      ) : null}

      {(canIn || canOut) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {canIn ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCheckIn}
              className="min-h-12 w-full rounded-xl bg-[#b51266] px-4 py-3 text-base font-semibold text-white hover:bg-[#9e1058] disabled:opacity-60 sm:flex-1 sm:text-sm"
            >
              {busy ? "Saving…" : "Check in"}
            </button>
          ) : null}
          {canOut ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCheckOut}
              className="min-h-12 w-full rounded-xl border-2 border-[#b51266] bg-white px-4 py-3 text-base font-semibold text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60 sm:flex-1 sm:text-sm"
            >
              {busy ? "Saving…" : "Check out & verify"}
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}
