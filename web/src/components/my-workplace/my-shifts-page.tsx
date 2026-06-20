"use client";

import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientRecordLink } from "@/components/record-link";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs, useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  canWorkerCheckIn,
  canWorkerCheckOut,
  formatCheckInTimestamp,
  shiftCheckInStatus,
  shiftCheckInStatusLabel,
  shiftsForWorkerCheckIn,
} from "@/lib/roster-shift-checkin";
import { formatDayHeading, formatShiftTimeRange } from "@/lib/roster-shift";
import { captureGeolocation } from "@/lib/geolocation";
import { ShiftGeoLinks } from "@/components/shift-geo-links";

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

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notesByShift, setNotesByShift] = useState<Record<string, string>>({});

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
        subtitle="Check in and out of your assigned roster shifts. Location is captured when your browser allows it."
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

        {shifts.length === 0 ? (
          <p className="text-sm text-slate-600">No assigned shifts in the next two weeks.</p>
        ) : (
          <ul className="space-y-4">
            {shifts.map((shift) => {
              const client = clients.find((c) => c.id === shift.clientId);
              const location = locations.find((l) => l.id === shift.locationId);
              const status = shiftCheckInStatus(shift);
              const canIn = canWorkerCheckIn(shift, employeeId).ok;
              const canOut = canWorkerCheckOut(shift, employeeId).ok;
              const busy = busyId === shift.id;

              return (
                <li
                  key={shift.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{formatDayHeading(shift.shiftDate)}</p>
                      <p className="mt-0.5 text-lg font-semibold text-slate-900">
                        {formatShiftTimeRange(shift.startTime, shift.endTime)}
                      </p>
                      {client ? (
                        <ClientRecordLink
                          id={client.id}
                          searchKey={client.searchKey}
                          name={client.name}
                          className="mt-1 block text-sm text-slate-700 hover:underline"
                        />
                      ) : null}
                      {location ? <p className="mt-0.5 text-sm text-slate-500">{location.name}</p> : null}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(status)}`}
                    >
                      {shiftCheckInStatusLabel(status)}
                    </span>
                  </div>

                  {shift.checkedInAt ? (
                    <p className="mt-3 text-xs text-slate-600">
                      Checked in {formatCheckInTimestamp(shift.checkedInAt)}
                      {shift.checkedOutAt ? ` · Out ${formatCheckInTimestamp(shift.checkedOutAt)}` : null}
                    </p>
                  ) : null}
                  {shift.checkInNotes ? (
                    <p className="mt-2 text-sm text-slate-600">Notes: {shift.checkInNotes}</p>
                  ) : null}
                  <ShiftGeoLinks shift={shift} />

                  {canOut ? (
                    <label className="mt-3 block">
                      <span className="text-xs font-medium text-slate-700">Notes (optional)</span>
                      <textarea
                        rows={2}
                        value={notesByShift[shift.id] ?? ""}
                        onChange={(e) =>
                          setNotesByShift((prev) => ({ ...prev, [shift.id]: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Handover notes or anything the coordinator should know"
                      />
                    </label>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canIn ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleCheckIn(shift.id)}
                        className="rounded-lg bg-[#b51266] px-4 py-2 text-sm font-medium text-white hover:bg-[#9e1058] disabled:opacity-60"
                      >
                        {busy ? "Saving…" : "Check in"}
                      </button>
                    ) : null}
                    {canOut ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleCheckOut(shift.id)}
                        className="rounded-lg border border-[#b51266] bg-white px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60"
                      >
                        {busy ? "Saving…" : "Check out & verify"}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppShell>
    </MyWorkplaceGuard>
  );
}
