import { shiftCheckInStatus } from "@/lib/roster-shift-checkin";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { TimesheetLine, TimesheetRecord } from "@/lib/timesheet";

export type TimesheetLineVerificationStatus =
  | "verified"
  | "not-checked-in"
  | "checked-in-only"
  | "hours-mismatch"
  | "no-roster-link";

export type TimesheetLineVerification = {
  lineId: string;
  rosterShiftId: string;
  status: TimesheetLineVerificationStatus;
  scheduledHours: number;
  actualHours: number | null;
  varianceHours: number | null;
  message: string;
};

export type TimesheetVerificationSummary = {
  lines: TimesheetLineVerification[];
  verifiedCount: number;
  issueCount: number;
  canApprove: boolean;
  blockReason: string | null;
};

const DEFAULT_VARIANCE_THRESHOLD_HOURS = 0.25;

export function actualHoursFromCheckIn(shift: RosterShiftRecord): number | null {
  if (!shift.checkedInAt?.trim() || !shift.checkedOutAt?.trim()) return null;
  const start = new Date(shift.checkedInAt);
  const end = new Date(shift.checkedOutAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  return Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100;
}

export function verifyTimesheetLine(
  line: TimesheetLine,
  shift: RosterShiftRecord | undefined,
  varianceThreshold = DEFAULT_VARIANCE_THRESHOLD_HOURS
): TimesheetLineVerification {
  const scheduledHours = line.hours ?? 0;
  const base = {
    lineId: line.id,
    rosterShiftId: line.rosterShiftId ?? "",
    scheduledHours,
    actualHours: null as number | null,
    varianceHours: null as number | null,
  };

  if (!line.rosterShiftId?.trim()) {
    return {
      ...base,
      status: "no-roster-link",
      message: "Line is not linked to a roster shift — verify manually.",
    };
  }

  if (!shift) {
    return {
      ...base,
      status: "no-roster-link",
      message: "Roster shift not found — verify manually.",
    };
  }

  const checkStatus = shiftCheckInStatus(shift);
  if (checkStatus === "not-started") {
    return {
      ...base,
      status: "not-checked-in",
      message: "Worker has not checked in to this shift.",
    };
  }

  if (checkStatus === "checked-in") {
    return {
      ...base,
      status: "checked-in-only",
      message: "Worker checked in but has not checked out and verified the shift.",
    };
  }

  const actualHours = actualHoursFromCheckIn(shift);
  if (actualHours == null) {
    return {
      ...base,
      status: "hours-mismatch",
      message: "Check-in/out timestamps are invalid — review manually.",
    };
  }

  const varianceHours = Math.round((actualHours - scheduledHours) * 100) / 100;
  if (Math.abs(varianceHours) > varianceThreshold) {
    return {
      ...base,
      status: "hours-mismatch",
      actualHours,
      varianceHours,
      message: `Actual hours (${actualHours.toFixed(2)}) differ from rostered (${scheduledHours.toFixed(2)}) by ${Math.abs(varianceHours).toFixed(2)} h.`,
    };
  }

  return {
    ...base,
    status: "verified",
    actualHours,
    varianceHours,
    message: `Verified — check-in/out matches rostered hours (${actualHours.toFixed(2)} h).`,
  };
}

export function verifyTimesheet(
  sheet: TimesheetRecord,
  rosterShifts: RosterShiftRecord[],
  varianceThreshold = DEFAULT_VARIANCE_THRESHOLD_HOURS
): TimesheetVerificationSummary {
  const shiftById = new Map(rosterShifts.map((s) => [s.id, s]));
  const lines = sheet.lines.map((line) =>
    verifyTimesheetLine(line, shiftById.get(line.rosterShiftId?.trim() ?? ""), varianceThreshold)
  );
  const verifiedCount = lines.filter((l) => l.status === "verified").length;
  const issueCount = lines.filter((l) => l.status !== "verified").length;
  const blockReason = timesheetApprovalBlockReason(lines);
  return {
    lines,
    verifiedCount,
    issueCount,
    canApprove: !blockReason,
    blockReason,
  };
}

export function timesheetApprovalBlockReason(lines: TimesheetLineVerification[]): string | null {
  const blocking = lines.filter((l) => l.status !== "verified" && l.status !== "no-roster-link");
  if (!blocking.length) return null;
  const first = blocking[0];
  const extra = blocking.length > 1 ? ` (+${blocking.length - 1} more)` : "";
  return `${first.message}${extra}`;
}

export function timesheetApprovalBlocked(
  sheet: TimesheetRecord,
  rosterShifts: RosterShiftRecord[],
  nextStatus: string,
  previousStatus?: string
): string | null {
  if (nextStatus !== "Approved") return null;
  if (previousStatus === "Approved") return null;
  return verifyTimesheet(sheet, rosterShifts).blockReason;
}

export function verificationStatusLabel(status: TimesheetLineVerificationStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "not-checked-in":
      return "Not checked in";
    case "checked-in-only":
      return "Awaiting check-out";
    case "hours-mismatch":
      return "Hours mismatch";
    default:
      return "Manual review";
  }
}

export function verificationStatusClass(status: TimesheetLineVerificationStatus): string {
  switch (status) {
    case "verified":
      return "bg-emerald-100 text-emerald-950";
    case "not-checked-in":
      return "bg-rose-100 text-rose-950";
    case "checked-in-only":
      return "bg-sky-100 text-sky-950";
    case "hours-mismatch":
      return "bg-amber-100 text-amber-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
