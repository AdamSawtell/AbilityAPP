import { defaultReferenceData } from "@/lib/reference-data";

export type FleetVehicleStatus = "active" | "inactive" | "off_road" | "disposed";
export type FleetServiceCostStatus = "pending" | "reviewed" | "approved" | "rejected";
export type FleetBookingStatus = "confirmed" | "cancelled" | "completed";
export type FleetInspectionResult = "pass" | "fail";

export type FleetServiceRecordRow = {
  id: string;
  lineNo: number;
  serviceType: string;
  serviceDate: string;
  odometerReading: number | "";
  cost: number | "";
  costStatus: FleetServiceCostStatus | string;
  provider: string;
  notes: string;
  nextServiceDue: string;
  createdBy: string;
  updatedBy: string;
};

export type FleetInspectionRow = {
  id: string;
  lineNo: number;
  employeeId: string;
  shiftId: string;
  inspectionDate: string;
  checklistResults: Record<string, boolean | string>;
  passFail: FleetInspectionResult | string;
  odometerReading: number | "";
  notes: string;
  createdBy: string;
};

export type FleetFuelLogRow = {
  id: string;
  lineNo: number;
  employeeId: string;
  logDate: string;
  odometerReading: number | "";
  litres: number | "";
  cost: number | "";
  receiptUrl: string;
  notes: string;
  createdBy: string;
};

export type FleetBookingRow = {
  id: string;
  vehicleId: string;
  employeeId: string;
  clientId: string;
  locationId: string;
  shiftId: string;
  maintenanceRequestId: string;
  startDatetime: string;
  endDatetime: string;
  purpose: string;
  recurringConfig: Record<string, unknown> | null;
  status: FleetBookingStatus | string;
  createdBy: string;
  updatedBy: string;
};

export type FleetVehicleRecord = {
  id: string;
  searchKey: string;
  name: string;
  make: string;
  model: string;
  year: number | "";
  vin: string;
  registrationNumber: string;
  regoExpiry: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  locationId: string;
  assignedDriverId: string;
  status: FleetVehicleStatus | string;
  purchaseDate: string;
  purchaseCost: number | "";
  usefulLifeYears: number | "";
  residualValue: number | "";
  depreciationMethod: string;
  disposalDate: string;
  disposalProceeds: number | "";
  accessibilityFeatures: string;
  modificationNotes: string;
  modificationServiceDue: string;
  complianceNotes: string;
  odometerReading: number | "";
  nextServiceDue: string;
  lastServiceDate: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  serviceRecords: FleetServiceRecordRow[];
  inspections: FleetInspectionRow[];
  fuelLogs: FleetFuelLogRow[];
};

export const fleetVehicleStatusOptions: FleetVehicleStatus[] = [
  "active",
  "inactive",
  "off_road",
  "disposed",
];

export const fleetServiceTypeOptions = defaultReferenceData.fleetServiceType ?? [
  "Scheduled",
  "Repair",
  "Inspection",
  "Tyres",
  "Other",
];

export const fleetServiceCostStatusOptions: FleetServiceCostStatus[] = [
  "pending",
  "reviewed",
  "approved",
  "rejected",
];

export const fleetBookingStatusOptions: FleetBookingStatus[] = [
  "confirmed",
  "cancelled",
  "completed",
];

export const fleetInspectionChecklistItems = [
  "Tyres and tread",
  "Lights and indicators",
  "Fuel level",
  "Body damage",
  "Cleanliness",
  "Wheelchair hoist / ramp",
  "First aid kit",
  "Registration visible",
] as const;

export const fleetVehicleTabs = [
  "Overview",
  "Calendar",
  "Registration & insurance",
  "Servicing",
  "Inspections",
  "Bookings",
  "Fuel & mileage",
  "Accessibility & compliance",
  "Incidents",
] as const;

export type FleetVehicleTab = (typeof fleetVehicleTabs)[number];

export type FleetVehicleTabGroup = {
  label: string;
  tabs: FleetVehicleTab[];
};

export const fleetVehicleTabGroups: FleetVehicleTabGroup[] = [
  {
    label: "Core",
    tabs: ["Overview", "Calendar", "Registration & insurance"],
  },
  {
    label: "Operations",
    tabs: ["Servicing", "Inspections", "Bookings", "Fuel & mileage"],
  },
  {
    label: "Compliance",
    tabs: ["Accessibility & compliance", "Incidents"],
  },
];

export const fleetVehicleOverviewFieldKeys = [
  "searchKey",
  "name",
  "make",
  "model",
  "year",
  "vin",
  "status",
  "locationId",
  "assignedDriverId",
  "odometerReading",
  "notes",
] as const;

export const fleetVehicleRegistrationFieldKeys = [
  "registrationNumber",
  "regoExpiry",
  "insurancePolicy",
  "insuranceExpiry",
  "purchaseDate",
  "purchaseCost",
  "usefulLifeYears",
  "residualValue",
  "depreciationMethod",
  "disposalDate",
  "disposalProceeds",
] as const;

