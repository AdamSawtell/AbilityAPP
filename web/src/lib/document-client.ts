import type { DocumentClass, GeneratedDocumentRecord } from "@/lib/document-template";

export type RegisteredDocument = {
  id: string;
  documentNo: string;
  downloadUrl: string | null;
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
