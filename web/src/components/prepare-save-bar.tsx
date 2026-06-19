import Link from "next/link";
import type { AiWriteResult } from "@/lib/ai/types";

export function PrepareSaveBar({ writeResult }: { writeResult: AiWriteResult }) {
  if (!writeResult.href || !writeResult.kind.endsWith("_prepare")) return null;

  return (
    <div
      className="shrink-0 border-t-2 border-[#f9a8d4] bg-[#fdf2f8] px-3 py-3 shadow-inner"
      data-testid="prepare-save-bar"
    >
      <p className="text-xs font-semibold text-slate-900">Ready for you to review</p>
      <p className="mt-0.5 text-xs text-slate-600">{writeResult.label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Opens the form with fields pre-filled. Check the details, then click Save on the record.
      </p>
      <Link
        href={writeResult.href}
        className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b51266]"
      >
        Open form and save
      </Link>
    </div>
  );
}
