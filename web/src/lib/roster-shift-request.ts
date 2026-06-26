/** Open shift request workflow — employee interest and rostering decisions. */
import { detectRosterShiftConflicts } from "@/lib/roster-shift-conflicts";
import { isVacantShift, type RosterGap } from "@/lib/roster-gap-analysis";
import {
  normalizeRosterShift,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import {
  rankWorkersForClient,
  staffClientMatchHints,
  type StaffClientMatchHint,
} from "@/lib/roster-staff-client-matching";
import { classifyShiftAvailability } from "@/lib/roster-open-shifts";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import { employeeCapacityForWeek, weeklyCapacityHours } from "@/lib/roster-capacity-planning";
import { weekStartFromDate } from "@/lib/roster-shift";

export type ShiftRequestResponseType = "request" | "available_if_critical" | "decline";

export type ShiftRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "cancelled"
  | "expired";

export type OpenFillStatus = "Open" | "Requested" | "Filled" | "Cancelled";

export type RosterShiftRequestRecord = {
  id: string;
  rosterShiftId: string;
  employeeId: string;
  responseType: ShiftRequestResponseType;
  status: ShiftRequestStatus;
  submittedAt: string;
  decidedAt: string;
  decidedBy: string;
  rejectionReason: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export const shiftRequestStatusLabels: Record<ShiftRequestStatus, string> = {
  requested: "Applied — awaiting rostering",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const shiftRequestResponseLabels: Record<ShiftRequestResponseType, string> = {
  request: "Requested shift",
  available_if_critical: "Available if critical",
  decline: "Declined shift",
};

export function newShiftRequestId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `rsr-${crypto.randomUUID()}`
    : `rsr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeShiftRequest(record: RosterShiftRequestRecord): RosterShiftRequestRecord {
  return {
    ...record,
    responseType: (record.responseType || "request") as ShiftRequestResponseType,
    status: (record.status || "requested") as ShiftRequestStatus,
    submittedAt: record.submittedAt ?? "",
    decidedAt: record.decidedAt ?? "",
    decidedBy: record.decidedBy ?? "",
    rejectionReason: record.rejectionReason ?? "",
    notes: record.notes ?? "",
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function requestsForShift(
  requests: RosterShiftRequestRecord[],
  shiftId: string
): RosterShiftRequestRecord[] {
  return requests
    .filter((r) => r.rosterShiftId === shiftId)
    .map(normalizeShiftRequest)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export function requestsForEmployee(
  requests: RosterShiftRequestRecord[],
  employeeId: string
): RosterShiftRequestRecord[] {
  return requests
    .filter((r) => r.employeeId === employeeId)
    .map(normalizeShiftRequest)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function activeRequestForEmployee(
  requests: RosterShiftRequestRecord[],
  shiftId: string,
  employeeId: string,
  responseType?: ShiftRequestResponseType
): RosterShiftRequestRecord | undefined {
  return requests.find(
    (r) =>
      r.rosterShiftId === shiftId &&
      r.employeeId === employeeId &&
      (responseType ? r.responseType === responseType : true) &&
      (r.status === "requested" || r.status === "approved")
  );
}

export function computeOpenFillStatus(
  shift: RosterShiftRecord,
  requests: RosterShiftRequestRecord[]
): OpenFillStatus {
  const normalized = normalizeRosterShift(shift);
  if (normalized.status === "Cancelled") return "Cancelled";
  if (normalized.employeeId?.trim()) return "Filled";
  const pending = requestsForShift(requests, shift.id).some((r) => r.status === "requested");
  return pending ? "Requested" : "Open";
}

export function syncShiftOpenFillStatus(
  shift: RosterShiftRecord,
  requests: RosterShiftRequestRecord[]
): RosterShiftRecord {
  const openFillStatus = computeOpenFillStatus(shift, requests);
  if (shift.openFillStatus === openFillStatus) return shift;
  return { ...shift, openFillStatus };
}

export type SubmitShiftRequestResult =
  | { ok: true; request: RosterShiftRequestRecord }
  | { ok: false; message: string };

export function buildShiftRequestSubmission(params: {
  shift: RosterShiftRecord;
  employeeId: string;
  responseType: ShiftRequestResponseType;
  actorName: string;
  existing: RosterShiftRequestRecord[];
  allShifts: RosterShiftRecord[];
  notes?: string;
}): SubmitShiftRequestResult {
  const { shift, employeeId, responseType, actorName, existing, allShifts, notes } = params;
  if (!employeeId?.trim()) {
    return { ok: false, message: "Link your user to an employee record before requesting a shift." };
  }
  if (!isVacantShift(shift)) {
    return { ok: false, message: "This shift is no longer open." };
  }

  if (responseType === "request") {
    const preview = normalizeRosterShift({
      ...shift,
      employeeId,
      status: shift.status === "Draft" ? "Published" : shift.status,
    });
    const conflicts = detectRosterShiftConflicts(preview, { existing: allShifts }).map((issue) =>
      issue.severity === "warning" ? { ...issue, severity: "error" as const } : issue
    );
    if (conflicts.some((c) => c.severity === "error")) {
      return {
        ok: false,
        message: conflicts.find((c) => c.severity === "error")?.message ?? "Shift conflicts with your roster.",
      };
    }
  }

  const prior = activeRequestForEmployee(existing, shift.id, employeeId, responseType);
  if (prior?.status === "requested") {
    return { ok: false, message: "You already have a pending response for this shift." };
  }

  const now = new Date().toISOString();
  const request: RosterShiftRequestRecord = normalizeShiftRequest({
    id: newShiftRequestId(),
    rosterShiftId: shift.id,
    employeeId,
    responseType,
    status: responseType === "decline" ? "cancelled" : "requested",
    submittedAt: now,
    decidedAt: "",
    decidedBy: "",
    rejectionReason: "",
    notes: notes?.trim() ?? "",
    createdBy: actorName,
    updatedBy: actorName,
  });

  return { ok: true, request };
}

export type ApproveShiftRequestResult =
  | { ok: true; request: RosterShiftRequestRecord; shift: RosterShiftRecord; otherUpdates: RosterShiftRequestRecord[] }
  | { ok: false; message: string };

export function buildApproveShiftRequest(params: {
  shift: RosterShiftRecord;
  request: RosterShiftRequestRecord;
  allRequests: RosterShiftRequestRecord[];
  allShifts: RosterShiftRecord[];
  actorName: string;
}): ApproveShiftRequestResult {
  const { shift, request, allRequests, allShifts, actorName } = params;
  if (!isVacantShift(shift)) {
    return { ok: false, message: "This shift is no longer vacant." };
  }
  if (request.status !== "requested") {
    return { ok: false, message: "Only pending requests can be approved." };
  }

  const assigned = normalizeRosterShift({
    ...shift,
    employeeId: request.employeeId,
    status: shift.status === "Draft" ? "Published" : shift.status,
    openFillStatus: "Filled",
    updatedBy: actorName,
  });

  const conflicts = detectRosterShiftConflicts(assigned, { existing: allShifts }).map((issue) =>
    issue.severity === "warning" ? { ...issue, severity: "error" as const } : issue
  );
  if (conflicts.some((c) => c.severity === "error")) {
    return {
      ok: false,
      message: conflicts.find((c) => c.severity === "error")?.message ?? "Cannot assign — roster conflict.",
    };
  }

  const now = new Date().toISOString();
  const approvedRequest: RosterShiftRequestRecord = {
    ...request,
    status: "approved",
    decidedAt: now,
    decidedBy: actorName,
    updatedBy: actorName,
  };

  const otherUpdates = requestsForShift(allRequests, shift.id)
    .filter((r) => r.id !== request.id && r.status === "requested")
    .map((r) => ({
      ...r,
      status: "rejected" as ShiftRequestStatus,
      decidedAt: now,
      decidedBy: actorName,
      rejectionReason: r.rejectionReason || "Shift filled by another worker.",
      updatedBy: actorName,
    }));

  return { ok: true, request: approvedRequest, shift: assigned, otherUpdates };
}

export function buildRejectShiftRequest(params: {
  request: RosterShiftRequestRecord;
  actorName: string;
  rejectionReason: string;
}): RosterShiftRequestRecord | { ok: false; message: string } {
  const { request, actorName, rejectionReason } = params;
  if (request.status !== "requested") {
    return { ok: false, message: "Only pending requests can be rejected." };
  }
  const now = new Date().toISOString();
  return {
    ...request,
    status: "rejected",
    decidedAt: now,
    decidedBy: actorName,
    rejectionReason: rejectionReason.trim() || "Not selected for this shift.",
    updatedBy: actorName,
  };
}

export function buildWithdrawShiftRequest(params: {
  request: RosterShiftRequestRecord;
  actorName: string;
}): RosterShiftRequestRecord | { ok: false; message: string } {
  const { request, actorName } = params;
  if (request.status !== "requested") {
    return { ok: false, message: "Only pending requests can be withdrawn." };
  }
  const now = new Date().toISOString();
  return {
    ...request,
    status: "withdrawn",
    decidedAt: now,
    decidedBy: actorName,
    updatedBy: actorName,
  };
}

export type ShiftRequestSuitability = {
  employeeId: string;
  employeeName: string;
  hints: StaffClientMatchHint[];
  availabilityLabel: string;
  remainingHours: number;
  priorRejections: number;
};

export function buildRequestSuitability(params: {
  shift: RosterShiftRecord;
  request: RosterShiftRequestRecord;
  employee: EmployeeRecord | undefined;
  client: ClientRecord | undefined;
  rosterShifts: RosterShiftRecord[];
  allRequests: RosterShiftRequestRecord[];
  availability?: EmployeeAvailabilityRow[];
}): ShiftRequestSuitability {
  const { shift, request, employee, client, rosterShifts, allRequests, availability } = params;
  const weekStart = weekStartFromDate(shift.shiftDate);
  const capacity =
    employee && employee.employmentStatus === "Active"
      ? employeeCapacityForWeek(weekStart, rosterShifts, [employee]).find(
          (row) => row.employeeId === employee.id
        )
      : undefined;
  const availabilityResult = classifyShiftAvailability(shift, availability);
  const priorRejections = allRequests.filter(
    (r) =>
      r.employeeId === request.employeeId &&
      r.rosterShiftId !== shift.id &&
      r.status === "rejected"
  ).length;

  return {
    employeeId: request.employeeId,
    employeeName: employee?.name ?? request.employeeId,
    hints: staffClientMatchHints({
      client,
      employee,
      rosterShifts,
      excludeShiftId: shift.id,
    }),
    availabilityLabel: availabilityResult.message || availabilityResult.status,
    remainingHours: capacity?.remainingHours ?? (employee ? weeklyCapacityHours(employee) : 0),
    priorRejections,
  };
}

export function rankShiftRequestCandidates(params: {
  shift: RosterShiftRecord;
  requests: RosterShiftRequestRecord[];
  employees: EmployeeRecord[];
  clients: ClientRecord[];
  rosterShifts: RosterShiftRecord[];
}): RosterShiftRequestRecord[] {
  const { shift, requests, employees, clients, rosterShifts } = params;
  const client = clients.find((c) => c.id === shift.clientId);
  const pending = requestsForShift(requests, shift.id).filter((r) => r.status === "requested");
  const ranked = client
    ? rankWorkersForClient({ client, employees, rosterShifts, excludeShiftId: shift.id })
    : [];
  const scoreByEmployee = new Map(ranked.map((row) => [row.employeeId, row.score]));

  return [...pending].sort((a, b) => {
    const typeRank = (r: RosterShiftRequestRecord) =>
      r.responseType === "request" ? 0 : r.responseType === "available_if_critical" ? 1 : 2;
    const typeCmp = typeRank(a) - typeRank(b);
    if (typeCmp !== 0) return typeCmp;
    const scoreA = scoreByEmployee.get(a.employeeId) ?? 0;
    const scoreB = scoreByEmployee.get(b.employeeId) ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.submittedAt.localeCompare(b.submittedAt);
  });
}

export type FillBoardFilter =
  | "all"
  | "open_no_requests"
  | "open_with_requests"
  | "critical_fill"
  | "awaiting_decision"
  | "filled";

export function filterVacanciesByFillBoardFilter(
  shifts: RosterShiftRecord[],
  requests: RosterShiftRequestRecord[],
  filter: FillBoardFilter
): RosterShiftRecord[] {
  const vacant = shifts.filter((s) => isVacantShift(s));
  if (filter === "all") return vacant;
  if (filter === "filled") return shifts.filter((s) => Boolean(s.employeeId?.trim()));
  if (filter === "critical_fill") return vacant.filter((s) => s.criticalFill);

  return vacant.filter((shift) => {
    const shiftRequests = requestsForShift(requests, shift.id);
    const pending = shiftRequests.some((r) => r.status === "requested");
    if (filter === "open_no_requests") return !pending;
    if (filter === "open_with_requests") return pending;
    if (filter === "awaiting_decision") return pending;
    return true;
  });
}

export function vacantShiftGap(shift: RosterShiftRecord): RosterGap {
  return {
    code: "VACANT_SHIFT",
    severity: shift.criticalFill || shift.status === "Published" ? "error" : "warning",
    message: shift.criticalFill
      ? `Critical fill — vacant shift on ${shift.shiftDate}.`
      : shift.status === "Published"
        ? `Published shift on ${shift.shiftDate} has no worker assigned.`
        : `Vacant shift on ${shift.shiftDate} — assign a worker before publishing.`,
    clientId: shift.clientId,
    shiftId: shift.id,
    shiftDate: shift.shiftDate,
    weekStart: weekStartFromDate(shift.shiftDate),
    serviceBookingId: shift.serviceBookingId || undefined,
  };
}
