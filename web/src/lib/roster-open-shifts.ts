import { isVacantShift } from "@/lib/roster-gap-analysis";
import { detectRosterShiftConflicts } from "@/lib/roster-shift-conflicts";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import { dayLabels } from "@/lib/my-workplace/types";

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

export type ShiftAvailabilityStatus =
  | "preferred"
  | "available"
  | "outside"
  | "unavailable"
  | "unknown";

export type ShiftAvailabilityResult = {
  status: ShiftAvailabilityStatus;
  /** Shift sits inside the worker's available/preferred hours. */
  matchesAvailability: boolean;
  /** Claiming should prompt for explicit confirmation first. */
  needsConfirm: boolean;
  message: string;
};

function availabilityMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/** Convert an ISO date to a Monday-indexed weekday (0 = Monday … 6 = Sunday). */
function mondayWeekdayIndex(isoDate: string): number | null {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getDay() + 6) % 7;
}

/**
 * Compare an open shift against the worker's saved weekly availability so the
 * marketplace can prioritise matching shifts and warn before an
 * outside-availability claim (KAREN-BUG-0004).
 */
export function classifyShiftAvailability(
  shift: { shiftDate: string; startTime: string; endTime: string },
  availability: EmployeeAvailabilityRow[] | undefined
): ShiftAvailabilityResult {
  const labels = dayLabels();
  const usable = (availability ?? []).filter(
    (row) => availabilityMinutes(row.startTime) !== null && availabilityMinutes(row.endTime) !== null
  );

  if (usable.length === 0) {
    return {
      status: "unknown",
      matchesAvailability: false,
      needsConfirm: false,
      message: "Set your weekly availability to see which shifts match your hours.",
    };
  }

  const dayIndex = mondayWeekdayIndex(shift.shiftDate);
  const shiftStart = availabilityMinutes(shift.startTime);
  const shiftEnd = availabilityMinutes(shift.endTime);
  if (dayIndex === null || shiftStart === null || shiftEnd === null) {
    return { status: "unknown", matchesAvailability: false, needsConfirm: false, message: "" };
  }

  const dayName = labels[dayIndex] ?? `Day ${dayIndex}`;
  const dayRows = usable.filter((row) => row.dayOfWeek === dayIndex);
  // endTime <= startTime means the shift runs past midnight; a same-day daytime
  // window cannot cover it, so it is always outside the worker's saved pattern.
  const overnight = shiftEnd <= shiftStart;

  if (dayRows.length === 0) {
    return {
      status: "outside",
      matchesAvailability: false,
      needsConfirm: true,
      message: `Outside your availability — you have no ${dayName} hours saved.`,
    };
  }

  const coveredBy = (preference: string): boolean =>
    !overnight &&
    dayRows.some((row) => {
      if ((row.availability || "").toLowerCase() !== preference) return false;
      const windowStart = availabilityMinutes(row.startTime);
      const windowEnd = availabilityMinutes(row.endTime);
      if (windowStart === null || windowEnd === null) return false;
      return shiftStart >= windowStart && shiftEnd <= windowEnd;
    });

  if (coveredBy("preferred")) {
    return {
      status: "preferred",
      matchesAvailability: true,
      needsConfirm: false,
      message: `Matches your preferred ${dayName} hours.`,
    };
  }
  if (coveredBy("available")) {
    return {
      status: "available",
      matchesAvailability: true,
      needsConfirm: false,
      message: `Within your ${dayName} availability.`,
    };
  }

  const markedUnavailable = dayRows.some(
    (row) => (row.availability || "").toLowerCase() === "unavailable"
  );
  const windowLabel = dayRows
    .filter((row) => (row.availability || "").toLowerCase() !== "unavailable")
    .map((row) => `${row.startTime}–${row.endTime}`)
    .join(", ");

  return {
    status: markedUnavailable && !windowLabel ? "unavailable" : "outside",
    matchesAvailability: false,
    needsConfirm: true,
    message: windowLabel
      ? `Outside your ${dayName} availability (${windowLabel}).`
      : `You marked ${dayName} as unavailable.`,
  };
}

const AVAILABILITY_SORT_RANK: Record<ShiftAvailabilityStatus, number> = {
  preferred: 0,
  available: 1,
  unknown: 2,
  outside: 3,
  unavailable: 4,
};

/** Open shifts ordered with availability matches first, then by date/time. */
export function sortOpenShiftsByAvailability(
  shifts: RosterShiftRecord[],
  availability: EmployeeAvailabilityRow[] | undefined
): RosterShiftRecord[] {
  return [...shifts].sort((a, b) => {
    const rankA = AVAILABILITY_SORT_RANK[classifyShiftAvailability(a, availability).status];
    const rankB = AVAILABILITY_SORT_RANK[classifyShiftAvailability(b, availability).status];
    if (rankA !== rankB) return rankA - rankB;
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

  const conflicts = detectRosterShiftConflicts(claimed, { existing: allShifts }).map((issue) =>
    issue.severity === "warning" ? { ...issue, severity: "error" as const } : issue
  );
  if (conflicts.some((c) => c.severity === "error")) {
    return {
      ok: false,
      message: conflicts.find((c) => c.severity === "error")?.message ?? "Shift conflicts with your roster.",
    };
  }

  return { ok: true, shift: claimed };
}
