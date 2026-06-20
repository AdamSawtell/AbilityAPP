"use client";

import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientRecordLink } from "@/components/record-link";
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
  shiftsForWorkerCheckIn,
} from "@/lib/roster-shift-checkin";
import { formatShiftTimeRange } from "@/lib/roster-shift";
import { captureGeolocation } from "@/lib/geolocation";
import { shiftGeofenceAlerts } from "@/lib/shift-geofence";
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
  const { clients, locations, rosterShifts, checkInRosterShift, checkOutRosterShift } = useData();
  const employeeId = employee?.id?.trim() ?? session?.employeeBpId?.trim() ?? "";
  const updatedBy = session?.displayName ?? "Self-service";

  const shifts = useMemo(
    () => shiftsForWorkerCheckIn(rosterShifts, employeeId),
    [rosterShifts, employeeId]
  );

  const [view, setView] = useState<MyShiftsView>("today");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notesByShift, setNotesByShift] = useState<Record<string, string>>({});

  const counts = useMemo(() => countMyShiftsView(shifts, employeeId), [shifts, employeeId]);
  const filtered = useMemo(() => filterMyShiftsView(shifts, view, employeeId), [shifts, view, employeeId]);
  const groups = useMemo(() => groupShiftsByDate(filtered), [filtered]);
  const actionShift = useMemo(() => nextMyShiftAction(shifts, employeeId), [shifts, employeeId]);

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
          />
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

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-600">
            {view === "today"
              ? "No shifts scheduled for today."
              : view === "upcoming"
                ? "No upcoming shifts in the next two weeks."
                : "No assigned shifts in the next two weeks."}
          </p>
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
                      employeeId={employeeId}
                      busy={busyId === shift.id}
                      notes={notesByShift[shift.id] ?? ""}
                      onNotesChange={(value) =>
                        setNotesByShift((prev) => ({ ...prev, [shift.id]: value }))
                      }
                      onCheckIn={() => void handleCheckIn(shift.id)}
                      onCheckOut={() => void handleCheckOut(shift.id)}
                      highlight={group.label === "Today" || group.label === "Yesterday"}
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
}: {
  shift: RosterShiftRecord;
  client?: ClientRecord;
  busy: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  employeeId: string;
}) {
  const canIn = canWorkerCheckIn(shift, employeeId).ok;
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
  employeeId,
  busy,
  notes,
  onNotesChange,
  onCheckIn,
  onCheckOut,
  highlight,
}: {
  shift: RosterShiftRecord;
  client?: ClientRecord;
  location?: LocationRecord;
  employeeId: string;
  busy: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  highlight: boolean;
}) {
  const status = shiftCheckInStatus(shift);
  const canIn = canWorkerCheckIn(shift, employeeId).ok;
  const canOut = canWorkerCheckOut(shift, employeeId).ok;
  const checkInGate = canWorkerCheckIn(shift, employeeId);

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
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(status)}`}>
          {shiftCheckInStatusLabel(status)}
        </span>
      </div>

      {shift.checkedInAt ? (
        <p className="mt-3 text-xs text-slate-600">
          Checked in {formatCheckInTimestamp(shift.checkedInAt)}
          {shift.checkedOutAt ? ` · Out ${formatCheckInTimestamp(shift.checkedOutAt)}` : null}
        </p>
      ) : null}
      {!canIn && !canOut && status === "not-started" && !checkInGate.ok ? (
        <p className="mt-2 text-xs text-slate-500">{checkInGate.message}</p>
      ) : null}
      {shift.checkInNotes ? (
        <p className="mt-2 text-sm text-slate-600">Notes: {shift.checkInNotes}</p>
      ) : null}
      <ShiftGeoLinks shift={shift} />
      <ShiftGeofenceAlerts alerts={shiftGeofenceAlerts(shift, location)} />

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
