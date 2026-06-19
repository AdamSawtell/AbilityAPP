import type { AiWriteResult, ChatDisplayAttachment } from "@/lib/ai/types";

export function isPrepareWriteResult(kind: AiWriteResult["kind"]): boolean {
  return kind.endsWith("_prepare");
}

export function attachmentFromWriteResult(writeResult: AiWriteResult): ChatDisplayAttachment {
  return {
    type: "prepare",
    title: "Review and save",
    prepare: {
      label: writeResult.label,
      href: writeResult.href,
      hint: "Open the form, check the pre-filled fields, then click Save. The assistant cannot save for you.",
    },
  };
}
