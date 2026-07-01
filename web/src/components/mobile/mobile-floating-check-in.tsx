"use client";

import { canWorkerCheckIn, canWorkerCheckOut } from "@/lib/roster-shift-checkin";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export function MobileFloatingCheckIn({
  shift,
  employeeId,
  anchorDate,
  busy,
  onCheckIn,
  onCheckOut,
}: {
  shift: RosterShiftRecord;
  employeeId: string;
  anchorDate: string;
  busy: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const canIn = canWorkerCheckIn(shift, employeeId, new Date(), anchorDate).ok;
  const canOut = canWorkerCheckOut(shift, employeeId).ok;
  if (!canIn && !canOut) return null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={canOut ? onCheckOut : onCheckIn}
      className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#b51266] px-6 text-lg font-bold text-white shadow-lg shadow-[#b51266]/25 disabled:opacity-60"
    >
      {busy ? "Saving…" : canOut ? "Check out now" : "Check in now"}
    </button>
  );
}
