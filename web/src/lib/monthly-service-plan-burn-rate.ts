import type { ClientRecord } from "@/lib/client";
import { formatPlanBudgetCurrency, summarizePlanBudgets, type PlanBudgetTotals } from "@/lib/client-plan-budget";
import type { MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";
import { summarizeMonthlyServicePlan } from "@/lib/monthly-service-plan";

export type PlanPeriodProgress = {
  startDate: string;
  endDate: string;
  elapsedDays: number;
  totalDays: number;
  elapsedPct: number;
  monthsRemaining: number;
};

export type BurnRateSnapshot = {
  budget: PlanBudgetTotals;
  utilisationPct: number | null;
  burnRate: number | null;
  projectedUtilisationPct: number | null;
  projectedRemaining: number | null;
  period: PlanPeriodProgress | null;
};

export type ServicePlanBurnAlert = {
  code: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
};

const MS_PER_DAY = 86_400_000;

function parseIsoDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function inferPlanPeriod(
  client: Pick<ClientRecord, "dateSupportCommencement" | "planReviewDueDate">,
  asOf = new Date()
): PlanPeriodProgress | null {
  const reviewDue = parseIsoDate(client.planReviewDueDate);
  const commencement = parseIsoDate(client.dateSupportCommencement);

  let start: Date;
  let end: Date;

  if (reviewDue && reviewDue > asOf) {
    end = reviewDue;
    start = addMonths(end, -12);
  } else if (commencement) {
    start = commencement;
    end = addMonths(start, 12);
    while (end <= asOf) {
      start = end;
      end = addMonths(start, 12);
    }
  } else {
    return null;
  }

  const totalDays = Math.max(1, daysBetween(start, end));
  const elapsedDays = Math.min(totalDays, daysBetween(start, asOf));
  const elapsedPct = Math.round((elapsedDays / totalDays) * 100);
  const monthsRemaining = Math.max(0, Math.ceil((totalDays - elapsedDays) / 30));

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    elapsedDays,
    totalDays,
    elapsedPct,
    monthsRemaining,
  };
}

export function calculateBurnRateSnapshot(
  client: Pick<ClientRecord, "planBudgets" | "dateSupportCommencement" | "planReviewDueDate">,
  asOf = new Date()
): BurnRateSnapshot {
  const { overall } = summarizePlanBudgets(client.planBudgets ?? []);
  const period = inferPlanPeriod(client, asOf);
  const utilisationPct =
    overall.allocated > 0 ? Math.round((overall.claimed / overall.allocated) * 100) : null;

  let burnRate: number | null = null;
  let projectedUtilisationPct: number | null = null;
  let projectedRemaining: number | null = null;

  if (utilisationPct != null && period && period.elapsedPct > 0) {
    burnRate = Math.round((utilisationPct / period.elapsedPct) * 100) / 100;
    projectedUtilisationPct = Math.min(999, Math.round(burnRate * 100));
    projectedRemaining = Math.max(0, overall.allocated - overall.allocated * (projectedUtilisationPct / 100));
  }

  return {
    budget: overall,
    utilisationPct,
    burnRate,
    projectedUtilisationPct,
    projectedRemaining,
    period,
  };
}

export function buildMonthlyPlanBurnAlerts(
  client: Pick<ClientRecord, "planBudgets" | "dateSupportCommencement" | "planReviewDueDate">,
  plan: MonthlyServicePlanRecord | null | undefined,
  asOf = new Date()
): ServicePlanBurnAlert[] {
  const snapshot = calculateBurnRateSnapshot(client, asOf);
  const alerts: ServicePlanBurnAlert[] = [];
  const { budget, utilisationPct, burnRate, projectedUtilisationPct, period } = snapshot;

  if (period) {
    alerts.push({
      code: "plan-period",
      severity: "info",
      title: "Plan period progress",
      message: `${period.elapsedPct}% of plan period elapsed (${period.elapsedDays} of ${period.totalDays} days). Review due ${period.endDate}.`,
    });
  }

  if (utilisationPct != null) {
    alerts.push({
      code: "utilisation",
      severity: "info",
      title: "Budget utilisation",
      message: `${utilisationPct}% of allocated funding claimed (${formatPlanBudgetCurrency(budget.claimed)} of ${formatPlanBudgetCurrency(budget.allocated)}).`,
    });
  }

  if (utilisationPct != null && period && utilisationPct < 30 && period.elapsedPct >= 50) {
    alerts.push({
      code: "underserviced",
      severity: "warning",
      title: "Participant may be underserviced",
      message: `Plan utilisation is ${utilisationPct}% with ${period.elapsedPct}% of the plan period elapsed — consider additional supports or a plan review.`,
    });
  }

  if (projectedUtilisationPct != null && projectedUtilisationPct > 100) {
    alerts.push({
      code: "overspend-risk",
      severity: "danger",
      title: "Overspend forecast",
      message: `At the current burn rate, funding may be exhausted before plan review (projected ${projectedUtilisationPct}% utilisation).`,
    });
  } else if (burnRate != null && burnRate > 1.15 && period && period.elapsedPct >= 25) {
    alerts.push({
      code: "overspend-pace",
      severity: "warning",
      title: "Spending ahead of pace",
      message: `Burn rate is ${burnRate.toFixed(2)}× plan pace — claimed spend is tracking faster than the plan period.`,
    });
  }

  if (burnRate != null && burnRate < 0.75 && period && period.elapsedPct >= 25 && utilisationPct != null && utilisationPct < 50) {
    alerts.push({
      code: "underspend-pace",
      severity: "info",
      title: "Spending below pace",
      message: `Burn rate is ${burnRate.toFixed(2)}× plan pace — remaining budget may not be fully used unless delivery increases.`,
    });
  }

  const reviewDue = parseIsoDate(client.planReviewDueDate);
  if (reviewDue) {
    const daysUntilReview = daysBetween(asOf, reviewDue);
    if (daysUntilReview >= 0 && daysUntilReview <= 30) {
      alerts.push({
        code: "plan-review-soon",
        severity: "warning",
        title: "Plan review approaching",
        message: `Plan review is due in ${daysUntilReview} day${daysUntilReview === 1 ? "" : "s"} (${client.planReviewDueDate.slice(0, 10)}).`,
      });
    }
  }

  if (plan && period && period.monthsRemaining > 0) {
    const { plannedAmount } = summarizeMonthlyServicePlan(plan.lines);
    const expectedMonthlyPace = budget.remaining / period.monthsRemaining;
    if (plannedAmount > expectedMonthlyPace * 1.2 && expectedMonthlyPace > 0) {
      alerts.push({
        code: "monthly-plan-high",
        severity: "warning",
        title: "Monthly plan exceeds pace",
        message: `Planned spend ${formatPlanBudgetCurrency(plannedAmount)} for this month is above the ${formatPlanBudgetCurrency(expectedMonthlyPace)} pace needed to use remaining budget evenly.`,
      });
    }
  }

  return alerts;
}

export function hasServicePlanBurnWarnings(alerts: ServicePlanBurnAlert[]): boolean {
  return alerts.some((a) => a.severity === "warning" || a.severity === "danger");
}
