import { queueChatNotice } from "@/lib/ai/chat-session-storage";

export function trackAiPrepareSaved(input: {
  userId: string;
  roleId: string;
  draftId?: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  chatMessage?: string;
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

  if (input.chatMessage) {
    queueChatNotice(input.userId, input.roleId, input.chatMessage);
  }
}
