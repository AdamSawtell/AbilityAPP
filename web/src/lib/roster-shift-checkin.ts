import { addDaysIso, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { geoToStrings, type GeoCoordinates } from "@/lib/geolocation";
import {
  assignedWorkerIdsForShift,
  shiftHasAssignedWorker,
  updateWorkerLineForEmployee,
  workerLineForEmployee,
} from "@/lib/roster-session";

export type ShiftCheckInStatus = "not-started" | "checked-in" | "completed";

export function shiftCheckInStatus(shift: RosterShiftRecord, employeeId = ""): ShiftCheckInStatus {
  const workerLine = workerLineForEmployee(shift.workerLines, employeeId);
  if (workerLine) {
    if (workerLine.checkedOutAt?.trim()) return "completed";
    if (workerLine.checkedInAt?.trim()) return "checked-in";
    if (shift.employeeId?.trim() === employeeId.trim()) {
      if (shift.checkedOutAt?.trim()) return "completed";
      if (shift.checkedInAt?.trim()) return "checked-in";
    }
    return "not-started";
  }
  if (!employeeId.trim()) {
    const assignedWorkerLines = (shift.workerLines ?? []).filter((line) => line.employeeId.trim());
    if (assignedWorkerLines.length) {
      if (assignedWorkerLines.every((line) => line.checkedOutAt?.trim())) return "completed";
      if (assignedWorkerLines.some((line) => line.checkedInAt?.trim())) return "checked-in";
    }
  }
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
        shiftHasAssignedWorker(s, id) &&
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
    .filter((s) => shiftHasAssignedWorker(s, id) && s.status !== "Cancelled")
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
  if (!shiftHasAssignedWorker(shift, id)) return { ok: false, message: "This shift is not assigned to you." };
  if (shift.status === "Cancelled" || shift.status === "Draft") {
    return {
      ok: false,
      message:
        shift.status === "Draft"
          ? "This shift is still Draft — your coordinator must publish it before you can check in."
          : "This shift is not available for check-in.",
    };
  }
  if (shiftCheckInStatus(shift, id) !== "not-started") {
    return { ok: false, message: "You have already checked in." };
  }
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
  if (!shiftHasAssignedWorker(shift, id)) return { ok: false, message: "This shift is not assigned to you." };
  const status = shiftCheckInStatus(shift, id);
  if (status === "not-started") return { ok: false, message: "Check in before checking out." };
  if (status === "completed") return { ok: false, message: "You have already checked out." };
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
  const isPrimaryWorker = shift.employeeId === employeeId.trim();
  const currentWorkerLine = workerLineForEmployee(shift.workerLines, employeeId);
  const checkInGeoNote =
    !isPrimaryWorker && geoStrings.latitude && geoStrings.longitude
      ? `${currentWorkerLine?.notes?.trim() ? `${currentWorkerLine.notes.trim()}\n` : ""}Check-in GPS: ${geoStrings.latitude}, ${geoStrings.longitude}`
      : currentWorkerLine?.notes ?? "";
  return {
    ok: true,
    shift: normalizeRosterShift({
      ...shift,
      checkedInAt: isPrimaryWorker ? now.toISOString() : shift.checkedInAt,
      checkInLatitude: isPrimaryWorker ? geoStrings.latitude : shift.checkInLatitude,
      checkInLongitude: isPrimaryWorker ? geoStrings.longitude : shift.checkInLongitude,
      workerLines: updateWorkerLineForEmployee(shift.workerLines, employeeId, {
        checkedInAt: now.toISOString(),
        status: "assigned",
        notes: checkInGeoNote,
      }),
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
  const isPrimaryWorker = shift.employeeId === employeeId.trim();
  const currentWorkerLine = workerLineForEmployee(shift.workerLines, employeeId);
  const checkOutNotes = [
    notes.trim(),
    !isPrimaryWorker && geoStrings.latitude && geoStrings.longitude
      ? `Check-out GPS: ${geoStrings.latitude}, ${geoStrings.longitude}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const updatedWorkerLines = updateWorkerLineForEmployee(shift.workerLines, employeeId, {
    checkedOutAt: now.toISOString(),
    notes: checkOutNotes || currentWorkerLine?.notes || "",
  });
  const allCheckedInWorkersCheckedOut = assignedWorkerIdsForShift({ ...shift, workerLines: updatedWorkerLines }).every(
    (id) => {
      const line = workerLineForEmployee(updatedWorkerLines, id);
      if (line) return !line.checkedInAt?.trim() || Boolean(line.checkedOutAt?.trim());
      if (id === shift.employeeId?.trim()) {
        const checkedInAt = isPrimaryWorker ? shift.checkedInAt || now.toISOString() : shift.checkedInAt;
        const checkedOutAt = isPrimaryWorker ? now.toISOString() : shift.checkedOutAt;
        return !checkedInAt?.trim() || Boolean(checkedOutAt?.trim());
      }
      return true;
    }
  );
  return {
    ok: true,
    shift: normalizeRosterShift({
      ...shift,
      checkedOutAt: isPrimaryWorker ? now.toISOString() : shift.checkedOutAt,
      checkInNotes: isPrimaryWorker ? notes.trim() : shift.checkInNotes,
      checkOutLatitude: isPrimaryWorker ? geoStrings.latitude : shift.checkOutLatitude,
      checkOutLongitude: isPrimaryWorker ? geoStrings.longitude : shift.checkOutLongitude,
      workerLines: updatedWorkerLines,
      status: shift.status === "Published" && allCheckedInWorkersCheckedOut ? "Completed" : shift.status,
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
