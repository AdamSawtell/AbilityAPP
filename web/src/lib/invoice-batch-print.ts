import JSZip from "jszip";
import type { ClientRecord } from "@/lib/client";
import { newLineId } from "@/lib/client-line-tables";
import { registerGeneratedDocument, renderAndRegisterPdf } from "@/lib/document-client";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import { htmlFileName, pdfFileName } from "@/lib/document-pdf.client";
import { exportClientInvoiceHtml } from "@/lib/invoice-print";
import type { InvoiceRecord } from "@/lib/invoice";
import type { OrganizationRecord } from "@/lib/organization";

export type BatchPrintFormat = "html" | "pdf";

export type BatchPrintProgress = {
  current: number;
  total: number;
  documentNo: string;
};

export type BatchPrintSkipped = {
  id: string;
  documentNo: string;
  reason: string;
};

export type BatchPrintResult = {
  ok: boolean;
  batchId: string;
  successCount: number;
  skipped: BatchPrintSkipped[];
  message: string;
  format: BatchPrintFormat;
};

export async function batchPrintInvoices(input: {
  invoices: InvoiceRecord[];
  clients: ClientRecord[];
  organization: OrganizationRecord;
  template: DocumentTemplateRecord;
  format?: BatchPrintFormat;
  onProgress?: (progress: BatchPrintProgress) => void;
}): Promise<BatchPrintResult> {
  const { invoices, clients, organization, template, onProgress } = input;
  const format = input.format ?? "html";
  const batchId = newLineId("batch");
  const zip = new JSZip();
  const skipped: BatchPrintSkipped[] = [];
  let successCount = 0;

  for (let index = 0; index < invoices.length; index += 1) {
    const invoice = invoices[index];
    onProgress?.({ current: index + 1, total: invoices.length, documentNo: invoice.documentNo });

    const client = clients.find((row) => row.id === invoice.clientId);
    const exported = exportClientInvoiceHtml({ invoice, client, organization }, template);
    if (!exported) {
      skipped.push({
        id: invoice.id,
        documentNo: invoice.documentNo,
        reason: "Missing fields or organisation profile",
      });
      continue;
    }

    const fileName = format === "pdf" ? pdfFileName(invoice.documentNo) : htmlFileName(invoice.documentNo);

    try {
      if (format === "pdf") {
        const registered = await renderAndRegisterPdf({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: template.documentClass,
          entityType: "invoice",
          entityId: invoice.id,
          entityLabel: invoice.documentNo,
          fileName,
          batchId,
        });
        const pdfBase64 = registered?.pdfBase64;
        if (!pdfBase64) {
          skipped.push({
            id: invoice.id,
            documentNo: invoice.documentNo,
            reason: "PDF generation failed",
          });
          continue;
        }
        zip.file(fileName, Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0)));
      } else {
        await registerGeneratedDocument({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: template.documentClass,
          entityType: "invoice",
          entityId: invoice.id,
          entityLabel: invoice.documentNo,
          fileName,
          batchId,
        });
        zip.file(fileName, exported.html);
      }
      successCount += 1;
    } catch (err) {
      skipped.push({
        id: invoice.id,
        documentNo: invoice.documentNo,
        reason: err instanceof Error ? err.message : "Could not save to document registry",
      });
    }
  }

  if (successCount === 0) {
    return {
      ok: false,
      batchId,
      successCount: 0,
      skipped,
      format,
      message: "No invoices could be generated. Check organisation branding and invoice fields.",
    };
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  const ext = format === "pdf" ? "pdf" : "html";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoices-${stamp}-${batchId.slice(-8)}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);

  const suffix = skipped.length ? ` ${skipped.length} skipped.` : "";
  const label = format === "pdf" ? "PDF" : "HTML";
  return {
    ok: true,
    batchId,
    successCount,
    skipped,
    format,
    message: `Downloaded ${successCount} ${label} invoice${successCount === 1 ? "" : "s"} (batch ${batchId.slice(-8)}).${suffix}`,
  };
}
