import type { AiWriteResult, ChatDisplayAttachment } from "@/lib/ai/types";

export function isPrepareWriteResult(kind: AiWriteResult["kind"]): boolean {
  return kind.endsWith("_prepare");
}

export function attachmentFromWriteResult(writeResult: AiWriteResult): ChatDisplayAttachment {
  const canSaveHere =
    writeResult.kind === "client_activity_prepare" && Boolean(writeResult.draftId);
  return {
    type: "prepare",
    title: "Step 4 — Review and save",
    prepare: {
      label: writeResult.label,
      href: writeResult.href,
      draftId: writeResult.draftId,
      kind: writeResult.kind,
      hint: canSaveHere
        ? "Check the fields below, then click Save activity. You can also open the form to edit before saving."
        : "Open the form, check the pre-filled fields, then click Save. The assistant cannot save for you.",
      preview: writeResult.preview,
    },
  };
}
