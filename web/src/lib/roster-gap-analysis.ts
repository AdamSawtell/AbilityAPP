import { addDaysIso, normalizeRosterShift, shiftsForWeek, type RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";

export type RosterGap = {
  code: "VACANT_SHIFT" | "COVERAGE_GAP";
  severity: "error" | "warning";
  message: string;
  clientId: string;
  shiftId?: string;
  shiftDate?: string;
  weekStart?: string;
  serviceBookingId?: string;
};

export function isVacantShift(shift: RosterShiftRecord): boolean {
  const normalized = normalizeRosterShift(shift);
  return normalized.status !== "Cancelled" && !normalized.employeeId?.trim();
}

export function bookingActiveInRange(
  booking: ServiceBookingRecord,
  rangeStart: string,
  rangeEnd: string
): boolean {
  if (booking.documentStatus !== "In progress") return false;
  if (!booking.clientId?.trim()) return false;
  const start = booking.startDate?.slice(0, 10) || "";
  const end = booking.endDate?.slice(0, 10) || start;
  if (!start) return false;
  return start <= rangeEnd && end >= rangeStart;
}

export function activeBookingsForWeek(
  bookings: ServiceBookingRecord[],
  weekStart: string
): ServiceBookingRecord[] {
  const weekEnd = addDaysIso(weekStart, 6);
  return bookings.filter((b) => bookingActiveInRange(b, weekStart, weekEnd));
}

function staffedShiftsForClientWeek(
  shifts: RosterShiftRecord[],
  clientId: string,
  weekStart: string
): RosterShiftRecord[] {
  return shiftsForWeek(shifts, weekStart).filter(
    (s) => s.clientId === clientId && s.status !== "Cancelled" && s.employeeId?.trim()
  );
}

export function detectVacantShiftGaps(shifts: RosterShiftRecord[]): RosterGap[] {
  const gaps: RosterGap[] = [];
  for (const shift of shifts.map(normalizeRosterShift)) {
    if (!isVacantShift(shift)) continue;
    gaps.push({
      code: "VACANT_SHIFT",
      severity: shift.status === "Published" ? "error" : "warning",
      message:
        shift.status === "Published"
          ? `Published shift on ${shift.shiftDate} has no worker assigned.`
          : `Vacant shift on ${shift.shiftDate} — assign a worker before publishing.`,
      clientId: shift.clientId,
      shiftId: shift.id,
      shiftDate: shift.shiftDate,
      weekStart: shift.shiftDate,
      serviceBookingId: shift.serviceBookingId || undefined,
    });
  }
  return gaps;
}

export function detectCoverageGapsForWeek(
  weekStart: string,
  bookings: ServiceBookingRecord[],
  shifts: RosterShiftRecord[]
): RosterGap[] {
  const gaps: RosterGap[] = [];
  const active = activeBookingsForWeek(bookings, weekStart);
  const clientBookings = new Map<string, ServiceBookingRecord>();
  for (const booking of active) {
    if (!clientBookings.has(booking.clientId)) clientBookings.set(booking.clientId, booking);
  }

  for (const [clientId, booking] of clientBookings) {
    const staffed = staffedShiftsForClientWeek(shifts, clientId, weekStart);
    if (staffed.length) continue;
    gaps.push({
      code: "COVERAGE_GAP",
      severity: "warning",
      message: `No staffed shifts this week for booking ${booking.documentNo}.`,
      clientId,
      weekStart,
      serviceBookingId: booking.id,
    });
  }

  return gaps;
}

export function detectRosterGaps(
  shifts: RosterShiftRecord[],
  bookings: ServiceBookingRecord[],
  weekStarts: string[]
): RosterGap[] {
  const normalized = shifts.map(normalizeRosterShift);
  const byKey = new Map<string, RosterGap>();

  for (const gap of detectVacantShiftGaps(normalized)) {
    byKey.set(gap.shiftId ?? `${gap.code}-${gap.shiftDate}`, gap);
  }

  for (const weekStart of weekStarts) {
    for (const gap of detectCoverageGapsForWeek(weekStart, bookings, normalized)) {
      byKey.set(`${gap.code}-${gap.clientId}-${gap.weekStart}`, gap);
    }
  }

  return [...byKey.values()];
}

export function gapsForWeek(
  weekStart: string,
  shifts: RosterShiftRecord[],
  bookings: ServiceBookingRecord[]
): RosterGap[] {
  return detectRosterGaps(shifts, bookings, [weekStart]);
}
