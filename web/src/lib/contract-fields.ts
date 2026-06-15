import type { ContractRecord } from "@/lib/contract";

export type ContractFieldDef = {
  key: keyof ContractRecord;
  label: string;
  type: "text" | "date" | "textarea" | "select" | "lookup";
  optionsKey?: string;
  required?: boolean;
  readOnly?: boolean;
};

export const contractHeaderFields: ContractFieldDef[] = [
  { key: "documentNo", label: "Document no.", type: "text", readOnly: true },
  { key: "contractType", label: "Contract type", type: "select", optionsKey: "contractType", required: true },
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "contractTerm", label: "Contract term", type: "select", optionsKey: "contractTerm", required: true },
  { key: "reference", label: "Reference", type: "text" },
  { key: "businessPartnerName", label: "Business partner", type: "lookup", readOnly: true },
  { key: "project", label: "Project", type: "text" },
  { key: "createdBy", label: "Created by", type: "text", readOnly: true },
  { key: "updatedBy", label: "Updated by", type: "text", readOnly: true },
];

export const contractDateFields: ContractFieldDef[] = [
  { key: "executionDate", label: "Execution date", type: "date" },
  { key: "startDate", label: "Start date", type: "date", required: true },
  { key: "endDate", label: "End date", type: "date", required: true },
  { key: "reviewDate", label: "Review date", type: "date", required: true },
];

export const contractTabs = ["Overview", "Audit"] as const;

export type ContractAuditRow = {
  id: string;
  lineNo: number;
  auditDate: string;
  changedBy: string;
  action: string;
  description: string;
};

export type ContractLineCollectionKey = "audit";