export const fleetVehicleComplianceFieldKeys = [
  "accessibilityFeatures",
  "modificationNotes",
  "modificationServiceDue",
  "complianceNotes",
] as const;

export function newFleetVehicleId(): string {
  return `veh-${Date.now()}`;
}

export function createFleetVehicle(partial: Partial<FleetVehicleRecord> = {}): FleetVehicleRecord {
  const id = partial.id ?? newFleetVehicleId();
  return normalizeFleetVehicle({
    id,
    searchKey: partial.searchKey ?? "",
    name: partial.name ?? "New vehicle",
    make: partial.make ?? "",
    model: partial.model ?? "",
    year: partial.year ?? "",
    vin: partial.vin ?? "",
    registrationNumber: partial.registrationNumber ?? "",
    regoExpiry: partial.regoExpiry ?? "",
    insurancePolicy: partial.insurancePolicy ?? "",
    insuranceExpiry: partial.insuranceExpiry ?? "",
    locationId: partial.locationId ?? "",
    assignedDriverId: partial.assignedDriverId ?? "",
    status: partial.status ?? "active",
    purchaseDate: partial.purchaseDate ?? "",
    purchaseCost: partial.purchaseCost ?? "",
    usefulLifeYears: partial.usefulLifeYears ?? "",
    residualValue: partial.residualValue ?? "",
    depreciationMethod: partial.depreciationMethod ?? "straight-line",
    disposalDate: partial.disposalDate ?? "",
    disposalProceeds: partial.disposalProceeds ?? "",
    accessibilityFeatures: partial.accessibilityFeatures ?? "",
    modificationNotes: partial.modificationNotes ?? "",
    modificationServiceDue: partial.modificationServiceDue ?? "",
    complianceNotes: partial.complianceNotes ?? "",
    odometerReading: partial.odometerReading ?? "",
    nextServiceDue: partial.nextServiceDue ?? "",
    lastServiceDate: partial.lastServiceDate ?? "",
    notes: partial.notes ?? "",
    createdBy: partial.createdBy ?? "SuperUser",
    updatedBy: partial.updatedBy ?? "SuperUser",
    serviceRecords: partial.serviceRecords ?? [],
    inspections: partial.inspections ?? [],
    fuelLogs: partial.fuelLogs ?? [],
  });
}

export function normalizeFleetVehicle(record: FleetVehicleRecord): FleetVehicleRecord {
  return {
    ...record,
    serviceRecords: (record.serviceRecords ?? []).map((row, index) => ({
      ...row,
      lineNo: row.lineNo || index + 1,
    })),
    fuelLogs: (record.fuelLogs ?? []).map((row, index) => ({
      ...row,
      lineNo: row.lineNo || index + 1,
    })),
    inspections: (record.inspections ?? []).map((row, index) => ({
      ...row,
      lineNo: row.lineNo || index + 1,
    })),
  };
}

export const initialFleetVehicles: FleetVehicleRecord[] = [
  createFleetVehicle({
    id: "veh-glenelg-01",
    searchKey: "VEH-001",
    name: "Glenelg SIL Van",
    make: "Toyota",
    model: "HiAce",
    year: 2021,
    vin: "JTFSX22P300123456",
    registrationNumber: "S123ABC",
    regoExpiry: "2026-09-15",
    insurancePolicy: "FleetCover-2026",
    insuranceExpiry: "2026-12-01",
    locationId: "loc-glenelg-sil",
    assignedDriverId: "emp-ava-thomas",
    status: "active",
    accessibilityFeatures: "Wheelchair hoist, rear ramp",
    modificationNotes: "Hoist serviced annually",
    odometerReading: 84200,
    nextServiceDue: "2026-08-01",
    lastServiceDate: "2026-02-01",
    notes: "Primary SIL transport vehicle",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    serviceRecords: [],
    inspections: [],
    fuelLogs: [],
  }),
  createFleetVehicle({
    id: "veh-dayhub-01",
    searchKey: "VEH-002",
    name: "Day Hub Bus",
    make: "Mercedes-Benz",
    model: "Sprinter",
    year: 2019,
    vin: "WDB9066331N123456",
    registrationNumber: "S456DEF",
    regoExpiry: "2026-07-20",
    insurancePolicy: "FleetCover-2026",
    insuranceExpiry: "2026-12-01",
    locationId: "loc-day-program",
    assignedDriverId: "",
    status: "active",
    accessibilityFeatures: "Wheelchair positions x2, lap sash harnesses",
    modificationNotes: "Ramp service due Q3",
    odometerReading: 112400,
    nextServiceDue: "2026-07-01",
    lastServiceDate: "2026-01-15",
    notes: "Community access and day program",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    serviceRecords: [],
    inspections: [],
    fuelLogs: [],
  }),
  createFleetVehicle({
    id: "veh-pool-01",
    searchKey: "VEH-003",
    name: "Pool Sedan",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    vin: "JTNB11HK303123456",
    registrationNumber: "S789GHI",
    regoExpiry: "2027-03-01",
    insurancePolicy: "FleetCover-2026",
    insuranceExpiry: "2026-12-01",
    locationId: "",
    assignedDriverId: "",
    status: "off_road",
    odometerReading: 45600,
    lastServiceDate: "2025-11-01",
    notes: "Off road pending panel repair",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    serviceRecords: [],
    inspections: [],
    fuelLogs: [],
  }),
];

