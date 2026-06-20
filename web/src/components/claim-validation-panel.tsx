"use client";

import type { ClaimLine } from "@/lib/claim";
import { claimValidationSummary } from "@/lib/claim-papl-validation";

const tone: Record<string, string> = {
  pass: "bg-emerald-100 text-emerald-900",
  warning: "bg-amber-100 text-amber-950",
  error: "bg-rose-100 text-rose-950",
};

export function ClaimValidationPanel({
  lines,
  claimStatus,
}: {
  lines: ClaimLine[];
  claimStatus?: string;
}) {
  const summary = claimValidationSummary(lines);
  const isDraft = !claimStatus || claimStatus === "Draft";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">PAPL validation</h2>
      <p className="mt-1 text-sm text-slate-600">
        Review line-level checks before submitting to PRODA or your NDIS gateway.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lines</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{lines.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Pass</p>
          <p className="mt-1 text-xl font-semibold text-emerald-950">{summary.passCount}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Warnings</p>
          <p className="mt-1 text-xl font-semibold text-amber-950">{summary.warningCount}</p>
        </div>
        <div className="rounded-lg border border-rose-100 bg-rose-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Errors</p>
          <p className="mt-1 text-xl font-semibold text-rose-950">{summary.errorCount}</p>
        </div>
      </div>
      {!summary.canSubmit ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          Fix blocking errors before saving this claim batch.
        </p>
      ) : isDraft && !summary.canGatewaySubmit ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Resolve warnings before gateway submit.
        </p>
      ) : isDraft && summary.canGatewaySubmit ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Ready for gateway submission.
        </p>
      ) : null}
      {lines.some((l) => l.validationMessage) ? (
        <ul className="mt-4 space-y-2">
          {lines
            .filter((l) => l.validationStatus !== "pass")
            .map((line) => (
              <li
                key={line.id}
                className={`rounded-lg px-3 py-2 text-xs ${tone[line.validationStatus] ?? "bg-slate-100 text-slate-800"}`}
              >
                <span className="font-medium">Line {line.lineNo}</span> — {line.validationMessage || "Review required"}
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}
