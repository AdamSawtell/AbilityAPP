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
}
