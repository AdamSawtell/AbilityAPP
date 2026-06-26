/** Roster shift — one worker assignment for a client on a date/time window. */
import {
  isBuddyShiftPurpose,
  normalizeBillingClassification,
  normalizeShiftPayStatus,
  normalizeShiftPurpose,
  type BillingClassification,
  type ShiftPayStatus,
  type ShiftPurpose,
} from "@/lib/buddy-shift";

export type RosterShiftRecord = {
  id: string;
  shiftRef: string;
  clientId: string;
  employeeId: string;
  locationId: string;
  serviceBookingId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: string;
  notes: string;
  recurrenceGroupId: string;
  checkedInAt: string;
  checkedOutAt: string;
  checkInNotes: string;
  checkInLatitude: string;
  checkInLongitude: string;
  checkOutLatitude: string;
  checkOutLongitude: string;
  coverageSource: "" | "internal" | "agency";
  agencyWorkerId: string;
  vendorBpId: string;
  agencyRequestId: string;
  trainingSessionGroupId?: string;
  sessionTitle?: string;
  sessionCategory?: string;
  costAllocation?: "billable" | "non_billable" | "admin_costed" | string;
  costCentre?: string;
  estimatedHourlyCost?: number;
  attendanceStatus?: "Scheduled" | "Attended" | "Did not attend" | "Excused" | string;
  attendanceSignedOffAt?: string;
  attendanceSignedOffBy?: string;
  shiftPurpose?: ShiftPurpose | string;
  billingClassification?: BillingClassification | string;
  payStatus?: ShiftPayStatus | string;
  primaryRosterShiftId?: string;
  buddyReason?: string;
  criticalFill?: boolean;
  criticalFillMarkedAt?: string;
  criticalFillMarkedBy?: string;
  openFillStatus?: string;
  createdBy: string;
  updatedBy: string;
};

export const rosterShiftDropdowns = {
  shiftType: ["Standard", "Sleepover", "Active overnight", "Group", "Training", "Meeting"],
  status: ["Draft", "Published", "Completed", "Cancelled"],
  coverageSource: ["internal", "agency"],
  sessionCategory: ["Internal training", "External training", "Mandatory compliance", "Team meeting", "Staff meeting", "Client-facing training"],
  costAllocation: ["billable", "non_billable", "admin_costed"],
  attendanceStatus: ["Scheduled", "Attended", "Did not attend", "Excused"],
};

export function isAgencyCoveredShift(shift: RosterShiftRecord): boolean {
  const n = normalizeRosterShift(shift);
  return n.coverageSource === "agency" && Boolean(n.agencyWorkerId?.trim());
}

