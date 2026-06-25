import { addDaysIso, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { geoToStrings, type GeoCoordinates } from "@/lib/geolocation";

export type ShiftCheckInStatus = "not-started" | "checked-in" | "completed";

export function shiftCheckInStatus(shift: RosterShiftRecord): ShiftCheckInStatus {
  if (shift.checkedOutAt?.trim()) return "completed";
  if (shift.checkedInAt?.trim()) return "checked-in";
  return "not-started";
}

export function shiftCheckInStatusLabel(status: ShiftCheckInStatus): string {
  switch (status) {
    case "checked-in":
      return "Checked in";
    case "completed":
      return "Verified";
    default:
      return "Not checked in";
  }
}

function localTodayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shifts assigned to a worker in the schedule window (includes Draft for visibility). */
export function shiftsForWorkerSchedule(
  shifts: RosterShiftRecord[],
  employeeId: string,
  anchorDate: string
): RosterShiftRecord[] {
  const id = employeeId.trim();
  if (!id) return [];
  const from = addDaysIso(anchorDate, -7);
  const to = addDaysIso(anchorDate, 14);
  return shifts
    .filter(
      (s) =>
        s.employeeId === id &&
        s.shiftDate >= from &&
        s.shiftDate <= to &&
        s.status !== "Cancelled" &&
        (s.status === "Draft" || s.status === "Published" || s.status === "Completed")
    )
    .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`));
}

/**
 * Every shift assigned to the worker (no date window), excluding cancelled.
 * Used by the My shifts "All" view so a claimed future shift is always
 * verifiable, even beyond the rolling schedule window (KAREN-BUG-0004).
 */
export function shiftsAssignedToWorker(
  shifts: RosterShiftRecord[],
  employeeId: string
): RosterShiftRecord[] {
  const id = employeeId.trim();
  if (!id) return [];
  return shifts
    .filter((s) => s.employeeId === id && s.status !== "Cancelled")
    .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`));
}

/** Shifts a worker can check in on (Published / Completed only). */
export function shiftsForWorkerCheckIn(
  shifts: RosterShiftRecord[],
  employeeId: string,
  anchorDate = localTodayIso()
): RosterShiftRecord[] {
  return shiftsForWorkerSchedule(shifts, employeeId, anchorDate).filter((s) => s.status !== "Draft");
}

export function canWorkerCheckIn(
  shift: RosterShiftRecord,
  employeeId: string,
  now = new Date(),
  anchorDate?: string
): { ok: true } | { ok: false; message: string } {
  const id = employeeId.trim();
  if (!id) return { ok: false, message: "Your login is not linked to an employee record." };
  if (shift.employeeId !== id) return { ok: false, message: "This shift is not assigned to you." };
  if (shift.status === "Cancelled" || shift.status === "Draft") {
    return {
      ok: false,
      message:
        shift.status === "Draft"
          ? "This shift is still Draft — your coordinator must publish it before you can check in."
          : "This shift is not available for check-in.",
    };
  }
  if (shift.checkedInAt?.trim()) return { ok: false, message: "You have already checked in." };
  const today = anchorDate ?? localTodayIso(now);
  const earliest = addDaysIso(today, -1);
  if (shift.shiftDate < earliest) {
    return { ok: false, message: "Check-in is only available for today and yesterday's shifts." };
  }
  if (shift.shiftDate > today) {
    return { ok: false, message: "Check-in opens on the shift date." };
  }
  return { ok: true };
}

export function canWorkerCheckOut(
  shift: RosterShiftRecord,
  employeeId: string
): { ok: true } | { ok: false; message: string } {
  const id = employeeId.trim();
  if (!id) return { ok: false, message: "Your login is not linked to an employee record." };
  if (shift.employeeId !== id) return { ok: false, message: "This shift is not assigned to you." };
  if (!shift.checkedInAt?.trim()) return { ok: false, message: "Check in before checking out." };
  if (shift.checkedOutAt?.trim()) return { ok: false, message: "You have already checked out." };
  return { ok: true };
}

export function buildCheckInUpdate(
  shift: RosterShiftRecord,
  employeeId: string,
  updatedBy: string,
  now = new Date(),
  geo: GeoCoordinates | null = null
): { ok: true; shift: RosterShiftRecord } | { ok: false; message: string } {
  const gate = canWorkerCheckIn(shift, employeeId, now);
  if (!gate.ok) return gate;
  const geoStrings = geoToStrings(geo);
  return {
    ok: true,
    shift: normalizeRosterShift({
      ...shift,
      checkedInAt: now.toISOString(),
      checkInLatitude: geoStrings.latitude,
      checkInLongitude: geoStrings.longitude,
      updatedBy,
    }),
  };
}

export function buildCheckOutUpdate(
  shift: RosterShiftRecord,
  employeeId: string,
  updatedBy: string,
  notes: string,
  now = new Date(),
  geo: GeoCoordinates | null = null
): { ok: true; shift: RosterShiftRecord } | { ok: false; message: string } {
  const gate = canWorkerCheckOut(shift, employeeId);
  if (!gate.ok) return gate;
  const geoStrings = geoToStrings(geo);
  return {
    ok: true,
    shift: normalizeRosterShift({
      ...shift,
      checkedOutAt: now.toISOString(),
      checkInNotes: notes.trim(),
      checkOutLatitude: geoStrings.latitude,
      checkOutLongitude: geoStrings.longitude,
      status: shift.status === "Published" ? "Completed" : shift.status,
      updatedBy,
    }),
  };
}

export function formatCheckInTimestamp(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
