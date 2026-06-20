import { shiftDurationHours, type RosterShiftRecord } from "@/lib/roster-shift";
import {
  createTimesheet,
  emptyTimesheetLine,
  normalizeTimesheet,
  sumTimesheetLineHours,
  type TimesheetLine,
  type TimesheetRecord,
} from "@/lib/timesheet";

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
  rows: TimesheetGenerationPreviewRow[];
};

export type TimesheetGenerationResult = {
  created: TimesheetRecord[];
  updated: TimesheetRecord[];
  skippedAlreadyLinked: number;
};

function shiftInPeriod(shift: RosterShiftRecord, periodStart: string, periodEnd: string): boolean {
  return shift.shiftDate >= periodStart && shift.shiftDate <= periodEnd;
}

function isEligibleShift(shift: RosterShiftRecord): boolean {
  return Boolean(shift.employeeId?.trim()) && ELIGIBLE_STATUSES.has(shift.status);
}

export function linkedRosterShiftIds(timesheets: TimesheetRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const sheet of timesheets) {
    for (const line of sheet.lines) {
      if (line.rosterShiftId?.trim()) ids.add(line.rosterShiftId);
    }
  }
  return ids;
}

function lineFromShift(shift: RosterShiftRecord, lineNo: number): TimesheetLine {
  return {
    ...emptyTimesheetLine(lineNo),
    id: `tsl-${shift.id}`,
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
  };
}

export function previewTimesheetGeneration(
  rosterShifts: RosterShiftRecord[],
  timesheets: TimesheetRecord[],
  periodStart: string,
  periodEnd: string
): TimesheetGenerationPreview {
  const linked = linkedRosterShiftIds(timesheets);
  const byEmployee = new Map<string, { shiftCount: number; totalHours: number }>();
  let eligibleShiftCount = 0;
  let alreadyLinkedCount = 0;

  for (const shift of rosterShifts) {
    if (!shiftInPeriod(shift, periodStart, periodEnd)) continue;
    if (!isEligibleShift(shift)) continue;
    if (linked.has(shift.id)) {
      alreadyLinkedCount += 1;
      continue;
    }
    eligibleShiftCount += 1;
    const hours = shiftDurationHours(shift);
    const row = byEmployee.get(shift.employeeId) ?? { shiftCount: 0, totalHours: 0 };
    row.shiftCount += 1;
    row.totalHours = Math.round((row.totalHours + hours) * 100) / 100;
    byEmployee.set(shift.employeeId, row);
  }

  const rows = [...byEmployee.entries()]
    .map(([employeeId, stats]) => ({ employeeId, ...stats }))
    .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  return { periodStart, periodEnd, eligibleShiftCount, alreadyLinkedCount, rows };
}

function findDraftTimesheet(
  timesheets: TimesheetRecord[],
  employeeId: string,
  periodStart: string,
  periodEnd: string
): TimesheetRecord | undefined {
  return timesheets.find(
    (sheet) =>
      sheet.employeeId === employeeId &&
      sheet.periodStart === periodStart &&
      sheet.periodEnd === periodEnd &&
      sheet.status === "Draft"
  );
}

export function generateTimesheetsFromShifts(
  rosterShifts: RosterShiftRecord[],
  timesheets: TimesheetRecord[],
  periodStart: string,
  periodEnd: string,
  actorName = "SuperUser"
): TimesheetGenerationResult {
  const linked = linkedRosterShiftIds(timesheets);
  const shiftsByEmployee = new Map<string, RosterShiftRecord[]>();
  let skippedAlreadyLinked = 0;

  for (const shift of rosterShifts) {
    if (!shiftInPeriod(shift, periodStart, periodEnd)) continue;
    if (!isEligibleShift(shift)) continue;
    if (linked.has(shift.id)) {
      skippedAlreadyLinked += 1;
      continue;
    }
    const list = shiftsByEmployee.get(shift.employeeId) ?? [];
    list.push(shift);
    shiftsByEmployee.set(shift.employeeId, list);
  }

  const created: TimesheetRecord[] = [];
  const updated: TimesheetRecord[] = [];
  let working = [...timesheets];

  for (const [employeeId, shifts] of shiftsByEmployee) {
    shifts.sort((a, b) =>
      `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`)
    );
    const newLines = shifts.map((shift, index) => lineFromShift(shift, index + 1));

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

  return { created, updated, skippedAlreadyLinked };
}
