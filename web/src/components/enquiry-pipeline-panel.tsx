"use client";

import {
  ENQUIRY_PIPELINE_LABELS,
  ENQUIRY_PIPELINE_STATUSES,
  type EnquiryPipelineIssue,
  normalizeEnquiryStatus,
} from "@/lib/enquiry-pipeline";

export function EnquiryPipelinePanel({
  status,
  issues,
}: {
  status: string;
  issues: EnquiryPipelineIssue[];
}) {
  const current = normalizeEnquiryStatus(status);
  const currentIndex = ENQUIRY_PIPELINE_STATUSES.indexOf(current);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Intake pipeline</p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {ENQUIRY_PIPELINE_STATUSES.map((stage, index) => {
            const active = stage === current;
            const complete = currentIndex > index;
            const lost = current === "5_Lost" && stage === "5_Lost";
            const converted = current === "4_Converted" && stage === "4_Converted";
            return (
              <li
                key={stage}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                  active || lost || converted
                    ? "bg-[#fdf2f8] text-[#b51266] ring-[#f9a8d4]/60"
                    : complete
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                      : "bg-slate-50 text-slate-500 ring-slate-200"
                }`}
              >
                {ENQUIRY_PIPELINE_LABELS[stage]}
              </li>
            );
          })}
        </ol>
      </div>

      {errors.length === 0 && warnings.length === 0 ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          Pipeline checks passed for this stage.
        </p>
      ) : (
        <div className="space-y-2">
          {errors.map((issue) => (
            <p
              key={`${issue.code}-${issue.message}`}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950"
            >
              <span className="font-medium">Cannot save: </span>
              {issue.message}
            </p>
          ))}
          {warnings.map((issue) => (
            <p
              key={`${issue.code}-${issue.message}`}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            >
              <span className="font-medium">Reminder: </span>
              {issue.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
