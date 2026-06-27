import type { EmployeeLeaveRequestRow, EmployeeRecord } from "@/lib/employee";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import {
  emptyRosterShiftWorkerLine,
  isFillWorkerLine,
  isLeavePayWorkerLine,
  normalizeRosterShiftWorkerLine,
  syncShiftHeaderFromSessionLines,
  type RosterShiftWorkerLine,
  type WorkerCoverageRole,
} from "@/lib/roster-session";

export type { WorkerCoverageRole };

export const LEAVE_PAYABLE_STATUSES = new Set(["Approved", "Taken"]);

export function normalizeWorkerCoverageRole(value: unknown): WorkerCoverageRole {
  return value === "leave_pay" ? "leave_pay" : "fill";
}

export function isLeaveActiveOnDate(request: EmployeeLeaveRequestRow, date: string): boolean {
  if (!LEAVE_PAYABLE_STATUSES.has(request.status)) return false;
  const day = date.slice(0, 10);
  if (!request.startDate?.trim() || !request.endDate?.trim()) return false;
  return request.startDate.slice(0, 10) <= day && request.endDate.slice(0, 10) >= day;
}

export type EmployeeLeaveContext = {
  id: string;
  leaveRequests: EmployeeLeaveRequestRow[];
};

export function findActiveLeaveForEmployee(
  employee: Pick<EmployeeLeaveContext, "leaveRequests">,
  date: string
): EmployeeLeaveRequestRow | undefined {
  return employee.leaveRequests.find((request) => isLeaveActiveOnDate(request, date));
}

export function findEmployeeById(
  employees: EmployeeLeaveContext[],
  employeeId: string
): EmployeeLeaveContext | undefined {
  const id = employeeId.trim();
  if (!id) return undefined;
  return employees.find((employee) => employee.id === id);
}

