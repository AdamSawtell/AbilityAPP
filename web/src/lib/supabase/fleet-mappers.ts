import type {
  FleetBookingRow,
  FleetFuelLogRow,
  FleetInspectionRow,
  FleetServiceRecordRow,
  FleetVehicleRecord,
} from "@/lib/fleet-vehicle";

export type FleetVehicleRowDb = {
  id: string;
  search_key: string;
  name: string;
  make: string;
  model: string;
  year: number | null;
  vin: string;
  registration_number: string;
  rego_expiry: string | null;
  insurance_policy: string;
  insurance_expiry: string | null;
  location_id: string | null;
  assigned_driver_id: string | null;
  status: string;
  purchase_date: string | null;
  purchase_cost: number | null;
  useful_life_years: number | null;
  residual_value: number | null;
  depreciation_method: string;
  disposal_date: string | null;
  disposal_proceeds: number | null;
  accessibility_features: string;
  modification_notes: string;
  modification_service_due: string | null;
  compliance_notes: string;
  odometer_reading: number | null;
  next_service_due: string | null;
  last_service_date: string | null;
  notes: string;
  created_by: string;
  updated_by: string;
};

export type FleetServiceRecordRowDb = {
  id: string;
  vehicle_id: string;
  line_no: number;
  service_type: string;
  service_date: string | null;
  odometer_reading: number | null;
  cost: number | null;
  cost_status: string;
  provider: string;
  notes: string;
  next_service_due: string | null;
  created_by: string;
  updated_by: string;
};

export type FleetInspectionRowDb = {
  id: string;
  vehicle_id: string;
  employee_id: string | null;
  shift_id: string | null;
  inspection_date: string;
  checklist_results: Record<string, unknown>;
  pass_fail: string;
  odometer_reading: number | null;
  notes: string;
  created_by: string;
};

export type FleetFuelLogRowDb = {
  id: string;
  vehicle_id: string;
  line_no: number;
  employee_id: string | null;
  log_date: string | null;
  odometer_reading: number | null;
  litres: number | null;
  cost: number | null;
  receipt_url: string;
  notes: string;
  created_by: string;
};

export type FleetBookingRowDb = {
  id: string;
  vehicle_id: string;
  employee_id: string | null;
  client_id: string | null;
  location_id: string | null;
  shift_id: string | null;
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  recurring_config: Record<string, unknown> | null;
  status: string;
  created_by: string;
  updated_by: string;
};

function numOrEmpty(value: number | null | undefined): number | "" {
  return value == null ? "" : value;
}

function str(value: string | null | undefined): string {
  return value ?? "";
}

function dateStr(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function fleetServiceRecordFromRow(row: FleetServiceRecordRowDb): FleetServiceRecordRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    serviceType: row.service_type,
    serviceDate: dateStr(row.service_date),
    odometerReading: numOrEmpty(row.odometer_reading),
    cost: numOrEmpty(row.cost),
    costStatus: row.cost_status,
    provider: row.provider,
    notes: row.notes,
    nextServiceDue: dateStr(row.next_service_due),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export function fleetServiceRecordToRow(vehicleId: string, row: FleetServiceRecordRow): FleetServiceRecordRowDb {
  return {
    id: row.id,
    vehicle_id: vehicleId,
    line_no: row.lineNo,
    service_type: row.serviceType,
    service_date: row.serviceDate?.trim() || null,
    odometer_reading: row.odometerReading === "" ? null : Number(row.odometerReading),
    cost: row.cost === "" ? null : Number(row.cost),
    cost_status: row.costStatus || "pending",
    provider: row.provider,
    notes: row.notes,
    next_service_due: row.nextServiceDue?.trim() || null,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
  };
}

export function fleetInspectionFromRow(row: FleetInspectionRowDb): FleetInspectionRow {
  return {
    id: row.id,
    lineNo: 1,
    employeeId: str(row.employee_id),
    shiftId: str(row.shift_id),
    inspectionDate: row.inspection_date,
    checklistResults: (row.checklist_results ?? {}) as Record<string, boolean | string>,
    passFail: row.pass_fail,
    odometerReading: numOrEmpty(row.odometer_reading),
    notes: row.notes,
    createdBy: row.created_by,
  };
}

export function fleetInspectionToRow(vehicleId: string, row: FleetInspectionRow): FleetInspectionRowDb {
  return {
    id: row.id,
    vehicle_id: vehicleId,
    employee_id: row.employeeId?.trim() || null,
    shift_id: row.shiftId?.trim() || null,
    inspection_date: row.inspectionDate || new Date().toISOString(),
    checklist_results: row.checklistResults ?? {},
    pass_fail: row.passFail || "pass",
    odometer_reading: row.odometerReading === "" ? null : Number(row.odometerReading),
    notes: row.notes,
    created_by: row.createdBy,
  };
}

export function fleetFuelLogFromRow(row: FleetFuelLogRowDb): FleetFuelLogRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    employeeId: str(row.employee_id),
    logDate: dateStr(row.log_date),
    odometerReading: numOrEmpty(row.odometer_reading),
    litres: numOrEmpty(row.litres),
    cost: numOrEmpty(row.cost),
    receiptUrl: row.receipt_url,
    notes: row.notes,
    createdBy: row.created_by,
  };
}

