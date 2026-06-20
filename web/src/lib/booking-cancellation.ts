import type { ServiceBookingRecord } from "@/lib/service-booking";

export const DEFAULT_CANCELLATION_NOTICE_DAYS = 7;

export const CANCELLATION_INITIATED_BY = [
  "Participant",
  "Provider",
  "NDIA",
  "Mutual agreement",
] as const;

export type CancellationInitiatedBy = (typeof CANCELLATION_INITIATED_BY)[number];

type CancellationComplianceIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type CancellationPolicyOutcome = {
  serviceStartDate: string;
  noticeDaysGiven: number | null;
  requiredNoticeDays: number;
  isShortNotice: boolean;
  claimablePercent: number;
  claimableAmount: number;
  summary: string;
};

function parseMoney(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value: string): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayDiff(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Earliest scheduled service date from header or lines. */
export function earliestServiceDate(booking: ServiceBookingRecord): string {
  const candidates = [
    booking.startDate,
    ...booking.lines.map((l) => l.startDate),
    ...booking.lines.map((l) => l.datePromised),
  ].filter(Boolean);
  if (!candidates.length) return booking.startDate ?? "";
  return candidates.sort()[0];
}

export function computeNoticeDays(cancelledAt: string, serviceStartDate: string): number | null {
  const cancelled = parseDate(cancelledAt);
  const serviceStart = parseDate(serviceStartDate);
  if (!cancelled || !serviceStart) return null;
  return dayDiff(cancelled, serviceStart);
}

export function bookingGrandTotal(booking: ServiceBookingRecord): number {
  const headerTotal = parseMoney(booking.grandTotal);
  if (headerTotal > 0) return headerTotal;
  return booking.lines.reduce((sum, line) => sum + parseMoney(line.lineAmount), 0);
}

export function evaluateCancellationPolicy(
  booking: ServiceBookingRecord
): CancellationPolicyOutcome | null {
  if (booking.documentStatus !== "Cancelled") return null;

  const serviceStartDate = earliestServiceDate(booking);
  const requiredNoticeDays = booking.cancellationNoticeDays || DEFAULT_CANCELLATION_NOTICE_DAYS;
  const noticeDaysGiven = booking.cancelledAt
    ? computeNoticeDays(booking.cancelledAt, serviceStartDate)
    : null;
  const isShortNotice =
    noticeDaysGiven !== null && noticeDaysGiven < requiredNoticeDays && noticeDaysGiven >= 0;

  const initiatedBy = booking.cancellationInitiatedBy.trim();
  let claimablePercent = 0;

  if (initiatedBy === "Participant" && isShortNotice) {
    claimablePercent = 100;
  } else if (initiatedBy === "Mutual agreement") {
    claimablePercent = isShortNotice ? 50 : 0;
  }

  const claimableAmount = (bookingGrandTotal(booking) * claimablePercent) / 100;

  let summary: string;
  if (!serviceStartDate) {
    summary = "Set a service start date to evaluate notice period.";
  } else if (noticeDaysGiven === null) {
    summary = "Enter cancellation date to calculate notice given.";
  } else if (noticeDaysGiven < 0) {
    summary = "Cancellation date is after service start — review whether this should be a completed or adjusted booking.";
  } else if (isShortNotice && initiatedBy === "Participant") {
    summary = `Short notice (${noticeDaysGiven} of ${requiredNoticeDays} days). Participant-initiated — up to 100% may be claimable if supports could have been delivered.`;
  } else if (isShortNotice) {
    summary = `Short notice (${noticeDaysGiven} of ${requiredNoticeDays} days). Provider or NDIA cancellation is not typically claimable.`;
  } else {
    summary = `Adequate notice (${noticeDaysGiven} days before service). No short-notice claim applies.`;
  }

  return {
    serviceStartDate,
    noticeDaysGiven,
    requiredNoticeDays,
    isShortNotice,
    claimablePercent,
    claimableAmount,
    summary,
  };
}

export function validateBookingCancellation(
  booking: ServiceBookingRecord
): CancellationComplianceIssue[] {
  if (booking.documentStatus !== "Cancelled") return [];

  const issues: CancellationComplianceIssue[] = [];

  if (!booking.cancelledAt?.trim()) {
    issues.push({
      code: "CANCEL_DATE_REQUIRED",
      message: "Enter the cancellation date when document status is Cancelled.",
      severity: "error",
    });
  }

  if (!booking.cancellationInitiatedBy?.trim()) {
    issues.push({
      code: "CANCEL_INITIATOR_REQUIRED",
      message: "Select who initiated the cancellation.",
      severity: "error",
    });
  }

  if (!booking.cancellationReason?.trim()) {
    issues.push({
      code: "CANCEL_REASON_REQUIRED",
      message: "Select a cancellation reason.",
      severity: "error",
    });
  }

  const serviceStartDate = earliestServiceDate(booking);
  if (booking.cancelledAt && serviceStartDate) {
    const noticeDays = computeNoticeDays(booking.cancelledAt, serviceStartDate);
    if (noticeDays !== null && noticeDays < 0) {
      issues.push({
        code: "CANCEL_AFTER_START",
        message: "Cancellation date is after the scheduled service start. Use Completed or adjust dates instead.",
        severity: "error",
      });
    }
  }

  const outcome = evaluateCancellationPolicy(booking);
  if (outcome?.isShortNotice && outcome.claimablePercent > 0) {
    issues.push({
      code: "CANCEL_SHORT_NOTICE_CLAIM",
      message: `Short-notice cancellation — estimated claimable amount $${outcome.claimableAmount.toFixed(2)} (${outcome.claimablePercent}% of booking total). Confirm against your service agreement.`,
      severity: "warning",
    });
  } else if (outcome?.isShortNotice && booking.cancellationInitiatedBy === "Provider") {
    issues.push({
      code: "CANCEL_PROVIDER_SHORT",
      message: "Provider-initiated short-notice cancellation is not typically NDIS claimable.",
      severity: "warning",
    });
  }

  if (
    booking.cancellationNoticeDays > 0 &&
    booking.cancellationNoticeDays < DEFAULT_CANCELLATION_NOTICE_DAYS
  ) {
    issues.push({
      code: "CANCEL_NOTICE_BELOW_DEFAULT",
      message: `Notice period is ${booking.cancellationNoticeDays} days (NDIS default is ${DEFAULT_CANCELLATION_NOTICE_DAYS}). Confirm this matches the service agreement.`,
      severity: "warning",
    });
  }

  return issues;
}

export function normalizeCancellationFields(
  booking: ServiceBookingRecord
): ServiceBookingRecord {
  const noticeDays =
    booking.cancellationNoticeDays > 0
      ? booking.cancellationNoticeDays
      : DEFAULT_CANCELLATION_NOTICE_DAYS;

  return {
    ...booking,
    cancellationNoticeDays: noticeDays,
    cancelledAt: booking.cancelledAt ?? "",
    cancellationInitiatedBy: booking.cancellationInitiatedBy ?? "",
    cancellationReason: booking.cancellationReason ?? "",
    cancellationNotes: booking.cancellationNotes ?? "",
  };
}