export function findFleetVehicleByRouteId(
  vehicles: FleetVehicleRecord[],
  routeId: string
): FleetVehicleRecord | undefined {
  const key = decodeURIComponent(routeId.trim());
  if (!key) return undefined;
  return vehicles.find((v) => v.id === key || v.searchKey === key);
}

export function fleetVehicleLabel(vehicle: FleetVehicleRecord): string {
  return `${vehicle.searchKey} — ${vehicle.name}`;
}

export function daysUntilDate(isoDate: string): number | null {
  if (!isoDate?.trim()) return null;
  const target = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export type FleetExpiryAlert = {
  kind: "registration" | "insurance" | "service" | "modification";
  daysUntil: number;
  date: string;
  label: string;
};

export function fleetVehicleExpiryAlerts(vehicle: FleetVehicleRecord, now = new Date()): FleetExpiryAlert[] {
  void now;
  const alerts: FleetExpiryAlert[] = [];
  const push = (kind: FleetExpiryAlert["kind"], date: string, label: string) => {
    const daysUntil = daysUntilDate(date);
    if (daysUntil === null || daysUntil > 30) return;
    alerts.push({ kind, daysUntil, date, label });
  };
  push("registration", vehicle.regoExpiry, "Registration expiry");
  push("insurance", vehicle.insuranceExpiry, "Insurance expiry");
  push("service", vehicle.nextServiceDue, "Service due");
  push("modification", vehicle.modificationServiceDue, "Modification service due");
  return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function fleetVehicleServiceSummary(vehicle: FleetVehicleRecord): string {
  if (vehicle.status === "off_road") return "Off road";
  const alerts = fleetVehicleExpiryAlerts(vehicle);
  const urgent = alerts.find((a) => a.daysUntil <= 7);
  if (urgent) return `${urgent.label} in ${urgent.daysUntil}d`;
  const warn = alerts.find((a) => a.daysUntil <= 14);
  if (warn) return `${warn.label} in ${warn.daysUntil}d`;
  if (vehicle.nextServiceDue) return `Next service ${vehicle.nextServiceDue}`;
  return vehicle.status === "active" ? "Current" : String(vehicle.status);
}

/** Empty booking row — same defaults as the Fleet → Bookings tab. */
export function createEmptyFleetBooking(partial: Partial<FleetBookingRow> = {}): FleetBookingRow {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return {
    id: partial.id ?? `fleet-book-${Date.now()}`,
    vehicleId: partial.vehicleId ?? "",
    employeeId: partial.employeeId ?? "",
    clientId: partial.clientId ?? "",
    locationId: partial.locationId ?? "",
    shiftId: partial.shiftId ?? "",
    maintenanceRequestId: partial.maintenanceRequestId ?? "",
    startDatetime: partial.startDatetime ?? start.toISOString().slice(0, 16),
    endDatetime: partial.endDatetime ?? end.toISOString().slice(0, 16),
    purpose: partial.purpose ?? "Transport",
    recurringConfig: partial.recurringConfig ?? null,
    status: partial.status ?? "confirmed",
    createdBy: partial.createdBy ?? "",
    updatedBy: partial.updatedBy ?? "",
  };
}

/**
 * Add hours to a `datetime-local` wall-time string (YYYY-MM-DDTHH:MM) without
 * any UTC conversion, so prefilled booking windows keep the visit's local time.
 */
function addHoursToWallTime(wall: string, hours: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wall.trim());
  if (!match) return wall;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (Number.isNaN(date.getTime())) return wall;
  date.setHours(date.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Prefill a maintenance visit booking from the request record. */
export function fleetBookingPrefillFromMaintenance(input: {
  maintenanceRequestId: string;
  documentNo: string;
  title: string;
  locationId: string;
  assignedEmployeeId: string;
  scheduledAt: string;
  actor: string;
}): Partial<FleetBookingRow> {
  const purpose = input.title?.trim()
    ? `Maintenance — ${input.title.trim()}`
    : `Maintenance visit — ${input.documentNo || input.maintenanceRequestId}`;
  const partial: Partial<FleetBookingRow> = {
    maintenanceRequestId: input.maintenanceRequestId,
    locationId: input.locationId,
    employeeId: input.assignedEmployeeId,
    purpose,
    createdBy: input.actor,
    updatedBy: input.actor,
  };
  if (input.scheduledAt?.trim()) {
    // scheduledAt is a wall-time string; keep it as-is and add 2h locally.
    const start = input.scheduledAt.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(start)) {
      partial.startDatetime = start;
      partial.endDatetime = addHoursToWallTime(start, 2);
    }
  }
  return partial;
}
