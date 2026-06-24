import type { GenericTableConfig } from "@/components/line-item-table";
import { emptyAgencyTimesheetLine, type AgencyTimesheetLine } from "@/lib/agency-timesheet";

export const agencyTimesheetLineTableConfig: GenericTableConfig<AgencyTimesheetLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "shiftDate", label: "Date", type: "date", className: "w-32" },
    { key: "startTime", label: "Start", type: "text", className: "w-20" },
    { key: "endTime", label: "End", type: "text", className: "w-20" },
    { key: "agencyWorkerId", label: "Agency worker", type: "select", optionsKey: "agencyWorkerId" },
    { key: "clientId", label: "Client", type: "select", optionsKey: "clientId" },
    { key: "locationId", label: "Location", type: "select", optionsKey: "locationId" },
    { key: "hours", label: "Hours", type: "text", className: "w-16" },
    { key: "vendorHourlyRate", label: "Rate ($/hr)", type: "text", className: "w-24" },
    { key: "vendorCost", label: "Cost ($)", type: "text", className: "w-24" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  emptyRow: (lineNo) => emptyAgencyTimesheetLine(lineNo),
  emptyMessage: "No agency shift lines yet. Generate from completed agency roster shifts for this period.",
};