function newWorkerLineId(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function leavePayNote(leaveType: string): string {
  return `Leave pay — planned roster (${leaveType.trim() || "Leave"})`;
}

/** Split a template worker into a vacant fill slot plus a leave-pay line. */
export function workerLinesForLeaveCoverage(input: {
  employeeId: string;
  roleRequired: string;
  shiftDate: string;
  leaveRequest: EmployeeLeaveRequestRow;
  existingLineId?: string;
  lineNo: number;
}): { fillLine: RosterShiftWorkerLine; leavePayLine: RosterShiftWorkerLine } {
  const fillLine = normalizeRosterShiftWorkerLine({
    ...emptyRosterShiftWorkerLine(input.lineNo),
    id: input.existingLineId ?? newWorkerLineId("rswl-fill"),
    employeeId: "",
    roleRequired: input.roleRequired,
    status: "required",
    coverageRole: "fill",
    notes: "",
  });

  const leavePayLine = normalizeRosterShiftWorkerLine({
    ...emptyRosterShiftWorkerLine(input.lineNo + 1),
    id: newWorkerLineId("rswl-leave"),
    employeeId: input.employeeId,
    roleRequired: input.roleRequired,
    status: "absent",
    coverageRole: "leave_pay",
    leaveRequestId: input.leaveRequest.id,
    notes: leavePayNote(input.leaveRequest.leaveType),
  });

  return { fillLine, leavePayLine };
}

export function applyLeaveToWorkerLine(
  line: RosterShiftWorkerLine,
  employees: EmployeeLeaveContext[],
  shiftDate: string
): { lines: RosterShiftWorkerLine[]; applied: boolean } {
  const normalized = normalizeRosterShiftWorkerLine(line);
  if (isLeavePayWorkerLine(normalized)) return { lines: [normalized], applied: false };
  const employeeId = normalized.employeeId.trim();
  if (!employeeId) return { lines: [normalized], applied: false };

  const employee = findEmployeeById(employees, employeeId);
  if (!employee) return { lines: [normalized], applied: false };

  const leaveRequest = findActiveLeaveForEmployee(employee, shiftDate);
  if (!leaveRequest) return { lines: [normalized], applied: false };

  const split = workerLinesForLeaveCoverage({
    employeeId,
    roleRequired: normalized.roleRequired,
    shiftDate,
    leaveRequest,
    existingLineId: normalized.id,
    lineNo: normalized.lineNo,
  });
  return { lines: [split.fillLine, split.leavePayLine], applied: true };
}

export function applyLeaveToWorkerLines(
  workerLines: RosterShiftWorkerLine[],
  employees: EmployeeLeaveContext[],
  shiftDate: string
): { workerLines: RosterShiftWorkerLine[]; leaveAppliedCount: number } {
  const next: RosterShiftWorkerLine[] = [];
  let leaveAppliedCount = 0;

  for (const line of workerLines.map(normalizeRosterShiftWorkerLine)) {
    const result = applyLeaveToWorkerLine(line, employees, shiftDate);
    next.push(...result.lines);
    if (result.applied) leaveAppliedCount += 1;
  }

  return {
    workerLines: next.map((line, index) => ({ ...line, lineNo: index + 1 })),
    leaveAppliedCount,
  };
}

function shiftHasFillAttendance(shift: RosterShiftRecord, employeeId: string): boolean {
  const id = employeeId.trim();
  for (const line of shift.workerLines ?? []) {
    if (line.employeeId.trim() !== id || isLeavePayWorkerLine(line)) continue;
    if (line.checkedInAt?.trim() || line.checkedOutAt?.trim()) return true;
  }
  return shift.employeeId.trim() === id && Boolean(shift.checkedInAt?.trim() || shift.checkedOutAt?.trim());
}

function upsertLeavePayLine(
  workerLines: RosterShiftWorkerLine[],
  employeeId: string,
  roleRequired: string,
  leaveRequest: EmployeeLeaveRequestRow
): RosterShiftWorkerLine[] {
  const existing = workerLines.find(
    (line) => line.employeeId.trim() === employeeId && isLeavePayWorkerLine(line)
  );
  if (existing) {
    return workerLines.map((line) =>
      line.id === existing.id
        ? normalizeRosterShiftWorkerLine({
            ...line,
            status: "absent",
            leaveRequestId: leaveRequest.id,
            notes: leavePayNote(leaveRequest.leaveType),
          })
        : line
    );
  }

  const split = workerLinesForLeaveCoverage({
    employeeId,
    roleRequired,
    shiftDate: leaveRequest.startDate,
    leaveRequest,
    lineNo: workerLines.length + 1,
  });
  return [...workerLines, split.leavePayLine].map((line, index) => ({ ...line, lineNo: index + 1 }));
}

function vacateFillAssignment(
  workerLines: RosterShiftWorkerLine[],
  employeeId: string
): RosterShiftWorkerLine[] {
  const id = employeeId.trim();
  let vacated = false;
  const next = workerLines.map((line) => {
    if (vacated || isLeavePayWorkerLine(line) || line.employeeId.trim() !== id) return line;
    vacated = true;
    return normalizeRosterShiftWorkerLine({
      ...line,
      employeeId: "",
      status: "required",
      coverageRole: "fill",
      leaveRequestId: "",
      notes: "",
    });
  });

  if (vacated) return next;

  const vacant = next.find((line) => isFillWorkerLine(line) && !line.employeeId.trim());
  if (vacant) return next;

  return [
    ...next,
    normalizeRosterShiftWorkerLine({
      ...emptyRosterShiftWorkerLine(next.length + 1),
      id: newWorkerLineId("rswl-fill"),
      roleRequired: "",
      status: "required",
      coverageRole: "fill",
    }),
  ].map((line, index) => ({ ...line, lineNo: index + 1 }));
}

/** Release rolled shifts when leave is approved after rollover (partial fortnights included). */
export function releaseShiftsForApprovedLeave(
  shifts: RosterShiftRecord[],
  employee: EmployeeRecord,
  leaveRequest: EmployeeLeaveRequestRow,
  actor: string
): { shifts: RosterShiftRecord[]; releasedCount: number; skippedAttendance: number } {
  const employeeId = employee.id.trim();
  const start = leaveRequest.startDate.slice(0, 10);
  const end = leaveRequest.endDate.slice(0, 10);
  let releasedCount = 0;
  let skippedAttendance = 0;

  const updated = shifts.map((raw) => {
    const shift = normalizeRosterShift(raw);
    if (shift.status === "Cancelled") return shift;
    if (shift.shiftDate < start || shift.shiftDate > end) return shift;

    const onFillLine = (shift.workerLines ?? []).some(
      (line) => isFillWorkerLine(line) && line.employeeId.trim() === employeeId
    );
    const onHeader = shift.employeeId.trim() === employeeId;
    if (!onFillLine && !onHeader) return shift;

    if (shiftHasFillAttendance(shift, employeeId)) {
      skippedAttendance += 1;
      return shift;
    }

    let workerLines = [...(shift.workerLines ?? [])].map(normalizeRosterShiftWorkerLine);
    if (!workerLines.length && onHeader) {
      workerLines = [
        normalizeRosterShiftWorkerLine({
          ...emptyRosterShiftWorkerLine(1),
          id: newWorkerLineId("rswl"),
          employeeId,
          status: "assigned",
        }),
      ];
    }

    const roleRequired =
      workerLines.find((line) => line.employeeId.trim() === employeeId)?.roleRequired ?? "";
    workerLines = vacateFillAssignment(workerLines, employeeId);
    workerLines = upsertLeavePayLine(workerLines, employeeId, roleRequired, leaveRequest);
    releasedCount += 1;

    return normalizeRosterShift(
      syncShiftHeaderFromSessionLines({
        ...shift,
        workerLines,
        openFillStatus: shift.openFillStatus || "available",
        updatedBy: actor,
      })
    );
  });

  return { shifts: updated, releasedCount, skippedAttendance };
}

export type LeavePayWorkerRef = {
  employeeId: string;
  leaveRequestId: string;
  leaveType: string;
};

export function leavePayWorkersForShift(
  shift: RosterShiftRecord,
  employees: EmployeeLeaveContext[] = []
): LeavePayWorkerRef[] {
  const refs: LeavePayWorkerRef[] = [];
  for (const line of shift.workerLines ?? []) {
    if (!isLeavePayWorkerLine(line)) continue;
    const employeeId = line.employeeId.trim();
    if (!employeeId) continue;
    const employee = findEmployeeById(employees, employeeId);
    const leaveRequest =
      employee?.leaveRequests.find((row) => row.id === line.leaveRequestId) ??
      employee?.leaveRequests.find((row) => isLeaveActiveOnDate(row, shift.shiftDate));
    refs.push({
      employeeId,
      leaveRequestId: line.leaveRequestId?.trim() || leaveRequest?.id || "",
      leaveType: leaveRequest?.leaveType || line.notes.replace(/^Leave pay — planned roster \(/, "").replace(/\)$/, "") || "Leave",
    });
  }
  return refs;
}
