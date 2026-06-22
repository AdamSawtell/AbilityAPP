import { newLineId } from "@/lib/client-line-tables";
import { registerGeneratedDocument, type RegisteredDocument } from "@/lib/document-client";
import {
  DEFAULT_HR_SEPARATION_TEMPLATE_ID,
  defaultHrSeparationTemplate,
  type DocumentTemplateRecord,
} from "@/lib/document-template";
import { renderDocument } from "@/lib/document-render";
import type { EmployeeDocumentContext } from "@/lib/document-render-employee";
import type { EmployeeDocumentRow, EmployeeRecord } from "@/lib/employee";

export type EmployeeSeparationPrintContext = EmployeeDocumentContext;

export function resolveEmployeeSeparationTemplate(
  templates: DocumentTemplateRecord[],
  resolveTemplate: (processId: string, entityType: string, templateId?: string) => DocumentTemplateRecord | null,
  templateId?: string
): DocumentTemplateRecord | null {
  if (templateId?.trim()) {
    return templates.find((t) => t.id === templateId && t.active) ?? null;
  }
  return (
    resolveTemplate("print-employee-separation", "employee") ??
    templates.find((t) => t.id === DEFAULT_HR_SEPARATION_TEMPLATE_ID && t.active) ??
    defaultHrSeparationTemplate()
  );
}

export function exportEmployeeSeparationHtml(
  ctx: EmployeeSeparationPrintContext,
  template?: DocumentTemplateRecord
): { html: string; templateId: string } | null {
  const resolved = template ?? defaultHrSeparationTemplate();
  const result = renderDocument(resolved, ctx);
  if (result.blocked || !result.html) return null;
  return { html: result.html, templateId: resolved.id };
}

export function printEmployeeSeparation(
  ctx: EmployeeSeparationPrintContext,
  template?: DocumentTemplateRecord
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const resolved = template ?? defaultHrSeparationTemplate();
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

export async function generateEmployeeSeparation(input: {
  ctx: EmployeeSeparationPrintContext;
  template: DocumentTemplateRecord;
  existingDocuments: EmployeeDocumentRow[];
}): Promise<{ documentRow: EmployeeDocumentRow; registry: RegisteredDocument | null }> {
  const exported = exportEmployeeSeparationHtml(input.ctx, input.template);
  if (!exported) {
    throw new Error("Could not generate the separation letter. Check employee and organisation fields.");
  }

  const { employee } = input.ctx;
  const fileName = `${employee.searchKey.replace(/[^\w.-]+/g, "_")}-separation.html`;
  const registry = await registerGeneratedDocument({
    html: exported.html,
    templateId: exported.templateId,
    documentClass: input.template.documentClass,
    entityType: "employee",
    entityId: employee.id,
    entityLabel: `${employee.searchKey} — Separation letter`,
    fileName,
  });

  const lineNo =
    input.existingDocuments.reduce((max, row) => Math.max(max, row.lineNo ?? 0), 0) + 10;

  const documentRow: EmployeeDocumentRow = {
    id: newLineId("emp-doc"),
    lineNo,
    documentType: "Separation letter",
    name: input.template.name,
    documentRef: registry ? `generated:${registry.id}` : "",
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    status: "Current",
    notes: registry ? `Generated ${registry.documentNo} — viewable in My workplace after save.` : "Generated separation letter",
    staffVisible: true,
    requiresAcknowledgement: false,
  };

  return { documentRow, registry };
}
