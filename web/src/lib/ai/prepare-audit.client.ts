export function trackAiPrepareSaved(input: {
  draftId?: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
}) {
  void fetch("/api/system/process-audit/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      processId: "ai-prepare-record",
      outcome: "success",
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      detail: input.draftId
        ? `Human saved ${input.entityType} from AI draft ${input.draftId}`
        : `Human saved ${input.entityType}`,
    }),
  }).catch(() => {
    /* non-blocking */
  });
}