export function fleetFuelLogToRow(vehicleId: string, row: FleetFuelLogRow): FleetFuelLogRowDb {
  return {
    id: row.id,
    vehicle_id: vehicleId,
    line_no: row.lineNo,
    employee_id: row.employeeId?.trim() || null,
    log_date: row.logDate?.trim() || null,
    odometer_reading: row.odometerReading === "" ? null : Number(row.odometerReading),
    litres: row.litres === "" ? null : Number(row.litres),
    cost: row.cost === "" ? null : Number(row.cost),
    receipt_url: row.receiptUrl,
    notes: row.notes,
    created_by: row.createdBy,
  };
}

export function fleetBookingFromRow(row: FleetBookingRowDb): FleetBookingRow {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    employeeId: str(row.employee_id),
    clientId: str(row.client_id),
    locationId: str(row.location_id),
    shiftId: str(row.shift_id),
    startDatetime: row.start_datetime,
    endDatetime: row.end_datetime,
    purpose: row.purpose,
    recurringConfig: row.recurring_config,
    status: row.status,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export function fleetBookingToRow(row: FleetBookingRow): FleetBookingRowDb {
  return {
    id: row.id,
    vehicle_id: row.vehicleId,
    employee_id: row.employeeId?.trim() || null,
    client_id: row.clientId?.trim() || null,
    location_id: row.locationId?.trim() || null,
    shift_id: row.shiftId?.trim() || null,
    start_datetime: row.startDatetime,
    end_datetime: row.endDatetime,
    purpose: row.purpose,
    recurring_config: row.recurringConfig,
    status: row.status || "confirmed",
    created_by: row.createdBy,
    updated_by: row.updatedBy,
  };
}

export function fleetVehicleFromRow(
  row: FleetVehicleRowDb,
  children: {
    serviceRecords?: FleetServiceRecordRowDb[];
    inspections?: FleetInspectionRowDb[];
    fuelLogs?: FleetFuelLogRowDb[];
  } = {}
): FleetVehicleRecord {
  return {
    id: row.id,
    searchKey: row.search_key,
    name: row.name,
    make: row.make,
    model: row.model,
    year: numOrEmpty(row.year),
    vin: row.vin,
    registrationNumber: row.registration_number,
    regoExpiry: dateStr(row.rego_expiry),
    insurancePolicy: row.insurance_policy,
    insuranceExpiry: dateStr(row.insurance_expiry),
    locationId: str(row.location_id),
    assignedDriverId: str(row.assigned_driver_id),
    status: row.status,
    purchaseDate: dateStr(row.purchase_date),
    purchaseCost: numOrEmpty(row.purchase_cost),
    usefulLifeYears: numOrEmpty(row.useful_life_years),
    residualValue: numOrEmpty(row.residual_value),
    depreciationMethod: row.depreciation_method,
    disposalDate: dateStr(row.disposal_date),
    disposalProceeds: numOrEmpty(row.disposal_proceeds),
    accessibilityFeatures: row.accessibility_features,
    modificationNotes: row.modification_notes,
    modificationServiceDue: dateStr(row.modification_service_due),
    complianceNotes: row.compliance_notes,
    odometerReading: numOrEmpty(row.odometer_reading),
    nextServiceDue: dateStr(row.next_service_due),
    lastServiceDate: dateStr(row.last_service_date),
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    serviceRecords: (children.serviceRecords ?? []).map(fleetServiceRecordFromRow),
    inspections: (children.inspections ?? []).map(fleetInspectionFromRow),
    fuelLogs: (children.fuelLogs ?? []).map(fleetFuelLogFromRow),
  };
}

export function fleetVehicleToRow(record: FleetVehicleRecord): FleetVehicleRowDb {
  return {
    id: record.id,
    search_key: record.searchKey,
    name: record.name,
    make: record.make,
    model: record.model,
    year: record.year === "" ? null : Number(record.year),
    vin: record.vin,
    registration_number: record.registrationNumber,
    rego_expiry: record.regoExpiry?.trim() || null,
    insurance_policy: record.insurancePolicy,
    insurance_expiry: record.insuranceExpiry?.trim() || null,
    location_id: record.locationId?.trim() || null,
    assigned_driver_id: record.assignedDriverId?.trim() || null,
    status: record.status || "active",
    purchase_date: record.purchaseDate?.trim() || null,
    purchase_cost: record.purchaseCost === "" ? null : Number(record.purchaseCost),
    useful_life_years: record.usefulLifeYears === "" ? null : Number(record.usefulLifeYears),
    residual_value: record.residualValue === "" ? null : Number(record.residualValue),
    depreciation_method: record.depreciationMethod,
    disposal_date: record.disposalDate?.trim() || null,
    disposal_proceeds: record.disposalProceeds === "" ? null : Number(record.disposalProceeds),
    accessibility_features: record.accessibilityFeatures,
    modification_notes: record.modificationNotes,
    modification_service_due: record.modificationServiceDue?.trim() || null,
    compliance_notes: record.complianceNotes,
    odometer_reading: record.odometerReading === "" ? null : Number(record.odometerReading),
    next_service_due: record.nextServiceDue?.trim() || null,
    last_service_date: record.lastServiceDate?.trim() || null,
    notes: record.notes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}
