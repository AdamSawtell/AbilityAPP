import type { ClientActivityDraft } from "@/lib/ai/persist";
import type { AiWriteResult, ChatThreadState, PreparePreview } from "@/lib/ai/types";

function formatActivityDate(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function activityPreviewFromDraft(draft: ClientActivityDraft): PreparePreview {
  return {
    recordType: "Activity note",
    headline: draft.subject,
    fields: [
      { label: "Client", value: `${draft.clientName} (${draft.clientSearchKey})` },
      { label: "Date", value: formatActivityDate(draft.activityDate) },
      { label: "Type", value: draft.activityType || "Note" },
      { label: "Subject", value: draft.subject || "—" },
      { label: "Description", value: draft.description || "—" },
    ],
  };
}

export function previewForWriteResult(
  kind: AiWriteResult["kind"],
  threadState: ChatThreadState
): PreparePreview | undefined {
  if (kind === "client_activity_prepare" && threadState.pendingClientActivityDraft) {
    return activityPreviewFromDraft(threadState.pendingClientActivityDraft);
  }
  return undefined;
}
