import type { ContractAuditRow } from "@/lib/contract-fields";
import { newLineId } from "@/lib/client-line-tables";

export type ContractLineColumnDef<TRow extends { id: string }> = {
  key: keyof TRow & string;
  label: string;
  type: "text" | "date" | "select" | "textarea" | "number";
  optionsKey?: string;
  required?: boolean;
  className?: string;
};

export type ContractLineCollectionKey = "audit";

export type ContractTabTableConfig<TRow extends { id: string }> = {
  collectionKey: ContractLineCollectionKey;
  columns: ContractLineColumnDef<TRow>[];
  emptyRow: (lineNo: number) => TRow;
  addLabel?: string;
  emptyMessage?: string;
};

export const auditTableConfig: ContractTabTableConfig<ContractAuditRow> = {
  collectionKey: "audit",
  addLabel: "Add audit entry",
  emptyMessage: "No audit history yet.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "auditDate", label: "Date", type: "date", required: true },
    { key: "changedBy", label: "Changed by", type: "text" },
    { key: "action", label: "Action", type: "select", optionsKey: "auditAction" },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("audit"),
    lineNo,
    auditDate: new Date().toISOString().slice(0, 10),
    changedBy: "SuperUser",
    action: "Updated",
    description: "",
  }),
};

export const contractTabTableConfigs = {
  Audit: auditTableConfig,
} as const;

export type ContractTabWithTable = keyof typeof contractTabTableConfigs;