export const initialRosterShifts: RosterShiftRecord[] = [
  {
    id: "rs-bern-mon-am",
    shiftRef: "BERN-MON-AM",
    clientId: "bp-bern",
    employeeId: "emp-isla",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-06",
    startTime: "09:00",
    endTime: "15:00",
    shiftType: "Standard",
    status: "Published",
    notes: "SIL morning — linked to booking 50145",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-wed-pm",
    shiftRef: "BERN-WED-PM",
    clientId: "bp-bern",
    employeeId: "emp-gabriela",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-08",
    startTime: "14:00",
    endTime: "20:00",
    shiftType: "Standard",
    status: "Published",
    notes: "Community access afternoon",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-tue-vac",
    shiftRef: "BERN-TUE-VAC",
    clientId: "bp-bern",
    employeeId: "",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-07",
    startTime: "09:00",
    endTime: "15:00",
    shiftType: "Standard",
    status: "Published",
    notes: "Vacant — agency coverage candidate",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-agency-done",
    shiftRef: "BERN-AGENCY-DONE",
    clientId: "bp-bern",
    employeeId: "",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-08",
    startTime: "09:00",
    endTime: "15:00",
    shiftType: "Standard",
    status: "Completed",
    notes: "Completed agency cover — Jane Agency via StaffPlus",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "agency",
    agencyWorkerId: "aw-sp-jane",
    vendorBpId: "bp-staffplus",
    agencyRequestId: "asr-demo-jane-oct",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-fri-am",
    shiftRef: "BERN-FRI-AM",
    clientId: "bp-bern",
    employeeId: "emp-isla",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-10",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "Standard",
    status: "Published",
    notes: "",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-open-thu",
    shiftRef: "OPEN-THU",
    clientId: "bp-bern",
    employeeId: "",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-09",
    startTime: "10:00",
    endTime: "16:00",
    shiftType: "Standard",
    status: "Draft",
    notes: "Open shift — posted to marketplace for cover",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-jun-mon",
    shiftRef: "BERN-JUN-MON",
    clientId: "bp-bern",
    employeeId: "emp-isla",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2026-06-23",
    startTime: "09:00",
    endTime: "15:00",
    shiftType: "Standard",
    status: "Published",
    notes: "SIL morning support",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-jun-wed",
    shiftRef: "BERN-JUN-WED",
    clientId: "bp-bern",
    employeeId: "emp-gabriela",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2026-06-25",
    startTime: "14:00",
    endTime: "20:00",
    shiftType: "Standard",
    status: "Published",
    notes: "Community access",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-mon-buddy",
    shiftRef: "BERN-MON-BUDDY",
    clientId: "bp-bern",
    employeeId: "emp-oliver",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-06",
    startTime: "09:00",
    endTime: "15:00",
    shiftType: "Standard",
    status: "Published",
    notes: "Buddy shadow — site orientation with Isla on SIL morning",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    shiftPurpose: "buddy_shadow",
    billingClassification: "non_billable_internal_cost",
    payStatus: "non_payable",
    primaryRosterShiftId: "rs-bern-mon-am",
    buddyReason: "New worker site orientation",
    createdBy: "Riley Shaw",
    updatedBy: "Riley Shaw",
  },
  {
    id: "rs-train-manual-isla",
    shiftRef: "TRN-MANUAL-ISLA",
    clientId: "",
    employeeId: "emp-isla",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "",
    shiftDate: "2025-10-09",
    startTime: "10:00",
    endTime: "12:00",
    shiftType: "Training",
    status: "Published",
    notes: "Manual handling refresher group session.",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    trainingSessionGroupId: "tsg-manual-2025-10-09",
    sessionTitle: "Manual handling refresher",
    sessionCategory: "Mandatory compliance",
    costAllocation: "admin_costed",
    costCentre: "Training",
    estimatedHourlyCost: 48,
    attendanceStatus: "Scheduled",
    attendanceSignedOffAt: "",
    attendanceSignedOffBy: "",
    shiftPurpose: "training_session",
    billingClassification: "admin_costed",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Riley Shaw",
    updatedBy: "Riley Shaw",
  },
  {
    id: "rs-train-manual-gabriela",
    shiftRef: "TRN-MANUAL-GAB",
    clientId: "",
    employeeId: "emp-gabriela",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "",
    shiftDate: "2025-10-09",
    startTime: "10:00",
    endTime: "12:00",
    shiftType: "Training",
    status: "Published",
    notes: "Manual handling refresher group session.",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    trainingSessionGroupId: "tsg-manual-2025-10-09",
    sessionTitle: "Manual handling refresher",
    sessionCategory: "Mandatory compliance",
    costAllocation: "admin_costed",
    costCentre: "Training",
    estimatedHourlyCost: 48,
    attendanceStatus: "Scheduled",
    attendanceSignedOffAt: "",
    attendanceSignedOffBy: "",
    shiftPurpose: "training_session",
    billingClassification: "admin_costed",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    createdBy: "Riley Shaw",
    updatedBy: "Riley Shaw",
  },
];

export function normalizeRosterShift(record: RosterShiftRecord): RosterShiftRecord {
  const purpose = normalizeShiftPurpose(record.shiftPurpose);
  // Buddy shifts under an "ask" policy must keep an unset pay status so the
  // booker is forced to choose; only non-buddy shifts default to payable.
  const payStatus = isBuddyShiftPurpose(purpose)
    ? record.payStatus === "payable" || record.payStatus === "non_payable"
      ? record.payStatus
      : ""
    : normalizeShiftPayStatus(record.payStatus);
  return {
    ...record,
    shiftRef: record.shiftRef ?? "",
    clientId: record.clientId ?? "",
    employeeId: record.employeeId ?? "",
    locationId: record.locationId ?? "",
    serviceBookingId: record.serviceBookingId ?? "",
    shiftDate: record.shiftDate ?? "",
    startTime: record.startTime?.slice(0, 5) ?? "",
    endTime: record.endTime?.slice(0, 5) ?? "",
    shiftType: record.shiftType || "Standard",
    status: record.status || "Published",
    notes: record.notes ?? "",
    recurrenceGroupId: record.recurrenceGroupId ?? "",
    checkedInAt: record.checkedInAt ?? "",
    checkedOutAt: record.checkedOutAt ?? "",
    checkInNotes: record.checkInNotes ?? "",
    checkInLatitude: record.checkInLatitude ?? "",
    checkInLongitude: record.checkInLongitude ?? "",
    checkOutLatitude: record.checkOutLatitude ?? "",
    checkOutLongitude: record.checkOutLongitude ?? "",
    coverageSource:
      record.coverageSource === "agency"
        ? "agency"
        : record.coverageSource === "internal"
          ? "internal"
          : record.agencyWorkerId?.trim()
            ? "agency"
            : "internal",
    agencyWorkerId: record.agencyWorkerId ?? "",
    vendorBpId: record.vendorBpId ?? "",
    agencyRequestId: record.agencyRequestId ?? "",
    trainingSessionGroupId: record.trainingSessionGroupId ?? "",
    sessionTitle: record.sessionTitle ?? "",
    sessionCategory: record.sessionCategory ?? "",
    costAllocation:
      record.costAllocation === "billable" || record.costAllocation === "admin_costed"
        ? record.costAllocation
        : "non_billable",
    costCentre: record.costCentre ?? "",
    estimatedHourlyCost: Number.isFinite(Number(record.estimatedHourlyCost)) ? Number(record.estimatedHourlyCost) : 0,
    attendanceStatus: record.attendanceStatus || "Scheduled",
    attendanceSignedOffAt: record.attendanceSignedOffAt ?? "",
    attendanceSignedOffBy: record.attendanceSignedOffBy ?? "",
    shiftPurpose: purpose,
    billingClassification: normalizeBillingClassification(record.billingClassification),
    payStatus,
    primaryRosterShiftId: record.primaryRosterShiftId ?? "",
    buddyReason: record.buddyReason ?? "",
    criticalFill: Boolean(record.criticalFill),
    criticalFillMarkedAt: record.criticalFillMarkedAt ?? "",
    criticalFillMarkedBy: record.criticalFillMarkedBy ?? "",
    openFillStatus: record.openFillStatus || "Open",
  };
}

