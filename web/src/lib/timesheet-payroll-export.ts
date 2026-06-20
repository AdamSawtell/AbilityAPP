import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import { rowsToCsv } from "@/lib/reports/export";
import type { ReportColumnDef } from "@/lib/reports/types";
import type { TimesheetLine, TimesheetRecord } from "@/lib/timesheet";
import { normalizeTimesheet } from "@/lib/timesheet";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { verifyTimesheet } from "@/lib/timesheet-verification";

export const PAYROLL_EXPORT_STATUSES = ["Not exported", "Exported", "Processed"] as const;
export type PayrollExportStatus = (typeof PAYROLL_EXPORT_STATUSES)[number];

export type PayrollExportRow = Record<string, string>;

export const payrollExportColumns: ReportColumnDef[] = [
  { id: "employeeNumber", label: "Employee number" },
  { id: "employeeName", label: "Employee name" },
  { id: "timesheetDocument", label: "Timesheet document" },
  { id: "payPeriodStart", label: "Pay period start" },
  { id: "payPeriodEnd", label: "Pay period end" },
  { id: "workDate", label: "Work date" },
  { id: "startTime", label: "Start time" },
  { id: "endTime", label: "End time" },
  { id: "hours", label: "Hours" },
  { id: "clientCode", label: "Client code" },
  { id: "locationCode", label: "Location code" },
  { id: "shiftType", label: "Shift type" },
  { id: "costCentre", label: "Cost centre" },
  { id: "lineNotes", label: "Line notes" },
  { id: "exportBatchRef", label: "Export batch ref" },
];

export function buildPayrollExportBatchRef(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
  return `PAY-${stamp}`;
}

export function payrollExportFilename(batchRef: string): string {
  return `${batchRef.toLowerCase()}-timesheets.csv`;
}

export function canExportTimesheetToPayroll(
  sheet: TimesheetRecord,
  rosterShifts: RosterShiftRecord[] = [],
  locations: Pick<LocationRecord, "id" | "latitude" | "longitude" | "geofenceRadiusM" | "name">[] = []
): { ok: true } | { ok: false; message: string } {
  if (sheet.status !== "Approved") {
    return { ok: false, message: `${sheet.documentNo} must be Approved before payroll export.` };
  }
  if (!sheet.employeeId?.trim()) {
    return { ok: false, message: `${sheet.documentNo} has no worker assigned.` };
  }
  if (!sheet.lines.length) {
    return { ok: false, message: `${sheet.documentNo} has no shift lines to export.` };
  }
  const blockReason = verifyTimesheet(sheet, rosterShifts, locations).blockReason;
  if (blockReason) {
    return { ok: false, message: `${sheet.documentNo}: ${blockReason}` };
  }
  return { ok: true };
}

export function payrollExportBlockReason(
  sheets: TimesheetRecord[],
  rosterShifts: RosterShiftRecord[] = [],
  locations: Pick<LocationRecord, "id" | "latitude" | "longitude" | "geofenceRadiusM" | "name">[] = []
): string | null {
  for (const sheet of sheets) {
    const gate = canExportTimesheetToPayroll(sheet, rosterShifts, locations);
    if (!gate.ok) return gate.message;
  }
  if (!sheets.length) return "Select at least one timesheet to export.";
  return null;
}

function lineToPayrollRow(
  sheet: TimesheetRecord,
  line: TimesheetLine,
  employee: EmployeeRecord | undefined,
  client: ClientRecord | undefined,
  location: LocationRecord | undefined,
  batchRef: string
): PayrollExportRow {
  return {
    employeeNumber: employee?.employeeNumber?.trim() || employee?.searchKey?.trim() || sheet.employeeId,
    employeeName: employee?.name?.trim() || "",
    timesheetDocument: sheet.documentNo,
    payPeriodStart: sheet.periodStart,
    payPeriodEnd: sheet.periodEnd,
    workDate: line.shiftDate,
    startTime: line.startTime,
    endTime: line.endTime,
    hours: (line.hours ?? 0).toFixed(2),
    clientCode: client?.searchKey?.trim() || line.clientId,
    locationCode: location?.searchKey?.trim() || line.locationId,
    shiftType: line.shiftType || "Standard",
    costCentre: employee?.costCentre?.trim() || "",
    lineNotes: line.notes?.trim() || sheet.notes?.trim() || "",
    exportBatchRef: batchRef,
  };
}

export function buildPayrollExportRows(
  sheets: TimesheetRecord[],
  employees: EmployeeRecord[],
  clients: ClientRecord[],
  locations: LocationRecord[],
  batchRef: string
): PayrollExportRow[] {
  const employeeById = new Map(employees.map((e) => [e.id, e]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const locationById = new Map(locations.map((l) => [l.id, l]));
  const rows: PayrollExportRow[] = [];

  for (const sheet of sheets) {
    const employee = employeeById.get(sheet.employeeId);
    for (const line of sheet.lines) {
      rows.push(
        lineToPayrollRow(
          sheet,
          line,
          employee,
          clientById.get(line.clientId),
          locationById.get(line.locationId),
          batchRef
        )
      );
    }
  }

  return rows.sort((a, b) =>
    `${a.employeeNumber}${a.workDate}${a.startTime}`.localeCompare(
      `${b.employeeNumber}${b.workDate}${b.startTime}`
    )
  );
}

export function buildPayrollExportCsv(rows: PayrollExportRow[]): string {
  return rowsToCsv(rows, payrollExportColumns);
}

export function markTimesheetsPayrollExported(
  sheets: TimesheetRecord[],
  batchRef: string,
  updatedBy: string,
  now = new Date()
): TimesheetRecord[] {
  const exportedAt = now.toISOString();
  return sheets.map((sheet) =>
    normalizeTimesheet({
      ...sheet,
      payrollExportStatus: "Exported",
      payrollExportedAt: exportedAt,
      payrollExportBatchRef: batchRef,
      updatedBy,
    })
  );
}

export type PayrollExportResult =
  | {
      ok: true;
      csv: string;
      filename: string;
      batchRef: string;
      rowCount: number;
      updatedTimesheets: TimesheetRecord[];
    }
  | { ok: false; message: string };

export function preparePayrollExport(
  sheets: TimesheetRecord[],
  employees: EmployeeRecord[],
  clients: ClientRecord[],
  locations: LocationRecord[],
  updatedBy: string,
  rosterShifts: RosterShiftRecord[] = [],
  now = new Date()
): PayrollExportResult {
  const block = payrollExportBlockReason(sheets, rosterShifts, locations);
  if (block) return { ok: false, message: block };

  const batchRef = buildPayrollExportBatchRef(now);
  const rows = buildPayrollExportRows(sheets, employees, clients, locations, batchRef);
  const csv = buildPayrollExportCsv(rows);
  const updatedTimesheets = markTimesheetsPayrollExported(sheets, batchRef, updatedBy, now);

  return {
    ok: true,
    csv,
    filename: payrollExportFilename(batchRef),
    batchRef,
    rowCount: rows.length,
    updatedTimesheets,
  };
}

export function payrollExportStatusClass(status: string): string {
  switch (status) {
    case "Exported":
      return "bg-sky-100 text-sky-950";
    case "Processed":
      return "bg-emerald-100 text-emerald-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function formatPayrollExportedAt(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
