import type { EmployeeRecord } from "@/lib/employee";
import type { FleetBookingRow, FleetInspectionRow, FleetVehicleRecord } from "@/lib/fleet-vehicle";
import { daysUntilDate } from "@/lib/fleet-vehicle";

/** Newest inspection by date/time — not array position (Supabase loads DESC). */
export function latestFleetInspection(inspections: FleetInspectionRow[]): FleetInspectionRow | undefined {
  if (!inspections.length) return undefined;
  return [...inspections].sort((a, b) => {
    const aTime = new Date(a.inspectionDate || 0).getTime();
    const bTime = new Date(b.inspectionDate || 0).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return (b.lineNo ?? 0) - (a.lineNo ?? 0);
  })[0];
}

export type FleetComplianceIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

const ALERT_DAYS = [30, 14, 7] as const;

export function registrationExpiryIssues(vehicle: FleetVehicleRecord): FleetComplianceIssue[] {
  const days = daysUntilDate(vehicle.regoExpiry);
  if (days === null) return [];
  if (days < 0) {
    return [{ code: "rego-expired", message: "Registration has expired.", severity: "error" }];
  }
  if (ALERT_DAYS.includes(days as (typeof ALERT_DAYS)[number])) {
    return [{ code: "rego-expiring", message: `Registration expires in ${days} days.`, severity: "warning" }];
  }
  return [];
}

export function driverLicenceIssues(employee: EmployeeRecord | undefined): FleetComplianceIssue[] {
  if (!employee) return [];
  const issues: FleetComplianceIssue[] = [];
  const days = daysUntilDate(employee.driverLicenceExpiry);
  if (!employee.driverLicenceExpiry?.trim()) {
    issues.push({ code: "licence-missing", message: "Driver licence expiry not recorded.", severity: "error" });
  } else if (days !== null && days < 0) {
    issues.push({ code: "licence-expired", message: "Driver licence has expired.", severity: "error" });
  } else if (days !== null && ALERT_DAYS.includes(days as (typeof ALERT_DAYS)[number])) {
    issues.push({ code: "licence-expiring", message: `Driver licence expires in ${days} days.`, severity: "warning" });
  }
  const screeningDays = daysUntilDate(employee.ndisScreeningExpiry ?? "");
  if (employee.ndisScreeningExpiry && screeningDays !== null && screeningDays <= 30) {
    issues.push({
      code: "ndis-screening-expiring",
      message: `NDIS worker screening expires in ${screeningDays} days.`,
      severity: screeningDays < 0 ? "error" : "warning",
    });
  }
  const wwccDays = daysUntilDate(employee.wwccExpiry ?? "");
  if (employee.wwccExpiry && wwccDays !== null && wwccDays <= 30) {
    issues.push({
      code: "wwcc-expiring",
      message: `WWCC expires in ${wwccDays} days.`,
      severity: wwccDays < 0 ? "error" : "warning",
    });
  }
  return issues;
}

export function vehicleAvailableForShift(vehicle: FleetVehicleRecord): FleetComplianceIssue[] {
  const latestInspection = latestFleetInspection(vehicle.inspections ?? []);
  if (latestInspection?.passFail === "fail") {
    return [
      {
        code: "inspection-failed",
        message: "Latest pre-start inspection failed — save the vehicle or clear the fail before booking.",
        severity: "error",
      },
    ];
  }
  if (vehicle.status === "off_road") {
    return [{ code: "vehicle-off-road", message: "Vehicle is off road.", severity: "error" }];
  }
  if (vehicle.status !== "active") {
    return [{ code: "vehicle-inactive", message: `Vehicle status is ${vehicle.status}.`, severity: "error" }];
  }
  return [...registrationExpiryIssues(vehicle)];
}

export function bookingsOverlap(a: FleetBookingRow, b: FleetBookingRow): boolean {
  if (a.status === "cancelled" || b.status === "cancelled") return false;
  if (a.vehicleId !== b.vehicleId) return false;
  const aStart = new Date(a.startDatetime).getTime();
  const aEnd = new Date(a.endDatetime).getTime();
  const bStart = new Date(b.startDatetime).getTime();
  const bEnd = new Date(b.endDatetime).getTime();
  if ([aStart, aEnd, bStart, bEnd].some((t) => Number.isNaN(t))) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function validateFleetBooking(
  booking: FleetBookingRow,
  allBookings: FleetBookingRow[],
  vehicle: FleetVehicleRecord | undefined,
  driver: EmployeeRecord | undefined
): FleetComplianceIssue[] {
  const issues: FleetComplianceIssue[] = [];
  if (!booking.vehicleId?.trim()) {
    issues.push({ code: "vehicle-required", message: "Select a vehicle.", severity: "error" });
  }
  if (!booking.startDatetime || !booking.endDatetime) {
    issues.push({ code: "times-required", message: "Start and end date/time are required.", severity: "error" });
  } else if (new Date(booking.endDatetime) <= new Date(booking.startDatetime)) {
    issues.push({ code: "times-invalid", message: "End must be after start.", severity: "error" });
  }
  if (vehicle) issues.push(...vehicleAvailableForShift(vehicle));
  if (driver) issues.push(...driverLicenceIssues(driver));
  for (const other of allBookings) {
    if (other.id === booking.id) continue;
    if (bookingsOverlap(booking, other)) {
      issues.push({
        code: "booking-conflict",
        message: "This vehicle is already booked for overlapping times.",
        severity: "error",
      });
      break;
    }
  }
  return issues;
}

export function applyFailedInspectionStatus(vehicle: FleetVehicleRecord, passFail: string): FleetVehicleRecord {
  if (passFail === "fail") {
    return { ...vehicle, status: "off_road", updatedBy: "SuperUser" };
  }
  return vehicle;
}

export function kmBetweenOdometerReadings(logs: { odometerReading: number | "" }[]): number | null {
  const values = logs
    .map((l) => (l.odometerReading === "" ? null : Number(l.odometerReading)))
    .filter((v): v is number => v != null && !Number.isNaN(v))
    .sort((a, b) => a - b);
  if (values.length < 2) return null;
  return values[values.length - 1] - values[0];
}