export function createRosterShift(
  partial: Partial<RosterShiftRecord> & Pick<RosterShiftRecord, "shiftDate">,
  existing: RosterShiftRecord[]
): RosterShiftRecord {
  const id = partial.id?.trim() || `rs-${Date.now()}`;
  const used = new Set(existing.map((r) => r.shiftRef).filter(Boolean));
  let shiftRef = partial.shiftRef?.trim() || `SHIFT-${existing.length + 1}`;
  if (used.has(shiftRef)) shiftRef = `${shiftRef}-${existing.length + 1}`;
  return normalizeRosterShift({
    id,
    shiftRef,
    clientId: "",
    employeeId: "",
    locationId: "",
    serviceBookingId: "",
    startTime: "09:00",
    endTime: "17:00",
    shiftType: "Standard",
    status: "Published",
    notes: "",
    recurrenceGroupId: "",
    checkedInAt: "",
    checkedOutAt: "",
    checkInNotes: "",
    checkInLatitude: "",
    checkInLongitude: "",
    checkOutLatitude: "",
    checkOutLongitude: "",
    coverageSource: "internal",
    agencyWorkerId: "",
    vendorBpId: "",
    agencyRequestId: "",
    trainingSessionGroupId: "",
    sessionTitle: "",
    sessionCategory: "",
    costAllocation: "billable",
    costCentre: "",
    estimatedHourlyCost: 0,
    attendanceStatus: "Scheduled",
    attendanceSignedOffAt: "",
    attendanceSignedOffBy: "",
    shiftPurpose: "service_delivery",
    billingClassification: "billable",
    payStatus: "payable",
    primaryRosterShiftId: "",
    buddyReason: "",
    ...partial,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}

export function formatDayHeading(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function formatShiftTimeRange(startTime: string, endTime: string): string {
  const start = startTime?.slice(0, 5) || "—";
  const end = endTime?.slice(0, 5) || "—";
  return `${start} – ${end}`;
}

/** Monday-based week start for a given ISO date. */
export function weekStartFromDate(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate.slice(0, 10);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Week start from `?week=YYYY-MM-DD` or a fallback date (typically today). */
export function resolveRosterWeekStart(
  weekParam: string | null | undefined,
  fallbackIsoDate: string
): string {
  const raw = weekParam?.trim().slice(0, 10) ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return weekStartFromDate(raw);
  }
  return weekStartFromDate(fallbackIsoDate);
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function shiftsForWeek(shifts: RosterShiftRecord[], weekStart: string): RosterShiftRecord[] {
  const end = addDaysIso(weekStart, 6);
  return shifts.filter((s) => s.shiftDate >= weekStart && s.shiftDate <= end);
}

function parseTimeMinutes(value: string): number {
  const part = value?.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(part)) return 0;
  const [h, m] = part.split(":").map(Number);
  return h * 60 + m;
}

export function shiftDurationHours(shift: RosterShiftRecord): number {
  const start = parseTimeMinutes(shift.startTime);
  let end = parseTimeMinutes(shift.endTime);
  if (end <= start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 100) / 100;
}

export function forwardWeekStarts(anchorWeekStart: string, weekCount: number): string[] {
  const count = Math.max(1, Math.min(12, weekCount));
  return Array.from({ length: count }, (_, i) => addDaysIso(anchorWeekStart, i * 7));
}
