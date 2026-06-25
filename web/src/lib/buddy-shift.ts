import type { OrganizationRecord } from "@/lib/organization";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { TimesheetLine } from "@/lib/timesheet";

export type BuddyShiftPayPolicy = "always_pay" | "dont_pay" | "ask";

export type ShiftPurpose =
  | "service_delivery"
  | "buddy_shadow"
  | "orientation_training"
  | "training_session"
  | "staff_meeting";

export type BillingClassification = "billable" | "non_billable_internal_cost" | "admin_costed";

export type ShiftPayStatus = "payable" | "non_payable";

export const BUDDY_SHIFT_PAY_POLICIES: { value: BuddyShiftPayPolicy; label: string; hint: string }[] = [
  {
    value: "always_pay",
    label: "Always pay",
    hint: "Buddy shifts are payable on timesheets and payroll export.",
  },
  {
    value: "dont_pay",
    label: "Don't pay",
    hint: "Buddy shifts appear on timesheets as non-payable with no payroll export.",
  },
  {
    value: "ask",
    label: "Ask when booking",
    hint: "The roster booker must choose paid or non-payable for each buddy shift.",
  },
];

export const SHIFT_PURPOSE_OPTIONS: { value: ShiftPurpose; label: string }[] = [
  { value: "service_delivery", label: "Service delivery" },
  { value: "buddy_shadow", label: "Buddy / shadow" },
  { value: "orientation_training", label: "Orientation / training" },
  { value: "training_session", label: "Training session" },
  { value: "staff_meeting", label: "Staff meeting" },
];

export const BILLING_CLASSIFICATION_OPTIONS: { value: BillingClassification; label: string }[] = [
  { value: "billable", label: "Billable to participant" },
  { value: "non_billable_internal_cost", label: "Non-billable internal cost" },
  { value: "admin_costed", label: "Admin-costed" },
];

export const SHIFT_PAY_STATUS_OPTIONS: { value: ShiftPayStatus; label: string }[] = [
  { value: "payable", label: "Paid shift" },
  { value: "non_payable", label: "Non-payable" },
];

export function normalizeBuddyShiftPayPolicy(value: unknown): BuddyShiftPayPolicy {
  if (value === "always_pay" || value === "dont_pay" || value === "ask") return value;
  return "ask";
}

export function normalizeShiftPurpose(value: unknown): ShiftPurpose {
  if (
    value === "buddy_shadow" ||
    value === "orientation_training" ||
    value === "training_session" ||
    value === "staff_meeting"
  ) {
    return value;
  }
  return "service_delivery";
}

export function normalizeBillingClassification(value: unknown): BillingClassification {
  if (value === "non_billable_internal_cost" || value === "admin_costed") return value;
  return "billable";
}

export function normalizeShiftPayStatus(value: unknown): ShiftPayStatus {
  return value === "non_payable" ? "non_payable" : "payable";
}

export function isBuddyShiftPurpose(purpose: ShiftPurpose): boolean {
  return purpose === "buddy_shadow" || purpose === "orientation_training";
}

export function isTrainingOrMeetingPurpose(purpose: ShiftPurpose): boolean {
  return purpose === "training_session" || purpose === "staff_meeting";
}

export function isBuddyShift(shift: Pick<RosterShiftRecord, "shiftPurpose">): boolean {
  return isBuddyShiftPurpose(normalizeShiftPurpose(shift.shiftPurpose));
}

export function isShiftBillable(
  shift: Pick<RosterShiftRecord, "billingClassification">
): boolean {
  return normalizeBillingClassification(shift.billingClassification) === "billable";
}

export function isShiftPayable(shift: Pick<RosterShiftRecord, "payStatus">): boolean {
  return normalizeShiftPayStatus(shift.payStatus) === "payable";
}

export function isLineBillable(line: Pick<TimesheetLine, "billingClassification">): boolean {
  return normalizeBillingClassification(line.billingClassification) === "billable";
}

export function isLinePayable(line: Pick<TimesheetLine, "payStatus">): boolean {
  return normalizeShiftPayStatus(line.payStatus) === "payable";
}

export function buddyPayStatusRequiresBookerChoice(policy: BuddyShiftPayPolicy): boolean {
  return policy === "ask";
}

export function defaultBuddyPayStatusForPolicy(policy: BuddyShiftPayPolicy): ShiftPayStatus | "" {
  if (policy === "always_pay") return "payable";
  if (policy === "dont_pay") return "non_payable";
  return "";
}

