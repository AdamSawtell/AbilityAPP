import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { shiftCheckInStatus } from "@/lib/roster-shift-checkin";

export function canRescheduleShiftByDrag(shift: RosterShiftRecord): { allowed: boolean; reason?: string } {
  if (shiftCheckInStatus(shift) !== "not-started") {
    return {
      allowed: false,
      reason: "Cannot drag a shift after worker check-in — open the shift to reschedule.",
    };
  }
  if (shift.status === "Completed") {
    return {
      allowed: false,
      reason: "Completed shifts cannot be dragged — open the shift to change the date.",
    };
  }
  if (shift.status === "Cancelled") {
    return {
      allowed: false,
      reason: "Cancelled shifts cannot be dragged.",
    };
  }
  return { allowed: true };
}

export function rescheduledShiftOnDate(
  shift: RosterShiftRecord,
  targetDate: string,
  updatedBy: string
): RosterShiftRecord {
  return normalizeRosterShift({
    ...shift,
    shiftDate: targetDate,
    updatedBy,
  });
}
