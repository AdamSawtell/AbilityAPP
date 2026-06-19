import type { AuthSession } from "@/lib/access/types";
import { recordProcessExecution } from "@/lib/process-audit/server";

export async function logAiPrepareCreated(
  session: AuthSession,
  input: {
    draftId: string;
    entityType: string;
    entityLabel: string;
    targetRoute: string;
  }
) {
  await recordProcessExecution({
    session,
    processId: "ai-prepare-record",
    outcome: "success",
    entityType: input.entityType,
    entityId: input.draftId,
    entityLabel: input.entityLabel,
    detail: `Prepared ${input.entityType} for review at ${input.targetRoute}`,
  });
}

export async function logAiPrepareSaved(
  session: AuthSession,
  input: {
    draftId?: string;
    entityType: string;
    entityId: string;
    entityLabel: string;
  }
) {
  await recordProcessExecution({
    session,
    processId: "ai-prepare-record",
    outcome: "success",
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    detail: input.draftId
      ? `Human saved ${input.entityType} from AI draft ${input.draftId}`
      : `Human saved ${input.entityType}`,
  });
}
