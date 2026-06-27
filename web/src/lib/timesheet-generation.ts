import { isLineBillable, isTrainingOrMeetingPurpose, normalizeShiftPurpose } from "@/lib/buddy-shift";
import { shiftDurationHours, type RosterShiftRecord } from "@/lib/roster-shift";
import { assignedWorkerIdsForShift, leavePayWorkerIdsForShift } from "@/lib/roster-session";
import { leavePayNote, leavePayWorkersForShift, type EmployeeLeaveContext } from "@/lib/roster-leave";
import {
  createTimesheet,
  emptyTimesheetLine,
  normalizeTimesheet,
  sumTimesheetLineHours,
  type TimesheetLine,
  type TimesheetRecord,
} from "@/lib/timesheet";
import { isPayrollPeriodClosed, type PayrollPeriodCloseRecord } from "@/lib/payroll-period-close";

const ELIGIBLE_STATUSES = new Set(["Published", "Completed"]);

export type TimesheetGenerationPreviewRow = {
  employeeId: string;
  shiftCount: number;
  totalHours: number;
};

export type TimesheetGenerationPreview = {
  periodStart: string;
  periodEnd: string;
  eligibleShiftCount: number;
  alreadyLinkedCount: number;
  periodClosed: boolean;
  rows: TimesheetGenerationPreviewRow[];
};

export type TimesheetGenerationResult = {
  created: TimesheetRecord[];
  updated: TimesheetRecord[];
  skippedAlreadyLinked: number;
  skippedLockedPeriod: number;
  periodClosed: boolean;
};

function shiftInPeriod(shift: RosterShiftRecord, periodStart: string, periodEnd: string): boolean {
  return shift.shiftDate >= periodStart && shift.shiftDate <= periodEnd;
}

function isEligibleShift(shift: RosterShiftRecord, employeeId?: string): boolean {
  const hasWorker = employeeId ? assignedWorkerIdsForShift(shift).includes(employeeId) : assignedWorkerIdsForShift(shift).length > 0;
  if (isTrainingOrMeetingPurpose(normalizeShiftPurpose(shift.shiftPurpose))) {
    return hasWorker && ELIGIBLE_STATUSES.has(shift.status) && shift.attendanceStatus === "Attended";
  }
  return hasWorker && ELIGIBLE_STATUSES.has(shift.status);
}

function workerShiftKey(employeeId: string, rosterShiftId: string): string {
  return `${employeeId.trim()}::${rosterShiftId.trim()}`;
}

export function linkedRosterShiftIds(timesheets: TimesheetRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const sheet of timesheets) {
    for (const line of sheet.lines) {
      if (line.rosterShiftId?.trim()) ids.add(workerShiftKey(sheet.employeeId, line.rosterShiftId));
    }
  }
  return ids;
}

function lineFromShift(shift: RosterShiftRecord, employeeId: string, lineNo: number): TimesheetLine {
  return {
    ...emptyTimesheetLine(lineNo),
    id: `tsl-${shift.id}-${employeeId}`,
    lineNo,
    rosterShiftId: shift.id,
    clientId: shift.clientId,
    locationId: shift.locationId,
    serviceBookingId: shift.serviceBookingId,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    shiftType: shift.shiftType,
    hours: shiftDurationHours(shift),
    notes: shift.notes,
    shiftPurpose: shift.shiftPurpose,
    billingClassification: shift.billingClassification,
    payStatus: shift.payStatus,
  };
}

function isEligibleLeavePayShift(shift: RosterShiftRecord, employeeId: string): boolean {
  return leavePayWorkerIdsForShift(shift).includes(employeeId) && ELIGIBLE_STATUSES.has(shift.status);
}

function lineFromLeavePayShift(
  shift: RosterShiftRecord,
  employeeId: string,
  lineNo: number,
  leaveType: string
): TimesheetLine {
  return {
    ...emptyTimesheetLine(lineNo),
    id: `tsl-leave-${shift.id}-${employeeId}`,
    lineNo,
    rosterShiftId: shift.id,
    clientId: shift.clientId,
    locationId: shift.locationId,
    serviceBookingId: shift.serviceBookingId,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    shiftType: shift.shiftType,
    hours: shiftDurationHours(shift),
    notes: leavePayNote(leaveType),
    shiftPurpose: shift.shiftPurpose,
    billingClassification: "non_billable_internal_cost",
    payStatus: "payable",
  };
}

type PayrollLineSource = {
  shift: RosterShiftRecord;
  employeeId: string;
  leaveType?: string;
};

function payrollSourcesForShift(
  shift: RosterShiftRecord,
  employees: EmployeeLeaveContext[] = []
): PayrollLineSource[] {
  const sources: PayrollLineSource[] = [];
  for (const employeeId of assignedWorkerIdsForShift(shift)) {
    sources.push({ shift, employeeId });
  }
  for (const ref of leavePayWorkersForShift(shift, employees)) {
    if (assignedWorkerIdsForShift(shift).includes(ref.employeeId)) continue;
    sources.push({ shift, employeeId: ref.employeeId, leaveType: ref.leaveType });
  }
  return sources;
}

function isEligiblePayrollSource(source: PayrollLineSource, employeeId: string): boolean {
  if (source.leaveType) return isEligibleLeavePayShift(source.shift, employeeId);
  return isEligibleShift(source.shift, employeeId);
}

function lineFromPayrollSource(source: PayrollLineSource, employeeId: string, lineNo: number): TimesheetLine {
  if (source.leaveType) return lineFromLeavePayShift(source.shift, employeeId, lineNo, source.leaveType);
  return lineFromShift(source.shift, employeeId, lineNo);
}

