import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import type { MonthlyServicePlanLine } from "@/lib/monthly-service-plan";

/** Planning baseline only — not payroll. Weekday ordinary hourly rates (SACS Award). */
export const SCHADS_PLANNING_LEVELS: Record<string, { label: string; weekdayHourly: number }> = {
  "level-2.1": { label: "Level 2.1", weekdayHourly: 32.52 },
  "level-2.2": { label: "Level 2.2", weekdayHourly: 33.43 },
  "level-3.1": { label: "Level 3.1", weekdayHourly: 34.55 },
};

export const SCHADS_EMPLOYMENT_LOADING: Record<string, number> = {
  "Full-time": 1,
  "Part-time": 1,
  Casual: 1.25,
  Contractor: 1.1,
  Volunteer: 0,
};

export type SchadsLinePrediction = {
  lineId: string;
  lineNo: number;
  supportCategory: string;
  hours: number;
  levelKey: string;
  levelLabel: string;
  hourlyRate: number;
  predictedCost: number;
  plannedRevenue: number;
  margin: number;
};

export type SchadsPlanPrediction = {
  employmentType: string;
  totalHours: number;
  totalPredictedCost: number;
  totalPlannedRevenue: number;
  margin: number;
  marginPct: number | null;
  lines: SchadsLinePrediction[];
};

function parseNum(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function defaultSchadsLevelForCategory(supportCategory: string): string {
  const cat = supportCategory.toLowerCase();
  if (cat.includes("support coordination") || cat.includes("capacity building")) {
    return "level-3.1";
  }
  if (cat.includes("supervisor") || cat.includes("team leader")) {
    return "level-2.2";
  }
  return "level-2.1";
}

export function schadsHourlyRate(levelKey: string, employmentType: string): number {
  const level = SCHADS_PLANNING_LEVELS[levelKey] ?? SCHADS_PLANNING_LEVELS["level-2.1"];
  const loading = SCHADS_EMPLOYMENT_LOADING[employmentType] ?? SCHADS_EMPLOYMENT_LOADING.Casual;
  return Math.round(level.weekdayHourly * loading * 100) / 100;
}

export function predictLineSchadsCost(
  line: MonthlyServicePlanLine,
  employmentType = "Casual",
  levelKey?: string
): SchadsLinePrediction {
  const key = levelKey ?? defaultSchadsLevelForCategory(line.supportCategory);
  const level = SCHADS_PLANNING_LEVELS[key] ?? SCHADS_PLANNING_LEVELS["level-2.1"];
  const hours = parseNum(line.plannedHours);
  const hourlyRate = schadsHourlyRate(key, employmentType);
  const predictedCost = Math.round(hours * hourlyRate * 100) / 100;
  const plannedRevenue = parseNum(line.plannedAmount);

  return {
    lineId: line.id,
    lineNo: line.lineNo,
    supportCategory: line.supportCategory,
    hours,
    levelKey: key,
    levelLabel: level.label,
    hourlyRate,
    predictedCost,
    plannedRevenue,
    margin: Math.round((plannedRevenue - predictedCost) * 100) / 100,
  };
}

export function summarizePlanSchadsPrediction(
  lines: MonthlyServicePlanLine[],
  employmentType = "Casual"
): SchadsPlanPrediction {
  const predictions = lines.map((line) => predictLineSchadsCost(line, employmentType));
  const totalHours = predictions.reduce((sum, row) => sum + row.hours, 0);
  const totalPredictedCost = predictions.reduce((sum, row) => sum + row.predictedCost, 0);
  const totalPlannedRevenue = predictions.reduce((sum, row) => sum + row.plannedRevenue, 0);
  const margin = Math.round((totalPlannedRevenue - totalPredictedCost) * 100) / 100;
  const marginPct =
    totalPlannedRevenue > 0 ? Math.round((margin / totalPlannedRevenue) * 100) : null;

  return {
    employmentType,
    totalHours,
    totalPredictedCost,
    totalPlannedRevenue,
    margin,
    marginPct,
    lines: predictions,
  };
}

export function formatSchadsMarginLabel(margin: number, marginPct: number | null): string {
  const amount = formatPlanBudgetCurrency(margin);
  if (marginPct == null) return amount;
  return `${amount} (${marginPct}% of planned revenue)`;
}
