import { addDaysIso, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";

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

/** Shifts a worker can see for self-service check-in (past week through next two weeks). */
export function shiftsForWorkerCheckIn(
  shifts: RosterShiftRecord[],
  employeeId: string,
  anchorDate = localTodayIso()
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
        s.status !== "Draft"
    )
    .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`));
}

export function canWorkerCheckIn(
  shift: RosterShiftRecord,
  employeeId: string,
  now = new Date()
): { ok: true } | { ok: false; message: string } {
  const id = employeeId.trim();
  if (!id) return { ok: false, message: "Your login is not linked to an employee record." };
  if (shift.employeeId !== id) return { ok: false, message: "This shift is not assigned to you." };
  if (shift.status === "Cancelled" || shift.status === "Draft") {
    return { ok: false, message: "This shift is not available for check-in." };
  }
  if (shift.checkedInAt?.trim()) return { ok: false, message: "You have already checked in." };
  const today = localTodayIso(now);
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
  now = new Date()
): { ok: true; shift: RosterShiftRecord } | { ok: false; message: string } {
  const gate = canWorkerCheckIn(shift, employeeId, now);
  if (!gate.ok) return gate;
  return {
    ok: true,
    shift: normalizeRosterShift({
      ...shift,
      checkedInAt: now.toISOString(),
      updatedBy,
    }),
  };
}

export function buildCheckOutUpdate(
  shift: RosterShiftRecord,
  employeeId: string,
  updatedBy: string,
  notes: string,
  now = new Date()
): { ok: true; shift: RosterShiftRecord } | { ok: false; message: string } {
  const gate = canWorkerCheckOut(shift, employeeId);
  if (!gate.ok) return gate;
  return {
    ok: true,
    shift: normalizeRosterShift({
      ...shift,
      checkedOutAt: now.toISOString(),
      checkInNotes: notes.trim(),
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
