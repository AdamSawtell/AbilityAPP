import type { DocumentClass, GeneratedDocumentRecord } from "@/lib/document-template";

export type RegisteredDocument = {
  id: string;
  documentNo: string;
  downloadUrl: string | null;
  pdfBase64?: string;
};

export async function registerGeneratedDocument(input: {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  batchId?: string;
}): Promise<RegisteredDocument | null> {
  const res = await fetch("/api/documents/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = "Could not save to document registry";
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload.error?.trim()) message = payload.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  try {
    const payload = (await res.json()) as { record?: GeneratedDocumentRecord; downloadUrl?: string | null };
    if (!payload.record?.id) return null;
    return {
      id: payload.record.id,
      documentNo: payload.record.documentNo,
      downloadUrl: payload.downloadUrl ?? null,
    };
  } catch {
    return null;
  }
}

export async function renderAndRegisterPdf(input: {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  batchId?: string;
}): Promise<RegisteredDocument | null> {
  const res = await fetch("/api/documents/render-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = "Could not generate PDF";
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload.error?.trim()) message = payload.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  try {
    const payload = (await res.json()) as {
      record?: GeneratedDocumentRecord;
      downloadUrl?: string | null;
      localOnly?: boolean;
      pdfBase64?: string;
    };
    if (payload.localOnly && payload.pdfBase64) {
      const bytes = Uint8Array.from(atob(payload.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = input.fileName?.replace(/\.html$/i, ".pdf") || "document.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      return null;
    }
    if (!payload.record?.id) return null;
    return {
      id: payload.record.id,
      documentNo: payload.record.documentNo,
      downloadUrl: payload.downloadUrl ?? null,
      pdfBase64: payload.pdfBase64,
    };
  } catch {
    return null;
  }
}
