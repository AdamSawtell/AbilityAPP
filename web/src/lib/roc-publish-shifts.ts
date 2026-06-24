import { detectRecurringRosterConflicts } from "@/lib/roster-shift-conflicts";
import { validateRosterShift } from "@/lib/roster-shift-compliance";
import {
  addDaysIso,
  normalizeRosterShift,
  weekStartFromDate,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import { ROC_WEEKDAY_LABELS, type RosterOfCareRecord } from "@/lib/roster-of-care";
import type { ServiceBookingRecord } from "@/lib/service-booking";

export type RocPublishInput = {
  weekStart: string;
  weekCount: number;
  status: "Draft" | "Published";
  actor: string;
  /** When true, skip dates that already have a RoC-linked shift id. */
  skipExisting?: boolean;
};

export type RocPublishPreview = {
  shifts: RosterShiftRecord[];
  skippedLines: { lineNo: number; reason: string }[];
  warnings: string[];
};

export type RocPublishValidation = {
  blocked: boolean;
  errors: string[];
  warnings: string[];
};

function shiftIdForRocLine(
  rocId: string,
  line: { weekday: number; startTime: string; endTime: string },
  shiftDate: string
): string {
  const start = line.startTime.slice(0, 5);
  const end = line.endTime.slice(0, 5);
  return `rsh-${rocId}-w${line.weekday}-${start}-${end}-${shiftDate}`;
}

function isDateInRocRange(date: string, validFrom: string, validTo: string): boolean {
  if (validFrom?.trim() && date < validFrom.slice(0, 10)) return false;
  if (validTo?.trim() && date > validTo.slice(0, 10)) return false;
  return true;
}

/** Pick an in-range service booking for the client (prefer matching agreement). */
export function resolveServiceBookingId(
  clientId: string,
  serviceAgreementId: string,
  shiftDate: string,
  bookings: ServiceBookingRecord[]
): string {
  const inRange = bookings.filter(
    (b) =>
      b.clientId === clientId &&
      b.documentStatus !== "Cancelled" &&
      (!b.startDate?.trim() || b.startDate.slice(0, 10) <= shiftDate) &&
      (!b.endDate?.trim() || b.endDate.slice(0, 10) >= shiftDate)
  );
  const withAgreement = serviceAgreementId
    ? inRange.filter((b) => b.serviceAgreementId === serviceAgreementId)
    : inRange;
  return (withAgreement[0] ?? inRange[0])?.id ?? "";
}

export function buildShiftsFromRosterOfCare(
  roc: RosterOfCareRecord,
  input: RocPublishInput,
  existing: RosterShiftRecord[],
  serviceBookings: ServiceBookingRecord[]
): RocPublishPreview {
  const weekStart = weekStartFromDate(input.weekStart);
  const weeks = Math.max(1, Math.min(12, input.weekCount));
  const shifts: RosterShiftRecord[] = [];
  const skippedLines: { lineNo: number; reason: string }[] = [];
  const warnings: string[] = [];

  if (!roc.lines.length) {
    warnings.push("This roster of care has no weekly lines.");
    return { shifts, skippedLines, warnings };
  }

  const groupId = `roc-${roc.id}`;
  const bookingWarnings = new Set<string>();

  const skippedLineNos = new Set<number>();

  for (let w = 0; w < weeks; w += 1) {
    const ws = addDaysIso(weekStart, w * 7);
    for (const line of roc.lines) {
      const shiftDate = addDaysIso(ws, line.weekday);
      if (!isDateInRocRange(shiftDate, roc.validFrom, roc.validTo)) continue;

      if (!line.locationId?.trim()) {
        skippedLineNos.add(line.lineNo);
        continue;
      }

      const id = shiftIdForRocLine(roc.id, line, shiftDate);
      const alreadyPublished =
        existing.some((s) => s.id === id) ||
        existing.some(
          (s) =>
            s.recurrenceGroupId === groupId &&
            s.shiftDate === shiftDate &&
            s.startTime.slice(0, 5) === line.startTime.slice(0, 5) &&
            s.endTime.slice(0, 5) === line.endTime.slice(0, 5)
        );
      if (input.skipExisting && alreadyPublished) continue;

      const prior = existing.find((s) => s.id === id);
      const bookingId = resolveServiceBookingId(
        roc.clientId,
        roc.serviceAgreementId,
        shiftDate,
        serviceBookings
      );

      const dayLabel = ROC_WEEKDAY_LABELS[line.weekday] ?? "Day";
      const shiftRef =
        prior?.shiftRef ||
        `${roc.name}-${dayLabel}-${line.startTime}`.replace(/\s+/g, "-").slice(0, 48);

      shifts.push(
        normalizeRosterShift({
          ...(prior ?? {}),
          id,
          shiftRef,
          clientId: roc.clientId,
          employeeId: prior?.employeeId ?? "",
          locationId: line.locationId,
          serviceBookingId: bookingId || prior?.serviceBookingId || "",
          shiftDate,
          startTime: line.startTime,
          endTime: line.endTime,
          shiftType: line.supportType || "Standard",
          status: input.status,
          notes: line.notes?.trim() ? line.notes : `From RoC: ${roc.name}`,
          recurrenceGroupId: groupId,
          checkedInAt: prior?.checkedInAt ?? "",
          checkedOutAt: prior?.checkedOutAt ?? "",
          checkInNotes: prior?.checkInNotes ?? "",
          checkInLatitude: prior?.checkInLatitude ?? "",
          checkInLongitude: prior?.checkInLongitude ?? "",
          checkOutLatitude: prior?.checkOutLatitude ?? "",
          checkOutLongitude: prior?.checkOutLongitude ?? "",
          coverageSource: prior?.coverageSource ?? "internal",
          agencyWorkerId: prior?.agencyWorkerId ?? "",
          vendorBpId: prior?.vendorBpId ?? "",
          agencyRequestId: prior?.agencyRequestId ?? "",
          createdBy: prior?.createdBy || input.actor,
          updatedBy: input.actor,
        })
      );

      if (!bookingId) {
        bookingWarnings.add(shiftDate);
      }
    }
  }

  for (const lineNo of skippedLineNos) {
    skippedLines.push({
      lineNo,
      reason: `Line ${lineNo} — missing location on all weeks in range`,
    });
  }

  if (bookingWarnings.size) {
    warnings.push(
      `${bookingWarnings.size} shift date${bookingWarnings.size === 1 ? "" : "s"} have no matching service booking — shifts are saved without a booking link.`
    );
  }

  return { shifts, skippedLines, warnings };
}

export function validateRocPublishShifts(
  shifts: RosterShiftRecord[],
  existing: RosterShiftRecord[],
  options?: { allSkippedByExisting?: boolean }
): RocPublishValidation {
  if (!shifts.length) {
    if (options?.allSkippedByExisting) {
      return {
        blocked: false,
        errors: [],
        warnings: ["All dates in this range were already published from this RoC."],
      };
    }
    return { blocked: true, errors: ["No shifts in range — check RoC dates and weekly lines."], warnings: [] };
  }

  const batchIds = new Set(shifts.map((s) => s.id));
  const conflictMap = detectRecurringRosterConflicts(shifts, existing);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const shift of shifts) {
    const peers = [
      ...existing.filter((r) => r.id !== shift.id && !batchIds.has(r.id)),
      ...shifts.filter((r) => r.id !== shift.id),
    ];
    const fieldIssues = validateRosterShift(shift, { existing: peers, batchIds });
    for (const issue of fieldIssues) {
      if (issue.code === "TIME_RANGE_INVALID") continue;
      const msg = `${shift.shiftDate}: ${issue.message}`;
      if (issue.severity === "error") errors.push(msg);
      else warnings.push(msg);
    }
    for (const issue of conflictMap.get(shift.id) ?? []) {
      const msg = `${shift.shiftDate}: ${issue.message}`;
      if (issue.severity === "error") errors.push(msg);
      else warnings.push(msg);
    }
  }

  return {
    blocked: errors.length > 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}
