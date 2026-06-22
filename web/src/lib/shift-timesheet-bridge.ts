import { shiftCheckInStatus } from "@/lib/roster-shift-checkin";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { TimesheetRecord } from "@/lib/timesheet";
import { verifyTimesheetLine } from "@/lib/timesheet-verification";
import type { LocationRecord } from "@/lib/location";

export type ShiftTimesheetLink = {
  timesheetId: string;
  documentNo: string;
  timesheetStatus: string;
  lineVerified: boolean;
  verificationMessage: string;
};

export function findTimesheetForShift(
  timesheets: TimesheetRecord[],
  shiftId: string
): ShiftTimesheetLink | null {
  const id = shiftId.trim();
  if (!id) return null;

  for (const sheet of timesheets) {
    const line = sheet.lines.find((l) => l.rosterShiftId === id);
    if (!line) continue;
    return {
      timesheetId: sheet.id,
      documentNo: sheet.documentNo,
      timesheetStatus: sheet.status,
      lineVerified: false,
      verificationMessage: "",
    };
  }
  return null;
}

export function shiftTimesheetDeliveryStatus(params: {
  shift: RosterShiftRecord;
  timesheets: TimesheetRecord[];
  locations: LocationRecord[];
}): {
  checkInStatus: ReturnType<typeof shiftCheckInStatus>;
  timesheetLink: ShiftTimesheetLink | null;
  readyForTimesheet: boolean;
  message: string;
  href: string | null;
} {
  const { shift, timesheets, locations } = params;
  const checkInStatus = shiftCheckInStatus(shift);
  const location = locations.find((l) => l.id === shift.locationId);
  let timesheetLink = findTimesheetForShift(timesheets, shift.id);

  if (timesheetLink) {
    const sheet = timesheets.find((t) => t.id === timesheetLink!.timesheetId);
    const line = sheet?.lines.find((l) => l.rosterShiftId === shift.id);
    if (sheet && line) {
      const verification = verifyTimesheetLine(line, shift, undefined, location);
      timesheetLink = {
        ...timesheetLink,
        lineVerified: verification.status === "verified",
        verificationMessage: verification.message,
      };
    }
  }

  const readyForTimesheet =
    checkInStatus === "completed" && shift.status !== "Draft" && !timesheetLink;

  let message = "";
  let href: string | null = null;

  if (checkInStatus === "not-started") {
    message = "Check in when your shift starts. Timesheet generation uses verified check-out.";
  } else if (checkInStatus === "checked-in") {
    message = "Check out when your shift ends — your team lead can then generate a timesheet from this shift.";
  } else if (timesheetLink) {
    href = `/timesheets/${timesheetLink.timesheetId}`;
    message = timesheetLink.lineVerified
      ? `Linked to timesheet ${timesheetLink.documentNo} — verified against check-in/out.`
      : `Linked to timesheet ${timesheetLink.documentNo} (${timesheetLink.timesheetStatus}) — ${timesheetLink.verificationMessage}`;
  } else if (readyForTimesheet) {
    href = "/my/timesheets";
    message =
      "Shift verified — your coordinator can generate a timesheet from this shift on Generate timesheets.";
  } else {
    message = "Complete check-in and check-out for timesheet verification.";
  }

  return { checkInStatus, timesheetLink, readyForTimesheet, message, href };
}
