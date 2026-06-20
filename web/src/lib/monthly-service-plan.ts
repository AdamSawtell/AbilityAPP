import type { ClientRecord } from "@/lib/client";

export type MonthlyServicePlanLine = {
  id: string;
  lineNo: number;
  supportBudget: string;
  supportCategory: string;
  description: string;
  plannedHours: number;
  plannedAmount: number;
  planBudgetLineId: string;
  notes: string;
};

export type MonthlyServicePlanRecord = {
  id: string;
  clientId: string;
  planMonth: string;
  status: string;
  notes: string;
  lines: MonthlyServicePlanLine[];
  createdBy: string;
  updatedBy: string;
};

export const monthlyServicePlanDropdowns = {
  status: ["Draft", "Approved", "Closed"],
};

export function formatPlanMonthLabel(planMonth: string): string {
  if (!/^\d{4}-\d{2}$/.test(planMonth)) return planMonth;
  const [year, month] = planMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

export function currentPlanMonthIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseNum(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function summarizeMonthlyServicePlan(lines: MonthlyServicePlanLine[]): {
  plannedHours: number;
  plannedAmount: number;
} {
  return {
    plannedHours: lines.reduce((sum, line) => sum + parseNum(line.plannedHours), 0),
    plannedAmount: lines.reduce((sum, line) => sum + parseNum(line.plannedAmount), 0),
  };
}

export function emptyMonthlyServicePlanLine(lineNo: number): MonthlyServicePlanLine {
  const suffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${lineNo}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id: `mspl-${suffix}`,
    lineNo,
    supportBudget: "",
    supportCategory: "",
    description: "",
    plannedHours: 0,
    plannedAmount: 0,
    planBudgetLineId: "",
    notes: "",
  };
}

export function normalizeMonthlyServicePlan(record: MonthlyServicePlanRecord): MonthlyServicePlanRecord {
  return {
    ...record,
    clientId: record.clientId ?? "",
    planMonth: record.planMonth?.slice(0, 7) ?? "",
    status: record.status || "Draft",
    notes: record.notes ?? "",
    lines: (record.lines ?? [])
      .map((line, index) => ({
        ...line,
        lineNo: line.lineNo || index + 1,
        supportBudget: line.supportBudget ?? "",
        supportCategory: line.supportCategory ?? "",
        description: line.description ?? "",
        plannedHours: parseNum(line.plannedHours),
        plannedAmount: parseNum(line.plannedAmount),
        planBudgetLineId: line.planBudgetLineId ?? "",
        notes: line.notes ?? "",
      }))
      .sort((a, b) => a.lineNo - b.lineNo),
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createMonthlyServicePlan(
  partial: Partial<MonthlyServicePlanRecord> & Pick<MonthlyServicePlanRecord, "clientId" | "planMonth">,
  existing: MonthlyServicePlanRecord[] = [],
  actor = "SuperUser"
): MonthlyServicePlanRecord {
  const duplicate = existing.find(
    (plan) => plan.clientId === partial.clientId && plan.planMonth === partial.planMonth
  );
  if (duplicate) {
    throw new Error(`A plan already exists for ${formatPlanMonthLabel(partial.planMonth)}.`);
  }
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `msp-${crypto.randomUUID()}`
      : `msp-${Date.now()}`);
  return normalizeMonthlyServicePlan({
    id,
    clientId: partial.clientId,
    planMonth: partial.planMonth,
    status: partial.status ?? "Draft",
    notes: partial.notes ?? "",
    lines: partial.lines ?? [],
    createdBy: partial.createdBy ?? actor,
    updatedBy: partial.updatedBy ?? actor,
  });
}

export function generateMonthlyPlanFromBudget(
  client: ClientRecord,
  planMonth: string,
  existing: MonthlyServicePlanRecord[],
  actor = "SuperUser"
): MonthlyServicePlanRecord {
  const lines = (client.planBudgets ?? []).map((row, index) => ({
    ...emptyMonthlyServicePlanLine(index + 1),
    supportBudget: row.supportBudget,
    supportCategory: row.supportCategory,
    description: row.description,
    planBudgetLineId: row.id,
  }));
  return createMonthlyServicePlan(
    {
      clientId: client.id,
      planMonth,
      lines,
      notes: `Generated from plan budget for ${client.searchKey}.`,
    },
    existing,
    actor
  );
}

export const initialMonthlyServicePlans: MonthlyServicePlanRecord[] = [
  {
    id: "msp-bern-2025-10",
    clientId: "bp-bern",
    planMonth: "2025-10",
    status: "Draft",
    notes: "October plan — align SIL and community hours with active bookings.",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
    lines: [
      {
        id: "mspl-bern-core-daily",
        lineNo: 1,
        supportBudget: "Core",
        supportCategory: "Assistance with Daily Life",
        description: "Personal care and daily living supports",
        plannedHours: 48,
        plannedAmount: 4200,
        planBudgetLineId: "budget-bern-core-daily",
        notes: "SIL mornings Mon–Wed",
      },
      {
        id: "mspl-bern-core-community",
        lineNo: 2,
        supportBudget: "Core",
        supportCategory: "Social and Community Participation",
        description: "Community access and social activities",
        plannedHours: 24,
        plannedAmount: 1800,
        planBudgetLineId: "budget-bern-core-community",
        notes: "",
      },
    ],
  },
];
