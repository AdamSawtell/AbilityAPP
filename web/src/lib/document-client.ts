import type { DocumentClass } from "@/lib/document-template";

export async function registerGeneratedDocument(input: {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  batchId?: string;
}): Promise<void> {
  await fetch("/api/documents/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
