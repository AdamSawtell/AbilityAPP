import type { AgreementDocumentContext } from "@/lib/document-render-agreement";
import { buildAgreementDocumentHtml } from "@/lib/document-render-agreement";
import type { EmployeeDocumentContext } from "@/lib/document-render-employee";
import { buildEmployeeDocumentHtml } from "@/lib/document-render-employee";
import {
  buildBoardReportDocumentHtml,
  buildEnquiryDocumentHtml,
  buildParticipantStatementHtml,
  buildRemittanceDocumentHtml,
  type BoardReportDocumentContext,
  type EnquiryDocumentContext,
  type ParticipantStatementContext,
  type RemittanceDocumentContext,
} from "@/lib/document-render-extended";
import { buildInvoiceDocumentHtml, type InvoiceDocumentContext } from "@/lib/document-render-invoice";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import {
  documentBlockedByValidation,
  validateDocumentContext,
  type DocumentValidationIssue,
} from "@/lib/document-validation";

export type DocumentRenderContext =
  | InvoiceDocumentContext
  | AgreementDocumentContext
  | EmployeeDocumentContext
  | EnquiryDocumentContext
  | RemittanceDocumentContext
  | ParticipantStatementContext
  | BoardReportDocumentContext;

export type DocumentRenderResult = {
  html: string;
  issues: DocumentValidationIssue[];
  blocked: string | null;
};

function renderWithValidation<T extends DocumentRenderContext>(
  template: DocumentTemplateRecord,
  ctx: T,
  build: (template: DocumentTemplateRecord, ctx: T, options?: { autoPrint?: boolean }) => string,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  const issues = options?.skipValidation ? [] : validateDocumentContext(template, ctx);
  const blocked = options?.skipValidation ? null : documentBlockedByValidation(issues);
  if (blocked) {
    return { html: "", issues, blocked };
  }
  return {
    html: build(template, ctx, options),
    issues,
    blocked: null,
  };
}

export function renderInvoiceDocument(
  template: DocumentTemplateRecord,
  ctx: InvoiceDocumentContext,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  return renderWithValidation(template, ctx, buildInvoiceDocumentHtml, options);
}

export function renderAgreementDocument(
  template: DocumentTemplateRecord,
  ctx: AgreementDocumentContext,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  return renderWithValidation(template, ctx, buildAgreementDocumentHtml, options);
}

export function renderEmployeeDocument(
  template: DocumentTemplateRecord,
  ctx: EmployeeDocumentContext,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  return renderWithValidation(template, ctx, buildEmployeeDocumentHtml, options);
}

export function renderDocument(
  template: DocumentTemplateRecord,
  ctx: DocumentRenderContext,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  if (template.documentClass.startsWith("tax-invoice")) {
    return renderInvoiceDocument(template, ctx as InvoiceDocumentContext, options);
  }
  if (template.documentClass.startsWith("service-agreement")) {
    return renderAgreementDocument(template, ctx as AgreementDocumentContext, options);
  }
  if (template.documentClass.startsWith("hr-contract") || template.documentClass === "hr-letter-offer") {
    return renderEmployeeDocument(template, ctx as EmployeeDocumentContext, options);
  }
  if (template.documentClass === "enquiry-letter") {
    return renderWithValidation(template, ctx as EnquiryDocumentContext, buildEnquiryDocumentHtml, options);
  }
  if (template.documentClass === "remittance-cover") {
    return renderWithValidation(template, ctx as RemittanceDocumentContext, buildRemittanceDocumentHtml, options);
  }
  if (template.documentClass === "participant-statement") {
    return renderWithValidation(template, ctx as ParticipantStatementContext, buildParticipantStatementHtml, options);
  }
  if (template.documentClass === "board-report") {
    return renderWithValidation(template, ctx as BoardReportDocumentContext, buildBoardReportDocumentHtml, options);
  }
  return {
    html: "",
    issues: [{ severity: "error", field: "template", message: "Document class is not supported yet." }],
    blocked: "Document class is not supported yet.",
  };
}

export function openDocumentHtml(html: string): boolean {
  if (typeof window === "undefined" || !html.trim()) return false;
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}

export function downloadDocumentHtml(html: string, fileName: string): void {
  if (typeof window === "undefined" || !html.trim()) return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".html") ? fileName : `${fileName}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** User can Save as PDF from the browser print dialog on the opened document. */
export function printDocumentHtml(html: string): boolean {
  return openDocumentHtml(
    html.replace("</body></html>", "<script>window.onload=()=>window.print();</script></body></html>")
  );
}
