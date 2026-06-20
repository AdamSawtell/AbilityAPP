import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import { newLineId } from "@/lib/client-line-tables";

export type PlanBudgetWizardTemplate = {
  id: string;
  label: string;
  description: string;
  lines: Omit<ClientPlanBudgetRow, "id" | "lineNo">[];
};

export const PLAN_BUDGET_WIZARD_TEMPLATES: PlanBudgetWizardTemplate[] = [
  {
    id: "core-starter",
    label: "Core supports starter",
    description: "Daily life and community participation placeholders — enter allocated amounts from the plan.",
    lines: [
      {
        supportBudget: "Core",
        supportCategory: "Assistance with Daily Life",
        description: "Personal care and daily living",
        ndisLineItemRef: "",
        allocatedAmount: 0,
        claimedAmount: 0,
      },
      {
        supportBudget: "Core",
        supportCategory: "Social and Community Participation",
        description: "Community access",
        ndisLineItemRef: "",
        allocatedAmount: 0,
        claimedAmount: 0,
      },
    ],
  },
  {
    id: "full-plan-scaffold",
    label: "Full plan scaffold",
    description: "Core, Capacity building, and Capital category rows ready for manual entry.",
    lines: [
      {
        supportBudget: "Core",
        supportCategory: "Assistance with Daily Life",
        description: "",
        ndisLineItemRef: "",
        allocatedAmount: 0,
        claimedAmount: 0,
      },
      {
        supportBudget: "Capacity building",
        supportCategory: "Support Coordination",
        description: "",
        ndisLineItemRef: "",
        allocatedAmount: 0,
        claimedAmount: 0,
      },
      {
        supportBudget: "Capital",
        supportCategory: "Assistive Technology",
        description: "",
        ndisLineItemRef: "",
        allocatedAmount: 0,
        claimedAmount: 0,
      },
    ],
  },
];

export function applyPlanBudgetTemplate(
  existing: ClientPlanBudgetRow[],
  template: PlanBudgetWizardTemplate
): ClientPlanBudgetRow[] {
  const startLine = existing.length;
  const added = template.lines.map((line, index) => ({
    id: newLineId("budget"),
    lineNo: startLine + index + 1,
    ...line,
  }));
  return [...existing, ...added].map((row, index) => ({ ...row, lineNo: index + 1 }));
}
