import { isVacantShift } from "@/lib/roster-gap-analysis";
import { detectRosterShiftConflicts } from "@/lib/roster-shift-conflicts";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";

export function listOpenMarketplaceShifts(shifts: RosterShiftRecord[]): RosterShiftRecord[] {
  return shifts
    .map(normalizeRosterShift)
    .filter((shift) => isVacantShift(shift))
    .sort((a, b) => {
      const dateCmp = a.shiftDate.localeCompare(b.shiftDate);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });
}

export type OpenShiftClaimResult =
  | { ok: true; shift: RosterShiftRecord }
  | { ok: false; message: string };

export function buildClaimedShift(
  shift: RosterShiftRecord,
  employeeId: string,
  updatedBy: string,
  allShifts: RosterShiftRecord[]
): OpenShiftClaimResult {
  if (!employeeId?.trim()) {
    return { ok: false, message: "Link your user to an employee record before claiming a shift." };
  }
  if (!isVacantShift(shift)) {
    return { ok: false, message: "This shift is no longer open." };
  }

  const claimed = normalizeRosterShift({
    ...shift,
    employeeId,
    status: shift.status === "Draft" ? "Published" : shift.status,
    updatedBy,
  });

  const conflicts = detectRosterShiftConflicts(claimed, { existing: allShifts });
  if (conflicts.some((c) => c.severity === "error")) {
    return { ok: false, message: conflicts.find((c) => c.severity === "error")?.message ?? "Shift conflicts with your roster." };
  }

  return { ok: true, shift: claimed };
}
