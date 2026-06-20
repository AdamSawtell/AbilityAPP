/** Worker timesheet — header plus lines generated from roster shifts. */
export type TimesheetLine = {
  id: string;
  lineNo: number;
  rosterShiftId: string;
  clientId: string;
  locationId: string;
  serviceBookingId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  hours: number;
  notes: string;
};

export type TimesheetRecord = {
  id: string;
  documentNo: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalHours: number;
  notes: string;
  payrollExportStatus: string;
  payrollExportedAt: string;
  payrollExportBatchRef: string;
  lines: TimesheetLine[];
  createdBy: string;
  updatedBy: string;
};

export const timesheetDropdowns = {
  status: ["Draft", "Submitted", "Approved"],
  payrollExportStatus: ["Not exported", "Exported", "Processed"],
};

export const initialTimesheets: TimesheetRecord[] = [];

export function emptyTimesheetLine(lineNo: number): TimesheetLine {
  return {
    id: `tsl-${Date.now()}-${lineNo}`,
    lineNo,
    rosterShiftId: "",
    clientId: "",
    locationId: "",
    serviceBookingId: "",
    shiftDate: "",
    startTime: "",
    endTime: "",
    shiftType: "Standard",
    hours: 0,
    notes: "",
  };
}

export function normalizeTimesheet(record: TimesheetRecord): TimesheetRecord {
  const lines = (record.lines ?? []).map((line, index) => ({
    ...line,
    lineNo: line.lineNo || index + 1,
    rosterShiftId: line.rosterShiftId ?? "",
    clientId: line.clientId ?? "",
    locationId: line.locationId ?? "",
    serviceBookingId: line.serviceBookingId ?? "",
    shiftDate: line.shiftDate?.slice(0, 10) ?? "",
    startTime: line.startTime?.slice(0, 5) ?? "",
    endTime: line.endTime?.slice(0, 5) ?? "",
    shiftType: line.shiftType || "Standard",
    hours: Number.isFinite(line.hours) ? line.hours : 0,
    notes: line.notes ?? "",
  }));
  const totalHours =
    record.totalHours > 0
      ? record.totalHours
      : Math.round(lines.reduce((sum, line) => sum + (line.hours || 0), 0) * 100) / 100;
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    employeeId: record.employeeId ?? "",
    periodStart: record.periodStart?.slice(0, 10) ?? "",
    periodEnd: record.periodEnd?.slice(0, 10) ?? "",
    status: record.status || "Draft",
    totalHours,
    notes: record.notes ?? "",
    payrollExportStatus: record.payrollExportStatus || "Not exported",
    payrollExportedAt: record.payrollExportedAt ?? "",
    payrollExportBatchRef: record.payrollExportBatchRef ?? "",
    lines,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createTimesheet(
  partial: Partial<TimesheetRecord>,
  existing: TimesheetRecord[]
): TimesheetRecord {
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `ts-${crypto.randomUUID()}`
      : `ts-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const used = new Set(existing.map((r) => r.documentNo).filter(Boolean));
  let documentNo = partial.documentNo?.trim() || `TS-${50000 + existing.length + 1}`;
  if (used.has(documentNo)) documentNo = `${documentNo}-${existing.length + 1}`;
  return normalizeTimesheet({
    employeeId: "",
    periodStart: "",
    periodEnd: "",
    status: "Draft",
    totalHours: 0,
    notes: "",
    payrollExportStatus: "Not exported",
    payrollExportedAt: "",
    payrollExportBatchRef: "",
    lines: [],
    ...partial,
    id,
    documentNo,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}

export function formatTimesheetPeriod(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };
  if (!start && !end) return "—";
  if (start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

export function sumTimesheetLineHours(lines: TimesheetLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + (line.hours || 0), 0) * 100) / 100;
}
