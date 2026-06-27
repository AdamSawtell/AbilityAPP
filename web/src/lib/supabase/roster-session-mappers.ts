import type {
  RosterShiftClientLine,
  RosterShiftWorkerLine,
} from "@/lib/roster-session";
import {
  normalizeRosterShiftClientLine,
  normalizeRosterShiftWorkerLine,
} from "@/lib/roster-session";

export type RosterShiftClientLineRow = {
  id: string;
  roster_shift_id: string;
  line_no: number;
  client_id: string | null;
  service_booking_id: string | null;
  service_agreement_line_id: string | null;
  support_ratio: string;
  billable_hours: number | null;
  notes: string;
};

export type RosterShiftWorkerLineRow = {
  id: string;
  roster_shift_id: string;
  line_no: number;
  employee_id: string | null;
  role_required: string;
  status: string;
  coverage_role: string;
  leave_request_id: string | null;
  notes: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
};

export function rosterShiftClientLineFromRow(row: RosterShiftClientLineRow): RosterShiftClientLine {
  return normalizeRosterShiftClientLine({
    id: row.id,
    lineNo: row.line_no,
    clientId: row.client_id ?? "",
    serviceBookingId: row.service_booking_id ?? "",
    serviceAgreementLineId: row.service_agreement_line_id ?? "",
    supportRatio: row.support_ratio || "1:1",
    billableHours: row.billable_hours == null ? "" : Number(row.billable_hours),
    notes: row.notes ?? "",
  });
}

export function rosterShiftClientLineToRow(
  rosterShiftId: string,
  line: RosterShiftClientLine
): RosterShiftClientLineRow {
  const normalized = normalizeRosterShiftClientLine(line);
  return {
    id: normalized.id,
    roster_shift_id: rosterShiftId,
    line_no: normalized.lineNo,
    client_id: normalized.clientId?.trim() ? normalized.clientId : null,
    service_booking_id: normalized.serviceBookingId?.trim() ? normalized.serviceBookingId : null,
    service_agreement_line_id: normalized.serviceAgreementLineId?.trim()
      ? normalized.serviceAgreementLineId
      : null,
    support_ratio: String(normalized.supportRatio || "1:1"),
    billable_hours: normalized.billableHours === "" ? null : Number(normalized.billableHours),
    notes: normalized.notes ?? "",
  };
}

export function rosterShiftWorkerLineFromRow(row: RosterShiftWorkerLineRow): RosterShiftWorkerLine {
  return normalizeRosterShiftWorkerLine({
    id: row.id,
    lineNo: row.line_no,
    employeeId: row.employee_id ?? "",
    roleRequired: row.role_required ?? "",
    status: (row.status as RosterShiftWorkerLine["status"]) || "required",
    coverageRole: row.coverage_role ?? "fill",
    leaveRequestId: row.leave_request_id ?? "",
    notes: row.notes ?? "",
    checkedInAt: row.checked_in_at ?? "",
    checkedOutAt: row.checked_out_at ?? "",
  });
}

export function rosterShiftWorkerLineToRow(
  rosterShiftId: string,
  line: RosterShiftWorkerLine
): RosterShiftWorkerLineRow {
  const normalized = normalizeRosterShiftWorkerLine(line);
  return {
    id: normalized.id,
    roster_shift_id: rosterShiftId,
    line_no: normalized.lineNo,
    employee_id: normalized.employeeId?.trim() ? normalized.employeeId : null,
    role_required: normalized.roleRequired ?? "",
    status: normalized.status,
    coverage_role: normalized.coverageRole ?? "fill",
    leave_request_id: normalized.leaveRequestId?.trim() ? normalized.leaveRequestId : null,
    notes: normalized.notes ?? "",
    checked_in_at: normalized.checkedInAt?.trim() ? normalized.checkedInAt : null,
    checked_out_at: normalized.checkedOutAt?.trim() ? normalized.checkedOutAt : null,
  };
}
