"use client";

import {
  applyPlanBudgetTemplate,
  PLAN_BUDGET_WIZARD_TEMPLATES,
} from "@/lib/client-plan-budget-wizard";
import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";

export function ClientPlanBudgetWizard({
  rows,
  readOnly,
  onApply,
}: {
  rows: ClientPlanBudgetRow[];
  readOnly?: boolean;
  onApply: (rows: ClientPlanBudgetRow[]) => void;
}) {
  if (readOnly) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {PLAN_BUDGET_WIZARD_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          title={template.description}
          onClick={() => onApply(applyPlanBudgetTemplate(rows, template))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-[#d4147a]/40 hover:bg-[#fdf2f8] hover:text-[#b51266]"
        >
          {template.label}
        </button>
      ))}
    </div>
  );
}
