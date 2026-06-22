import { registerGeneratedDocument } from "@/lib/document-client";
import type { DocumentClass } from "@/lib/document-template";
import { trackProcessExecution } from "@/lib/process-audit/track.client";
import type { ProcessOutcome } from "@/lib/process-audit/types";

export function auditDocumentProcess(input: {
  processId: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  outcome?: ProcessOutcome;
  detail?: string;
  failureReason?: string;
}) {
  trackProcessExecution({
    processId: input.processId,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    outcome: input.outcome ?? "success",
    detail: input.detail,
    failureReason: input.failureReason,
  });
}

export async function registerDocumentWithAudit(input: {
  processId: string;
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  batchId?: string;
}) {
  const entityLabel = input.entityLabel ?? input.entityId;
  try {
    const registered = await registerGeneratedDocument({
      html: input.html,
      templateId: input.templateId,
      documentClass: input.documentClass,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel,
      fileName: input.fileName,
      batchId: input.batchId,
    });
    auditDocumentProcess({
      processId: input.processId,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel,
      detail: registered?.documentNo ? `Registry ${registered.documentNo}` : "Saved to registry",
    });
    return registered;
  } catch (err) {
    auditDocumentProcess({
      processId: input.processId,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel,
      outcome: "failed",
      failureReason: err instanceof Error ? err.message : "Registry save failed",
    });
    throw err;
  }
}
