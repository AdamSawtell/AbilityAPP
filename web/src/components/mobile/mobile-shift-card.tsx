"use client";

import { useState } from "react";
import { isBuddyShift } from "@/lib/buddy-shift";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import { mapsNavigateUrl } from "@/lib/geolocation";
import { formatShiftTimeRange, type RosterShiftRecord } from "@/lib/roster-shift";
import {
  canWorkerCheckIn,
  canWorkerCheckOut,
  formatCheckInTimestamp,
  shiftCheckInStatus,
  shiftCheckInStatusLabel,
} from "@/lib/roster-shift-checkin";
import { shiftGeofenceAlerts } from "@/lib/shift-geofence";
import { workerLineForEmployee } from "@/lib/roster-session";
import { ShiftGeofenceAlerts } from "@/components/shift-geofence-alerts";
import { MobileShiftAnimalSummary } from "@/components/mobile/mobile-shift-animal-summary";

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

export function MobileShiftCard({
  shift,
  client,
  location,
  employeeId,
  anchorDate,
  busy,
  highlight,
  notes,
  onNotesChange,
  onCheckIn,
  onCheckOut,
  compact = false,
}: {
  shift: RosterShiftRecord;
  client?: ClientRecord;
  location?: LocationRecord;
  employeeId: string;
  anchorDate: string;
  busy: boolean;
  highlight?: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  compact?: boolean;
}) {
  const status = shiftCheckInStatus(shift, employeeId);
  const workerLine = workerLineForEmployee(shift.workerLines, employeeId);
  const checkedInAt = workerLine?.checkedInAt || shift.checkedInAt;
  const checkedOutAt = workerLine?.checkedOutAt || shift.checkedOutAt;
  const canIn = canWorkerCheckIn(shift, employeeId, new Date(), anchorDate).ok;
  const canOut = canWorkerCheckOut(shift, employeeId).ok;
  const checkInGate = canWorkerCheckIn(shift, employeeId, new Date(), anchorDate);
  const isDraft = shift.status === "Draft";
  const navigateUrl = location ? mapsNavigateUrl(location) : "";

  const priorNotes = workerLine?.notes?.trim() || shift.checkInNotes?.trim() || "";
  const [handoverOpen, setHandoverOpen] = useState(false);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        highlight ? "border-[#d4147a]/50 ring-2 ring-[#d4147a]/15" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-slate-900">
            {formatShiftTimeRange(shift.startTime, shift.endTime)}
          </p>
          {client ? (
            <p className="mt-1 truncate text-sm font-medium text-slate-800">
              {client.preferredName || client.name}
            </p>
          ) : null}
          {location ? <p className="truncate text-sm text-slate-500">{location.name}</p> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shift.shiftType ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {shift.shiftType}
              </span>
            ) : null}
            {isBuddyShift(shift) ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                Buddy
              </span>
            ) : null}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
          {isDraft ? "Draft" : shiftCheckInStatusLabel(status)}
        </span>
      </div>

      {checkedInAt ? (
        <p className="mt-2 text-xs text-slate-600">
          In {formatCheckInTimestamp(checkedInAt)}
          {checkedOutAt ? ` · Out ${formatCheckInTimestamp(checkedOutAt)}` : null}
        </p>
      ) : null}

      {!canIn && !canOut && !checkInGate.ok ? (
        <p className="mt-2 text-xs text-slate-500">{checkInGate.message}</p>
      ) : null}

      {priorNotes ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setHandoverOpen((v) => !v)}
            className="text-xs font-semibold text-[#b51266]"
          >
            {handoverOpen ? "Hide notes" : "Handover notes"}
          </button>
          {handoverOpen ? (
            <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{priorNotes}</p>
          ) : null}
        </div>
      ) : null}

      <ShiftGeofenceAlerts alerts={shiftGeofenceAlerts(shift, location)} />
      {client ? <MobileShiftAnimalSummary client={client} shiftLocationId={shift.locationId} /> : null}

      {navigateUrl ? (
        <a
          href={navigateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800"
        >
          Get directions
        </a>
      ) : null}

      {canOut && !compact ? (
        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-700">Checkout notes (optional)</span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            placeholder="Handover for the coordinator"
          />
        </label>
      ) : null}

      {(canIn || canOut) ? (
        <div className="mt-3 flex flex-col gap-2">
          {canIn ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCheckIn}
              className="min-h-[3rem] w-full rounded-xl bg-[#b51266] text-base font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Check in"}
            </button>
          ) : null}
          {canOut ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCheckOut}
              className="min-h-[3rem] w-full rounded-xl border-2 border-[#b51266] bg-white text-base font-semibold text-[#b51266] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Check out"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