export function resolveBuddyPayStatus(
  policy: BuddyShiftPayPolicy,
  explicit?: ShiftPayStatus | ""
): ShiftPayStatus | "" {
  const defaulted = defaultBuddyPayStatusForPolicy(policy);
  if (defaulted) return defaulted;
  return explicit === "payable" || explicit === "non_payable" ? explicit : "";
}

export function applyBuddyDefaults(
  shift: RosterShiftRecord,
  policy: BuddyShiftPayPolicy
): RosterShiftRecord {
  const purpose = normalizeShiftPurpose(shift.shiftPurpose);
  if (!isBuddyShiftPurpose(purpose)) {
    return {
      ...shift,
      shiftPurpose: purpose,
      billingClassification: normalizeBillingClassification(shift.billingClassification),
      payStatus: isTrainingOrMeetingPurpose(purpose) ? normalizeShiftPayStatus(shift.payStatus) : "payable",
      primaryRosterShiftId: "",
      buddyReason: "",
    };
  }
  const payStatus = resolveBuddyPayStatus(
    policy,
    shift.payStatus === "payable" || shift.payStatus === "non_payable" ? shift.payStatus : ""
  );
  return {
    ...shift,
    billingClassification:
      shift.billingClassification === "billable"
        ? "billable"
        : "non_billable_internal_cost",
    payStatus: payStatus || shift.payStatus,
    buddyReason: shift.buddyReason ?? "",
    primaryRosterShiftId: shift.primaryRosterShiftId ?? "",
  };
}

export function buddyShiftFromPrimary(
  primary: RosterShiftRecord,
  partial: Partial<RosterShiftRecord>,
  existing: RosterShiftRecord[],
  policy: BuddyShiftPayPolicy
): RosterShiftRecord {
  const payDefault = defaultBuddyPayStatusForPolicy(policy);
  const id = partial.id?.trim() || `rs-buddy-${Date.now()}`;
  const used = new Set(existing.map((r) => r.shiftRef).filter(Boolean));
  let shiftRef = partial.shiftRef?.trim() || `${primary.shiftRef || "SHIFT"}-BUDDY`;
  if (used.has(shiftRef)) shiftRef = `${shiftRef}-${existing.length + 1}`;

  return applyBuddyDefaults(
    {
      id,
      shiftRef,
      clientId: primary.clientId,
      employeeId: partial.employeeId ?? "",
      locationId: primary.locationId,
      serviceBookingId: primary.serviceBookingId,
      shiftDate: primary.shiftDate,
      startTime: primary.startTime,
      endTime: primary.endTime,
      shiftType: primary.shiftType,
      status: partial.status ?? "Draft",
      notes: partial.notes ?? `Buddy shift linked to ${primary.shiftRef || primary.id}`,
      recurrenceGroupId: "",
      checkedInAt: "",
      checkedOutAt: "",
      checkInNotes: "",
      checkInLatitude: "",
      checkInLongitude: "",
      checkOutLatitude: "",
      checkOutLongitude: "",
      coverageSource: partial.coverageSource ?? "internal",
      agencyWorkerId: partial.agencyWorkerId ?? "",
      vendorBpId: partial.vendorBpId ?? "",
      agencyRequestId: partial.agencyRequestId ?? "",
      shiftPurpose: partial.shiftPurpose ?? "buddy_shadow",
      billingClassification: partial.billingClassification ?? "non_billable_internal_cost",
      payStatus: payDefault || partial.payStatus || "",
      primaryRosterShiftId: primary.id,
      buddyReason: partial.buddyReason ?? "",
      createdBy: partial.createdBy ?? "SuperUser",
      updatedBy: partial.updatedBy ?? "SuperUser",
    },
    policy
  );
}

export function buddyShiftPayPolicyFromOrganization(org: OrganizationRecord): BuddyShiftPayPolicy {
  return normalizeBuddyShiftPayPolicy(org.buddyShiftPayPolicy);
}

export function sumPayableTimesheetLineHours(lines: TimesheetLine[]): number {
  return Math.round(
    lines.filter(isLinePayable).reduce((sum, line) => sum + (line.hours || 0), 0) * 100
  ) / 100;
}

export function sumNonPayableTimesheetLineHours(lines: TimesheetLine[]): number {
  return Math.round(
    lines.filter((line) => !isLinePayable(line)).reduce((sum, line) => sum + (line.hours || 0), 0) * 100
  ) / 100;
}

export type BuddyShiftReportRow = {
  shiftId: string;
  shiftRef: string;
  shiftDate: string;
  workerLabel: string;
  clientLabel: string;
  locationLabel: string;
  purposeLabel: string;
  hours: number;
  payStatus: ShiftPayStatus;
  billingClassification: BillingClassification;
  primaryShiftRef: string;
  buddyReason: string;
};
