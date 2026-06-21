import { buildInvoiceDocumentHtml, type InvoiceDocumentContext } from "@/lib/document-render-invoice";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import {
  documentBlockedByValidation,
  validateDocumentContext,
  type DocumentValidationIssue,
} from "@/lib/document-validation";

export type DocumentRenderResult = {
  html: string;
  issues: DocumentValidationIssue[];
  blocked: string | null;
};

export function renderInvoiceDocument(
  template: DocumentTemplateRecord,
  ctx: InvoiceDocumentContext,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  const issues = options?.skipValidation ? [] : validateDocumentContext(template, ctx);
  const blocked = options?.skipValidation ? null : documentBlockedByValidation(issues);
  if (blocked) {
    return { html: "", issues, blocked };
  }
  return {
    html: buildInvoiceDocumentHtml(template, ctx, options),
    issues,
    blocked: null,
  };
}

export function renderDocument(
  template: DocumentTemplateRecord,
  ctx: InvoiceDocumentContext,
  options?: { autoPrint?: boolean; skipValidation?: boolean }
): DocumentRenderResult {
  if (template.documentClass.startsWith("tax-invoice")) {
    return renderInvoiceDocument(template, ctx, options);
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
