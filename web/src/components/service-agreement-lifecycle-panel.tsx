"use client";

import type { AgreementLifecycleIssue } from "@/lib/service-agreement-lifecycle";

export function ServiceAgreementLifecyclePanel({ issues }: { issues: AgreementLifecycleIssue[] }) {
  if (!issues.length) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
        Lifecycle checks passed for this status.
      </p>
    );
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
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
          <span className="font-medium">Warning: </span>
          {issue.message}
        </p>
      ))}
    </div>
  );
}
