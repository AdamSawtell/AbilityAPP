import type { DocumentClass } from "@/lib/document-template";
import { renderAndRegisterPdf, type RegisteredDocument } from "@/lib/document-client";

export type DocumentPdfInput = {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  batchId?: string;
};

export function savePdfBlobLocally(pdfBase64: string, fileName: string): void {
  const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Render HTML to PDF, register in document registry, and open download when available. */
export async function downloadDocumentPdf(input: DocumentPdfInput): Promise<RegisteredDocument | null> {
  const registered = await renderAndRegisterPdf(input);
  if (registered?.downloadUrl) {
    window.open(registered.downloadUrl, "_blank", "noopener,noreferrer");
  }
  return registered;
}

export function pdfFileName(base: string): string {
  const safe = base.trim().replace(/[^\w.-]+/g, "_") || "document";
  return safe.endsWith(".pdf") ? safe : `${safe}.pdf`;
}

export function htmlFileName(base: string): string {
  const safe = base.trim().replace(/[^\w.-]+/g, "_") || "document";
  return safe.endsWith(".html") ? safe : `${safe}.html`;
}
