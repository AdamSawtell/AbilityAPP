import type { MonthlyServicePlanLine, MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";

export type MonthlyServicePlanRow = {
  id: string;
  client_id: string;
  plan_month: string;
  status: string;
  notes: string;
  created_by: string;
  updated_by: string;
};

export type MonthlyServicePlanLineRowDb = {
  id: string;
  monthly_service_plan_id: string;
  line_no: number;
  support_budget: string;
  support_category: string;
  description: string;
  planned_hours: number;
  planned_amount: number;
  plan_budget_line_id: string | null;
  notes: string;
};

export function monthlyServicePlanFromRow(
  row: MonthlyServicePlanRow,
  lines: MonthlyServicePlanLineRowDb[]
): MonthlyServicePlanRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    planMonth: row.plan_month,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lines: lines.map((line) => ({
      id: line.id,
      lineNo: line.line_no,
      supportBudget: line.support_budget,
      supportCategory: line.support_category,
      description: line.description,
      plannedHours: Number(line.planned_hours) || 0,
      plannedAmount: Number(line.planned_amount) || 0,
      planBudgetLineId: line.plan_budget_line_id ?? "",
      notes: line.notes,
    })),
  };
}

export function monthlyServicePlanToRow(record: MonthlyServicePlanRecord): MonthlyServicePlanRow {
  return {
    id: record.id,
    client_id: record.clientId,
    plan_month: record.planMonth,
    status: record.status,
    notes: record.notes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function monthlyServicePlanLineToRow(
  planId: string,
  line: MonthlyServicePlanLine
): MonthlyServicePlanLineRowDb {
  return {
    id: line.id,
    monthly_service_plan_id: planId,
    line_no: line.lineNo,
    support_budget: line.supportBudget,
    support_category: line.supportCategory,
    description: line.description,
    planned_hours: line.plannedHours,
    planned_amount: line.plannedAmount,
    plan_budget_line_id: line.planBudgetLineId?.trim() ? line.planBudgetLineId : null,
    notes: line.notes,
  };
}
