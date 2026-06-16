import type {
  EmployeeActivityRow,
  EmployeeAlertRow,
  EmployeeCredentialRow,
  EmployeeDocumentRow,
  EmployeeEmergencyContactRow,
  EmployeeLeaveEntitlementRow,
  EmployeeLeaveRequestRow,
  EmployeeLocationRow,
  EmployeeSkillRow,
} from "@/lib/employee";
import { newLineId, renumberLines } from "@/lib/client-line-tables";
import type { GenericTableConfig } from "@/components/line-item-table";

export { renumberLines };

export function emptyEmployeeLocationRow(lineNo: number): EmployeeLocationRow {
  return {
    id: newLineId("emp-loc"),
    lineNo,
    name: "",
    addressType: "Home",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "SA",
    postcode: "",
    country: "Australia",
    phone: "",
    mobile: "",
    email: "",
    primaryAddress: "No",
    active: "Yes",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    accessNotes: "",
    description: "",
  };
}

export function emptyEmergencyContactRow(lineNo: number): EmployeeEmergencyContactRow {
  return {
    id: newLineId("ec"),
    lineNo,
    contactType: "Emergency",
    name: "",
    relationship: "",
    phone: "",
    mobile: "",
    email: "",
    callOrder: lineNo,
    primaryContact: lineNo === 1 ? "Yes" : "No",
    notes: "",
  };
}

export const credentialTypeOptions = [
  "NDIS Worker Screening",
  "Working with Children Check",
  "Police Check",
  "First Aid Certificate",
  "CPR Certificate",
  "Manual Handling",
  "Driver Licence",
  "Visa / work rights",
  "Qualification",
  "Insurance",
  "Other",
] as const;

export const credentialStatusOptions = ["Current", "Expiring soon", "Expired", "Pending", "Revoked"] as const;

export const credentialTableConfig: GenericTableConfig<EmployeeCredentialRow> = {
  addLabel: "Add credential",
  emptyMessage: "No credentials assigned. Add checks, licences, and qualifications for this employee.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "credentialType", label: "Credential type", type: "select", optionsKey: "credentialType", required: true },
    { key: "credentialNumber", label: "Number / ID", type: "text" },
    { key: "issuingBody", label: "Issuing body", type: "text" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "expiryDate", label: "Expiry date", type: "date" },
    { key: "status", label: "Status", type: "select", optionsKey: "credentialStatus" },
    { key: "documentRef", label: "Document ref", type: "text" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[200px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("cred"),
    lineNo,
    credentialType: "",
    credentialNumber: "",
    issuingBody: "",
    issueDate: "",
    expiryDate: "",
    status: "Current",
    documentRef: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  }),
};

export const employeeAlertTableConfig: GenericTableConfig<EmployeeAlertRow> = {
  addLabel: "Add alert",
  emptyMessage: "No manual alerts. System-generated compliance alerts appear when credentials or work rights are due.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "alertType", label: "Alert type", type: "select", optionsKey: "employeeAlertType", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("emp-alert"),
    lineNo,
    alertType: "Operational",
    showAsAlert: "Yes",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    source: "Manual",
  }),
};

export const employeeSkillTableConfig: GenericTableConfig<EmployeeSkillRow> = {
  addLabel: "Add skill or language",
  emptyMessage: "No skills or languages recorded. Add attributes used for roster matching.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "skillType", label: "Type", type: "select", optionsKey: "employeeSkillType", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "proficiency", label: "Proficiency", type: "select", optionsKey: "skillProficiency" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("skill"),
    lineNo,
    skillType: "Skill",
    name: "",
    proficiency: "",
    notes: "",
  }),
};

export const employeeDocumentTableConfig: GenericTableConfig<EmployeeDocumentRow> = {
  addLabel: "Add document",
  emptyMessage: "No HR documents on file. Add contracts, IDs, and signed policies.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "documentType", label: "Document type", type: "select", optionsKey: "employeeDocumentType", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "documentRef", label: "Document ref", type: "text" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "expiryDate", label: "Expiry date", type: "date" },
    { key: "status", label: "Status", type: "select", optionsKey: "employeeDocumentStatus" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("emp-doc"),
    lineNo,
    documentType: "",
    name: "",
    documentRef: "",
    issueDate: "",
    expiryDate: "",
    status: "Current",
    notes: "",
  }),
};

export const employeeActivityTableConfig: GenericTableConfig<EmployeeActivityRow> = {
  addLabel: "Add activity",
  emptyMessage: "No activity logged yet. Record onboarding, training, and HR notes.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "activityType", label: "Type", type: "select", optionsKey: "employeeActivityType" },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "createdBy", label: "Created by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("emp-act"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Note",
    subject: "",
    description: "",
    createdBy: "SuperUser",
  }),
};

export const employeeLeaveTableConfig: GenericTableConfig<EmployeeLeaveEntitlementRow> = {
  addLabel: "Add leave type",
  emptyMessage: "No leave entitlements configured.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "leaveType", label: "Leave type", type: "select", optionsKey: "leaveType", required: true },
    { key: "entitlementDays", label: "Entitlement (days)", type: "number" },
    { key: "balanceDays", label: "Balance (days)", type: "number" },
    { key: "accrualNotes", label: "Accrual notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("leave"),
    lineNo,
    leaveType: "",
    entitlementDays: 0,
    balanceDays: 0,
    accrualNotes: "",
  }),
};

export const employeeLeaveRequestTableConfig: GenericTableConfig<EmployeeLeaveRequestRow> = {
  addLabel: "Add leave request",
  emptyMessage: "No leave requests yet. Add date-based leave to show in personal and organisation calendars.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "leaveType", label: "Leave type", type: "select", optionsKey: "leaveType", required: true },
    { key: "startDate", label: "Start date", type: "date", required: true },
    { key: "endDate", label: "End date", type: "date", required: true },
    { key: "daysRequested", label: "Days", type: "number" },
    { key: "status", label: "Status", type: "select", optionsKey: "employeeLeaveStatus", required: true },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[220px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("leave-req"),
    lineNo,
    leaveType: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    daysRequested: 1,
    status: "Requested",
    notes: "",
  }),
};

export const emergencyContactTypeOptions = ["Emergency", "Next of kin"] as const;
export const contactRelationshipOptions = [
  "Spouse",
  "Partner",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Other",
] as const;
