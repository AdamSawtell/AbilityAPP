import type { GenericTableConfig } from "@/components/line-item-table";
import { emptyTimesheetLine, type TimesheetLine } from "@/lib/timesheet";

export const timesheetLineTableConfig: GenericTableConfig<TimesheetLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "shiftDate", label: "Date", type: "date", className: "w-32" },
    { key: "startTime", label: "Start", type: "text", className: "w-20" },
    { key: "endTime", label: "End", type: "text", className: "w-20" },
    { key: "hours", label: "Hours", type: "text", className: "w-16" },
    { key: "clientId", label: "Client", type: "select", optionsKey: "clientId" },
    { key: "locationId", label: "Location", type: "select", optionsKey: "locationId" },
    { key: "serviceBookingId", label: "Booking", type: "select", optionsKey: "serviceBookingId" },
    { key: "shiftType", label: "Shift type", type: "text", className: "w-28" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  emptyRow: (lineNo) => emptyTimesheetLine(lineNo),
  addLabel: "Add line",
  emptyMessage: "No shift lines yet. Generate timesheets from roster shifts for this pay period.",
};
