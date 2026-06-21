import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { LocationRecord } from "@/lib/location";
import type { TimesheetRecord } from "@/lib/timesheet";
import { timesheetApprovalBlocked, verifyTimesheet } from "@/lib/timesheet-verification";

export function timesheetSubmitBlocked(sheet: TimesheetRecord): string | null {
  if (sheet.status !== "Draft") {
    return "Only draft timesheets can be submitted.";
  }
  if (!sheet.lines.length) {
    return "Add at least one shift line before submitting.";
  }
  return null;
}

export function timesheetApproveBlocked(
  sheet: TimesheetRecord,
  rosterShifts: RosterShiftRecord[],
  nextStatus: string,
  previousStatus?: string,
  locations: Pick<LocationRecord, "id" | "latitude" | "longitude" | "geofenceRadiusM" | "name">[] = []
): string | null {
  if (nextStatus !== "Approved") return null;
  if (previousStatus === "Approved") return null;
  if (previousStatus === "Draft" || (!previousStatus && sheet.status === "Draft")) {
    return "Submit the timesheet for supervisor review before approval.";
  }
  if (previousStatus !== "Submitted" && sheet.status !== "Submitted") {
    return "Timesheet must be in Submitted status before approval.";
  }
  return timesheetApprovalBlocked(sheet, rosterShifts, nextStatus, previousStatus, locations);
}

export function timesheetRevertToDraftBlocked(sheet: TimesheetRecord, nextStatus: string): string | null {
  if (nextStatus !== "Draft") return null;
  if (sheet.status === "Approved") {
    return "Approved timesheets cannot be returned to draft — contact payroll if a correction is needed.";
  }
  return null;
}

export function timesheetWorkflowSummary(
  sheet: TimesheetRecord,
  rosterShifts: RosterShiftRecord[],
  locations: Pick<LocationRecord, "id" | "latitude" | "longitude" | "geofenceRadiusM" | "name">[] = []
): { canSubmit: boolean; canApprove: boolean; submitBlock: string | null; approveBlock: string | null } {
  const verification = verifyTimesheet(sheet, rosterShifts, locations);
  const submitBlock = timesheetSubmitBlocked(sheet);
  const approveBlock = timesheetApproveBlocked(sheet, rosterShifts, "Approved", sheet.status, locations);
  return {
    canSubmit: !submitBlock,
    canApprove: sheet.status === "Submitted" && !approveBlock && verification.canApprove,
    submitBlock,
    approveBlock,
  };
}
