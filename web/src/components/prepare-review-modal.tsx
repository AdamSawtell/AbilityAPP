"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import type { AiWriteResult } from "@/lib/ai/types";
import { PreparePreviewPanel } from "@/components/prepare-review-preview";

type PrepareReviewModalProps = {
  open: boolean;
  writeResult: AiWriteResult;
  onClose: () => void;
};

export function PrepareReviewModal({ open, writeResult, onClose }: PrepareReviewModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !writeResult.preview) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Close review"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-[#f9a8d4] bg-[#fdf2f8] shadow-2xl"
        data-testid="prepare-review-modal"
      >
        <div className="shrink-0 border-b border-[#f9a8d4]/60 bg-white px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#b51266]">Ready for you</p>
          <h2 id={titleId} className="mt-1 text-lg font-semibold text-slate-900">
            Review activity before saving
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Check the note below. When it looks right, open the form and click Save on the client record.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <PreparePreviewPanel preview={writeResult.preview} />
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#f9a8d4]/60 bg-white px-5 py-4">
          <Link
            href={writeResult.href}
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#d4147a] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b51266]"
          >
            Open form and save
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Review in chat
          </button>
        </div>
      </div>
    </div>
  );
}
