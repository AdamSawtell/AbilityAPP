"use client";

import {
  applyScheduleTemplate,
  SCHEDULE_OF_SUPPORTS_TEMPLATES,
} from "@/lib/service-agreement-templates";
import { sumPlannedAmounts, type ServiceAgreementLine } from "@/lib/service-agreement";

export function ServiceAgreementScheduleSummary({ lines }: { lines: ServiceAgreementLine[] }) {
  const total = sumPlannedAmounts(lines);
  const withProduct = lines.filter((l) => l.productId?.trim()).length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Schedule lines</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{lines.length}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">With product</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{withProduct}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Total planned</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">${total}</p>
      </div>
    </div>
  );
}

export function ServiceAgreementScheduleWizard({
  rows,
  readOnly,
  onApply,
}: {
  rows: ServiceAgreementLine[];
  readOnly?: boolean;
  onApply: (rows: ServiceAgreementLine[]) => void;
}) {
  if (readOnly) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">Schedule of supports templates</p>
      <div className="flex flex-wrap gap-2">
        {SCHEDULE_OF_SUPPORTS_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            title={template.description}
            onClick={() => onApply(applyScheduleTemplate(rows, template))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-[#d4147a]/40 hover:bg-[#fdf2f8] hover:text-[#b51266]"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}
