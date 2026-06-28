import { newLineId } from "@/lib/client-line-tables";
import type { GenericTableConfig } from "@/components/line-item-table";
import type {
  FleetFuelLogRow,
  FleetInspectionRow,
  FleetServiceRecordRow,
} from "@/lib/fleet-vehicle";

export const fleetServiceRecordTableConfig: GenericTableConfig<FleetServiceRecordRow> = {
  addLabel: "Add service record",
  emptyMessage: "No service history yet. Log scheduled services, repairs, and inspections.",
  layout: "list-drawer",
  drawerTitle: "Service record",
  listColumnKeys: ["serviceType", "serviceDate", "provider", "costStatus", "nextServiceDue"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "serviceType", label: "Type", type: "select", optionsKey: "fleetServiceType", required: true },
    { key: "serviceDate", label: "Service date", type: "date", required: true },
    { key: "odometerReading", label: "Odometer", type: "number" },
    { key: "provider", label: "Provider", type: "text" },
    { key: "cost", label: "Cost ($)", type: "number" },
    { key: "costStatus", label: "Cost status", type: "select", optionsKey: "fleetServiceCostStatus" },
    { key: "nextServiceDue", label: "Next due", type: "date" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("fleet-svc"),
    lineNo,
    serviceType: "Scheduled",
    serviceDate: "",
    odometerReading: "",
    cost: "",
    costStatus: "pending",
    provider: "",
    notes: "",
    nextServiceDue: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  }),
};

export const fleetFuelLogTableConfig: GenericTableConfig<FleetFuelLogRow> = {
  addLabel: "Add odometer reading",
  emptyMessage: "No odometer readings yet. Capture start/end readings at shift boundaries.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "logDate", label: "Date", type: "date", required: true },
    { key: "employeeId", label: "Driver", type: "select", optionsKey: "employeeId", required: true },
    { key: "odometerReading", label: "Odometer (km)", type: "number", required: true },
    { key: "notes", label: "Notes", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("fleet-fuel"),
    lineNo,
    employeeId: "",
    logDate: new Date().toISOString().slice(0, 10),
    odometerReading: "",
    litres: "",
    cost: "",
    receiptUrl: "",
    notes: "",
    createdBy: "SuperUser",
  }),
};

export const fleetInspectionTableConfig: GenericTableConfig<FleetInspectionRow> = {
  addLabel: "Add inspection",
  emptyMessage: "No pre-start inspections recorded for this vehicle.",
  layout: "list-drawer",
  drawerTitle: "Pre-start inspection",
  listColumnKeys: ["inspectionDate", "passFail", "employeeId", "odometerReading"],
  columns: [
    { key: "inspectionDate", label: "Date/time", type: "date", required: true },
    { key: "employeeId", label: "Inspector", type: "select", optionsKey: "employeeId" },
    { key: "shiftId", label: "Shift", type: "select", optionsKey: "rosterShiftId" },
    { key: "passFail", label: "Result", type: "select", optionsKey: "fleetInspectionResult", required: true },
    { key: "odometerReading", label: "Odometer", type: "number" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("fleet-insp"),
    lineNo,
    employeeId: "",
    shiftId: "",
    inspectionDate: new Date().toISOString().slice(0, 16),
    checklistResults: {},
    passFail: "pass",
    odometerReading: "",
    notes: "",
    createdBy: "SuperUser",
  }),
};
