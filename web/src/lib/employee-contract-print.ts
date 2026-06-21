import { newLineId } from "@/lib/client-line-tables";
import { registerGeneratedDocument, type RegisteredDocument } from "@/lib/document-client";
import {
  DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID,
  DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID,
  defaultHrContractCasualTemplate,
  defaultHrContractPtTemplate,
  type DocumentTemplateRecord,
} from "@/lib/document-template";
import { renderDocument } from "@/lib/document-render";
import type { EmployeeDocumentContext } from "@/lib/document-render-employee";
import type { EmployeeDocumentRow, EmployeeRecord } from "@/lib/employee";

export type EmployeeContractPrintContext = EmployeeDocumentContext;

export function resolveEmployeeContractTemplate(
  employee: EmployeeRecord,
  templates: DocumentTemplateRecord[],
  resolveTemplate: (processId: string, entityType: string, templateId?: string) => DocumentTemplateRecord | null,
  templateId?: string
): DocumentTemplateRecord | null {
  if (templateId?.trim()) {
    return templates.find((t) => t.id === templateId && t.active) ?? null;
  }
  const employmentType = employee.employmentType?.trim().toLowerCase() ?? "";
  if (employmentType.includes("part")) {
    return (
      templates.find((t) => t.id === DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID && t.active) ??
      defaultHrContractPtTemplate()
    );
  }
  return (
    resolveTemplate("print-employee-contract", "employee") ??
    templates.find((t) => t.id === DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID && t.active) ??
    defaultHrContractCasualTemplate()
  );
}

export function exportEmployeeContractHtml(
  ctx: EmployeeContractPrintContext,
  template?: DocumentTemplateRecord
): { html: string; templateId: string } | null {
  const resolved = template ?? defaultHrContractCasualTemplate();
  const result = renderDocument(resolved, ctx);
  if (result.blocked || !result.html) return null;
  return { html: result.html, templateId: resolved.id };
}

export function printEmployeeContract(
  ctx: EmployeeContractPrintContext,
  template?: DocumentTemplateRecord
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const resolved = template ?? defaultHrContractCasualTemplate();
    const result = renderDocument(resolved, ctx, { autoPrint: true });
    if (result.blocked || !result.html) return false;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return false;
    win.document.write(result.html);
    win.document.close();
    return true;
  } catch {
    return false;
  }
}

export async function generateEmployeeContract(input: {
  ctx: EmployeeContractPrintContext;
  template: DocumentTemplateRecord;
  existingDocuments: EmployeeDocumentRow[];
}): Promise<{ documentRow: EmployeeDocumentRow; registry: RegisteredDocument | null }> {
  const exported = exportEmployeeContractHtml(input.ctx, input.template);
  if (!exported) {
    throw new Error("Could not generate the contract. Check employee and organisation fields.");
  }

  const { employee } = input.ctx;
  const fileName = `${employee.searchKey.replace(/[^\w.-]+/g, "_")}-contract.html`;
  const registry = await registerGeneratedDocument({
    html: exported.html,
    templateId: exported.templateId,
    documentClass: input.template.documentClass,
    entityType: "employee",
    entityId: employee.id,
    entityLabel: `${employee.searchKey} — ${input.template.name}`,
    fileName,
  });

  const lineNo =
    input.existingDocuments.reduce((max, row) => Math.max(max, row.lineNo ?? 0), 0) + 10;

  const documentRow: EmployeeDocumentRow = {
    id: newLineId("emp-doc"),
    lineNo,
    documentType: "Employment contract",
    name: input.template.name,
    documentRef: registry ? `generated:${registry.id}` : "",
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    status: "Current",
    notes: registry ? `Generated ${registry.documentNo} — viewable in My workplace.` : "Generated contract",
    staffVisible: true,
    requiresAcknowledgement: true,
  };

  return { documentRow, registry };
}
