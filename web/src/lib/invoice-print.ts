import type { ClientRecord } from "@/lib/client";
import { DEFAULT_INVOICE_TEMPLATE_ID, defaultInvoiceTemplate, type DocumentTemplateRecord } from "@/lib/document-template";
import { renderDocument } from "@/lib/document-render";
import type { InvoiceDocumentContext } from "@/lib/document-render-invoice";

export type InvoicePrintContext = InvoiceDocumentContext;

export function buildInvoicePrintHtml(
  ctx: InvoicePrintContext,
  template: DocumentTemplateRecord = defaultInvoiceTemplate()
): string {
  const result = renderDocument(template, ctx);
  if (result.blocked) {
    throw new Error(result.blocked);
  }
  return result.html;
}

export function printClientInvoice(
  ctx: InvoicePrintContext,
  template?: DocumentTemplateRecord
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const resolved = template ?? defaultInvoiceTemplate();
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

export function exportClientInvoiceHtml(
  ctx: InvoicePrintContext,
  template?: DocumentTemplateRecord
): { html: string; templateId: string } | null {
  const resolved = template ?? defaultInvoiceTemplate();
  const result = renderDocument(resolved, ctx);
  if (result.blocked || !result.html) return null;
  return { html: result.html, templateId: resolved.id || DEFAULT_INVOICE_TEMPLATE_ID };
}