export function previewTimesheetGeneration(
  rosterShifts: RosterShiftRecord[],
  timesheets: TimesheetRecord[],
  periodStart: string,
  periodEnd: string,
  closedPeriods: PayrollPeriodCloseRecord[] = [],
  employees: EmployeeLeaveContext[] = []
): TimesheetGenerationPreview {
  const periodClosed = isPayrollPeriodClosed(periodStart, periodEnd, closedPeriods);
  const linked = linkedRosterShiftIds(timesheets);
  const byEmployee = new Map<string, { shiftCount: number; totalHours: number }>();
  let eligibleShiftCount = 0;
  let alreadyLinkedCount = 0;

  for (const shift of rosterShifts) {
    if (!shiftInPeriod(shift, periodStart, periodEnd)) continue;
    for (const source of payrollSourcesForShift(shift, employees)) {
      const employeeId = source.employeeId;
      if (!employeeId || !isEligiblePayrollSource(source, employeeId)) continue;
      if (linked.has(workerShiftKey(employeeId, shift.id))) {
        alreadyLinkedCount += 1;
        continue;
      }
      eligibleShiftCount += 1;
      const hours = shiftDurationHours(shift);
      const row = byEmployee.get(employeeId) ?? { shiftCount: 0, totalHours: 0 };
      row.shiftCount += 1;
      row.totalHours = Math.round((row.totalHours + hours) * 100) / 100;
      byEmployee.set(employeeId, row);
    }
  }

  const rows = [...byEmployee.entries()]
    .map(([employeeId, stats]) => ({ employeeId, ...stats }))
    .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  return { periodStart, periodEnd, eligibleShiftCount, alreadyLinkedCount, periodClosed, rows };
}

function findTimesheetForPeriod(
  timesheets: TimesheetRecord[],
  employeeId: string,
  periodStart: string,
  periodEnd: string
): TimesheetRecord | undefined {
  return timesheets.find(
    (sheet) =>
      sheet.employeeId === employeeId &&
      sheet.periodStart === periodStart &&
      sheet.periodEnd === periodEnd
  );
}

function findDraftTimesheet(
  timesheets: TimesheetRecord[],
  employeeId: string,
  periodStart: string,
  periodEnd: string
): TimesheetRecord | undefined {
  const sheet = findTimesheetForPeriod(timesheets, employeeId, periodStart, periodEnd);
  return sheet?.status === "Draft" ? sheet : undefined;
}

export function generateTimesheetsFromShifts(
  rosterShifts: RosterShiftRecord[],
  timesheets: TimesheetRecord[],
  periodStart: string,
  periodEnd: string,
  actorName = "SuperUser",
  closedPeriods: PayrollPeriodCloseRecord[] = [],
  employees: EmployeeLeaveContext[] = []
): TimesheetGenerationResult {
  if (isPayrollPeriodClosed(periodStart, periodEnd, closedPeriods)) {
    return { created: [], updated: [], skippedAlreadyLinked: 0, skippedLockedPeriod: 0, periodClosed: true };
  }

  const linked = linkedRosterShiftIds(timesheets);
  const sourcesByEmployee = new Map<string, PayrollLineSource[]>();
  let skippedAlreadyLinked = 0;

  for (const shift of rosterShifts) {
    if (!shiftInPeriod(shift, periodStart, periodEnd)) continue;
    for (const source of payrollSourcesForShift(shift, employees)) {
      const employeeId = source.employeeId;
      if (!employeeId || !isEligiblePayrollSource(source, employeeId)) continue;
      if (linked.has(workerShiftKey(employeeId, shift.id))) {
        skippedAlreadyLinked += 1;
        continue;
      }
      const list = sourcesByEmployee.get(employeeId) ?? [];
      list.push(source);
      sourcesByEmployee.set(employeeId, list);
    }
  }

  const created: TimesheetRecord[] = [];
  const updated: TimesheetRecord[] = [];
  let working = [...timesheets];
  let skippedLockedPeriod = 0;

  for (const [employeeId, sources] of sourcesByEmployee) {
    const existingPeriod = findTimesheetForPeriod(working, employeeId, periodStart, periodEnd);
    if (existingPeriod && existingPeriod.status !== "Draft") {
      skippedLockedPeriod += sources.length;
      continue;
    }

    sources.sort((a, b) =>
      `${a.shift.shiftDate}${a.shift.startTime}`.localeCompare(`${b.shift.shiftDate}${b.shift.startTime}`)
    );
    const newLines = sources.map((source, index) => lineFromPayrollSource(source, employeeId, index + 1));

    const existingDraft = findDraftTimesheet(working, employeeId, periodStart, periodEnd);
    if (existingDraft) {
      const startLineNo = existingDraft.lines.length + 1;
      const appended = newLines.map((line, index) => ({ ...line, lineNo: startLineNo + index }));
      const mergedLines = [...existingDraft.lines, ...appended];
      const next = normalizeTimesheet({
        ...existingDraft,
        lines: mergedLines,
        totalHours: sumTimesheetLineHours(mergedLines),
        updatedBy: actorName,
      });
      working = working.map((sheet) => (sheet.id === next.id ? next : sheet));
      updated.push(next);
      continue;
    }

    const next = createTimesheet(
      {
        id: "",
        documentNo: "",
        employeeId,
        periodStart,
        periodEnd,
        status: "Draft",
        totalHours: sumTimesheetLineHours(newLines),
        notes: "",
        lines: newLines,
        createdBy: actorName,
        updatedBy: actorName,
      },
      working
    );
    working = [...working, next];
    created.push(next);
  }

  return { created, updated, skippedAlreadyLinked, skippedLockedPeriod, periodClosed: false };
}
