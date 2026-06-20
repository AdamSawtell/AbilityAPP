import type { GenericTableConfig } from "@/components/line-item-table";
import { emptyMonthlyServicePlanLine, type MonthlyServicePlanLine } from "@/lib/monthly-service-plan";

export const monthlyServicePlanLineTableConfig: GenericTableConfig<MonthlyServicePlanLine> = {
  addLabel: "Add plan line",
  emptyMessage: "No plan lines yet. Generate from plan budget or add lines manually.",
  columns: [
    { key: "supportBudget", label: "Support budget", type: "select", optionsKey: "ndisSupportBudget", required: true },
    {
      key: "supportCategory",
      label: "Support category",
      type: "select",
      optionsKey: "ndisSupportCategory",
      required: true,
    },
    { key: "description", label: "Description", type: "text" },
    { key: "plannedHours", label: "Planned hours", type: "number" },
    { key: "plannedAmount", label: "Planned ($)", type: "number" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  emptyRow: (lineNo) => emptyMonthlyServicePlanLine(lineNo),
};
