import type { PreparePreview } from "@/lib/ai/types";

export function PreparePreviewPanel({
  preview,
  compact = false,
}: {
  preview: PreparePreview;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border-2 border-[#f9a8d4] bg-white ${
        compact ? "p-2.5" : "p-3"
      }`}
      data-testid="prepare-preview-panel"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
          Draft — not saved
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#b51266]">
          {preview.recordType}
        </span>
      </div>
      <p className={`mt-2 font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}>
        {preview.headline}
      </p>
      <dl className={`mt-3 grid gap-2 ${compact ? "text-xs" : "text-sm"}`}>
        {preview.fields.map((field) => (
          <div key={field.label} className="grid grid-cols-[5.5rem_1fr] gap-2 sm:grid-cols-[6.5rem_1fr]">
            <dt className="font-medium text-slate-500">{field.label}</dt>
            <dd className="whitespace-pre-wrap text-slate-800">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
