import type {
  LocationActivityRow,
  LocationAlertRow,
  LocationClientLinkRow,
  LocationEmployeeLinkRow,
  LocationProductLinkRow,
} from "@/lib/location";
import { newLineId, renumberLines } from "@/lib/client-line-tables";
import type { GenericTableConfig } from "@/components/line-item-table";

export { renumberLines };

export const locationAlertTableConfig: GenericTableConfig<LocationAlertRow> = {
  addLabel: "Add alert",
  emptyMessage: "No alerts on this location. Add safety, access, or operational flags for staff.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "alertType", label: "Alert type", type: "select", optionsKey: "locationAlertType", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("loc-alert"),
    lineNo,
    alertType: "Operational",
    showAsAlert: "Yes",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const locationClientLinkTableConfig: GenericTableConfig<LocationClientLinkRow> = {
  addLabel: "Assign client",
  emptyMessage: "No clients linked to this location. Assign support receivers who use this site.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "clientId", label: "Client", type: "select", optionsKey: "clientId", required: true },
    { key: "assignmentRole", label: "Role", type: "select", optionsKey: "locationClientRole", required: true },
    { key: "primaryAssignment", label: "Primary", type: "select", optionsKey: "yesNo" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("loc-cli"),
    lineNo,
    clientId: "",
    assignmentRole: "Resident",
    primaryAssignment: "No",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    notes: "",
  }),
};

export const locationEmployeeLinkTableConfig: GenericTableConfig<LocationEmployeeLinkRow> = {
  addLabel: "Assign employee",
  emptyMessage: "No employees linked to this location. Assign staff who work at this site.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "employeeId", label: "Employee", type: "select", optionsKey: "employeeId", required: true },
    { key: "assignmentRole", label: "Role", type: "select", optionsKey: "locationEmployeeRole", required: true },
    { key: "primaryAssignment", label: "Primary", type: "select", optionsKey: "yesNo" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("loc-emp"),
    lineNo,
    employeeId: "",
    assignmentRole: "Support worker",
    primaryAssignment: "No",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    notes: "",
  }),
};

export const locationProductLinkTableConfig: GenericTableConfig<LocationProductLinkRow> = {
  addLabel: "Add product or service",
  emptyMessage: "No products linked yet. Add services offered at this location from the product catalog.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "productId", label: "Product", type: "select", optionsKey: "productId", required: true },
    { key: "active", label: "Active", type: "select", optionsKey: "yesNo" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("loc-prod"),
    lineNo,
    productId: "",
    active: "Yes",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    notes: "",
  }),
};

export const locationActivityTableConfig: GenericTableConfig<LocationActivityRow> = {
  addLabel: "Add activity",
  emptyMessage: "No activity recorded for this location yet.",
  deletePolicy: "admin-only",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "activityType", label: "Type", type: "select", optionsKey: "locationActivityType", required: true },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "createdBy", label: "Created by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("loc-act"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Note",
    subject: "",
    description: "",
    createdBy: "",
  }),
};
