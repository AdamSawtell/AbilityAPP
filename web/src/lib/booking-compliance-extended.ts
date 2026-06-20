import { currentConsentForType, normalizeConsentStatus } from "@/lib/client-consent";
import type { ClientRecord } from "@/lib/client";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import type { ServiceBookingLine, ServiceBookingRecord } from "@/lib/service-booking";
import type { BookingComplianceIssue } from "@/lib/booking-compliance";

function parseMoney(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function lineWithinBookingPeriod(
  line: ServiceBookingLine,
  bookingStart: string,
  bookingEnd: string
): boolean {
  if (!bookingStart && !bookingEnd) return true;
  const starts = [line.startDate, line.datePromised].filter(Boolean);
  const ends = [line.endDate, line.datePromised].filter(Boolean);
  for (const d of starts) {
    if (bookingStart && d < bookingStart) return false;
    if (bookingEnd && d > bookingEnd) return false;
  }
  for (const d of ends) {
    if (bookingStart && d < bookingStart) return false;
    if (bookingEnd && d > bookingEnd) return false;
  }
  return true;
}

export function validateExtendedBookingCompliance(
  booking: ServiceBookingRecord,
  context: {
    client?: ClientRecord | null;
    serviceAgreement?: ServiceAgreementRecord | null;
  } = {}
): BookingComplianceIssue[] {
  const issues: BookingComplianceIssue[] = [];
  const { client, serviceAgreement } = context;
  const isCancelled = booking.documentStatus === "Cancelled";

  if (client && !isCancelled) {
    const serviceConsent = currentConsentForType(client.consents ?? [], "Service delivery");
    const consentStatus = serviceConsent
      ? normalizeConsentStatus(serviceConsent.consentStatus)
      : null;

    if (!serviceConsent) {
      issues.push({
        code: "CONSENT_SERVICE_MISSING",
        message: "Service delivery consent is not recorded for this client.",
        severity: "warning",
      });
    } else if (consentStatus === "Refused") {
      issues.push({
        code: "CONSENT_SERVICE_REFUSED",
        message: "Service delivery consent is refused — do not deliver or claim supports.",
        severity: "error",
      });
    } else if (consentStatus === "Pending" || consentStatus === "Expired") {
      issues.push({
        code: "CONSENT_SERVICE_PENDING",
        message: `Service delivery consent is ${consentStatus.toLowerCase()} — confirm before delivering supports.`,
        severity: "warning",
      });
    }

    if (
      client.dateSupportCommencement &&
      booking.startDate &&
      booking.startDate < client.dateSupportCommencement
    ) {
      issues.push({
        code: "SUPPORT_NOT_COMMENCED",
        message: "Booking start date is before the client's support commencement date.",
        severity: "warning",
      });
    }
  }

  if (!isCancelled && booking.clientId?.trim()) {
    if (!booking.serviceAgreementId?.trim()) {
      issues.push({
        code: "AGREEMENT_MISSING",
        message: "Link an active service agreement before confirming delivery.",
        severity: "warning",
      });
    } else if (!serviceAgreement) {
      issues.push({
        code: "AGREEMENT_NOT_FOUND",
        message: "The linked service agreement could not be found.",
        severity: "error",
      });
    } else {
      if (serviceAgreement.clientId !== booking.clientId) {
        issues.push({
          code: "AGREEMENT_CLIENT_MISMATCH",
          message: "Service agreement belongs to a different client.",
          severity: "error",
        });
      }
      if (serviceAgreement.status !== "Active") {
        issues.push({
          code: "AGREEMENT_INACTIVE",
          message: `Service agreement status is "${serviceAgreement.status}" — only Active agreements support new bookings.`,
          severity: "error",
        });
      }
      if (booking.startDate && serviceAgreement.finishDate && booking.startDate > serviceAgreement.finishDate) {
        issues.push({
          code: "AGREEMENT_EXPIRED",
          message: "Booking starts after the service agreement finish date.",
          severity: "error",
        });
      }
      if (booking.endDate && serviceAgreement.contractDate && booking.endDate < serviceAgreement.contractDate) {
        issues.push({
          code: "AGREEMENT_BEFORE_START",
          message: "Booking ends before the service agreement contract date.",
          severity: "warning",
        });
      }
    }
  }

  if (booking.documentStatus === "Completed") {
    if (!booking.lines.length) {
      issues.push({
        code: "COMPLETED_NO_LINES",
        message: "Completed bookings must include at least one service line.",
        severity: "error",
      });
    } else if (booking.lines.every((l) => l.manualHold)) {
      issues.push({
        code: "COMPLETED_ALL_ON_HOLD",
        message: "All lines are on manual hold — review before marking completed.",
        severity: "warning",
      });
    }
  }

  for (const line of booking.lines) {
    if (!line.productId?.trim()) {
      issues.push({
        code: "LINE_PRODUCT_REQUIRED",
        message: `Line ${line.lineNo}: select a product.`,
        severity: "error",
      });
    }

    if (
      booking.startDate &&
      booking.endDate &&
      (line.startDate || line.endDate || line.datePromised) &&
      !lineWithinBookingPeriod(line, booking.startDate, booking.endDate)
    ) {
      issues.push({
        code: "LINE_OUTSIDE_BOOKING",
        message: `Line ${line.lineNo}: dates fall outside the booking period.`,
        severity: "warning",
      });
    }

    const qty = parseMoney(line.orderedQuantity);
    const price = parseMoney(line.price);
    const amount = parseMoney(line.lineAmount);
    if (qty > 0 && price > 0 && amount > 0) {
      const expected = qty * price;
      if (Math.abs(expected - amount) > 0.02) {
        issues.push({
          code: "LINE_AMOUNT_MISMATCH",
          message: `Line ${line.lineNo}: line amount does not match price × quantity.`,
          severity: "warning",
        });
      }
    }
  }

  return issues;
}
