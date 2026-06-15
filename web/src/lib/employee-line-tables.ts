import type { EmployeeCredentialRow } from "@/lib/employee";
import { newLineId } from "@/lib/client-line-tables";
import type { GenericTableConfig } from "@/components/line-item-table";

export const credentialTypeOptions = [
  "NDIS Worker Screening",
  "Working with Children Check",
  "Police Check",
  "First Aid Certificate",
  "Manual Handling",
  "Driver Licence",
  "Qualification",
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
