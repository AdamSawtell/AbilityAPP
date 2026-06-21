import type { EmployeeRecord } from "@/lib/employee";
import type { TimesheetRecord } from "@/lib/timesheet";

export type TimesheetAutomationEvent = {
  type: "timesheet.submitted";
  timesheet: TimesheetRecord;
  employee: EmployeeRecord;
};

export function timesheetSubmittedEvent(
  timesheet: TimesheetRecord,
  employee: EmployeeRecord
): TimesheetAutomationEvent {
  return { type: "timesheet.submitted", timesheet, employee };
}

export function timesheetEventsFromSave(
  timesheet: TimesheetRecord,
  before: TimesheetRecord | undefined,
  employee: EmployeeRecord | undefined
): TimesheetAutomationEvent[] {
  if (!before || before.status === timesheet.status) return [];
  if (timesheet.status !== "Submitted") return [];
  if (!employee) return [];
  return [timesheetSubmittedEvent(timesheet, employee)];
}
