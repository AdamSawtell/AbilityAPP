"use client";

import type { AiWriteResult } from "@/lib/ai/types";
import { PreparePreviewPanel } from "@/components/prepare-review-preview";
import { PrepareSaveActions } from "@/components/prepare-save-actions";

export function PrepareSaveBar({
  writeResult,
  onSaved,
}: {
  writeResult: AiWriteResult;
  onSaved?: (result: { clientName?: string; subject?: string; href?: string }) => void;
}) {
  if (!writeResult.href || !writeResult.kind.endsWith("_prepare")) return null;

  const canSaveHere =
    writeResult.kind === "client_activity_prepare" && Boolean(writeResult.draftId);

  return (
    <div
      className="shrink-0 border-t-2 border-[#f9a8d4] bg-[#fdf2f8] px-3 py-3 shadow-inner"
      data-testid="prepare-save-bar"
    >
      <p className="text-xs font-semibold text-slate-900">Ready for you to review</p>
      <p className="mt-0.5 text-xs text-slate-600">{writeResult.label}</p>
      {writeResult.preview ? (
        <div className="mt-2">
          <PreparePreviewPanel preview={writeResult.preview} compact />
        </div>
      ) : (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Opens the form with fields pre-filled. Check the details, then click Save on the record.
        </p>
      )}
      <PrepareSaveActions
        draftId={writeResult.draftId}
        href={writeResult.href}
        kind={writeResult.kind}
        layout="bar"
        onSaved={onSaved}
      />
      {canSaveHere ? (
        <p className="mt-2 text-[10px] text-slate-500">Save here logs the note immediately — no need to find Save on the client page.</p>
      ) : null}
    </div>
  );
}
