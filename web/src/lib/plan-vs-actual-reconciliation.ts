import type { ClaimRecord } from "@/lib/claim";
import { isAgencyManagedClient, isInvoiceManagedClient } from "@/lib/billing-plan-type";
import type { ClientRecord } from "@/lib/client";
import type { InvoiceRecord } from "@/lib/invoice";
import { summarizeMonthlyServicePlan, type MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";
import { shiftDurationHours, type RosterShiftRecord } from "@/lib/roster-shift";
import type { TimesheetRecord } from "@/lib/timesheet";

export const PLAN_RECONCILE_STATUSES = [
  "Matched",
  "Variance",
  "No plan",
  "No actual",
] as const;

export type PlanReconcileStatus = (typeof PLAN_RECONCILE_STATUSES)[number];

export const PLAN_RECONCILE_HOURS_TOLERANCE = 0.5;
export const PLAN_RECONCILE_AMOUNT_TOLERANCE = 1;

export type PlanVsActualRow = {
  clientId: string;
  planMonth: string;
  monthlyPlanId: string;
  monthlyPlanStatus: string;
  plannedHours: number;
  scheduledHours: number;
  plannedAmount: number;
  actualHours: number;
  actualAmount: number;
  rejectedClaimAmount: number;
  hoursVariance: number;
  amountVariance: number;
  reconcileStatus: PlanReconcileStatus;
  reconcileMessage: string;
};

export type PlanVsActualDigest = {
  participantCount: number;
  matchedCount: number;
  varianceCount: number;
  noPlanCount: number;
  noActualCount: number;
  totalPlannedHours: number;
  totalActualHours: number;
  totalPlannedAmount: number;
  totalActualAmount: number;
};

export type PlanVsActualContext = {
  clients: ClientRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  rosterShifts: RosterShiftRecord[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function planMonthDateRange(planMonth: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}$/.test(planMonth)) {
    return { start: "", end: "" };
  }
  const [year, month] = planMonth.split("-").map(Number);
  const start = `${planMonth}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function dateInPlanMonth(date: string, planMonth: string): boolean {
  if (!date?.trim() || !planMonth) return false;
  return date.slice(0, 7) === planMonth.slice(0, 7);
}

function claimCountsForPlanReconciliation(claim: ClaimRecord): boolean {
  return claim.status === "Submitted" || claim.status === "Accepted";
}

function invoiceCountsForPlanReconciliation(invoice: InvoiceRecord): boolean {
  return invoice.status === "Sent" || invoice.status === "Paid";
}

function claimRejected(claim: ClaimRecord): boolean {
  return claim.status === "Rejected" || claim.gatewayStatus === "Rejected";
}

export function scheduledHoursForClientMonth(
  rosterShifts: RosterShiftRecord[],
  clientId: string,
  planMonth: string
): number {
  let hours = 0;
  for (const shift of rosterShifts) {
    if (shift.clientId !== clientId) continue;
    if (!dateInPlanMonth(shift.shiftDate, planMonth)) continue;
    if (shift.status === "Cancelled" || shift.status === "Draft") continue;
    hours += shiftDurationHours(shift);
  }
  return round2(hours);
}

export function rejectedClaimAmountForClientMonth(
  claims: ClaimRecord[],
  clientId: string,
  planMonth: string
): number {
  let amount = 0;
  for (const claim of claims) {
    if (claim.clientId !== clientId) continue;
    if (!claimRejected(claim)) continue;
    for (const line of claim.lines) {
      if (!dateInPlanMonth(line.serviceDate, planMonth)) continue;
      amount += line.lineAmount ?? 0;
    }
  }
  return round2(amount);
}

export function actualDeliveryForClientMonth(
  ctx: PlanVsActualContext,
  clientId: string,
  planMonth: string
): { actualHours: number; actualAmount: number } {
  let actualHours = 0;
  let actualAmount = 0;

  for (const timesheet of ctx.timesheets) {
    if (timesheet.status !== "Approved") continue;
    for (const line of timesheet.lines) {
      if (line.clientId !== clientId) continue;
      if (!dateInPlanMonth(line.shiftDate, planMonth)) continue;
      actualHours += line.hours ?? 0;
    }
  }

  const client = ctx.clients.find((c) => c.id === clientId);

  for (const claim of ctx.claims) {
    if (claim.clientId !== clientId) continue;
    if (!claimCountsForPlanReconciliation(claim)) continue;
    if (!isAgencyManagedClient(client)) continue;
    for (const line of claim.lines) {
      if (!dateInPlanMonth(line.serviceDate, planMonth)) continue;
      actualAmount += line.lineAmount ?? 0;
    }
  }

  for (const invoice of ctx.invoices) {
    if (invoice.clientId !== clientId) continue;
    if (!invoiceCountsForPlanReconciliation(invoice)) continue;
    if (!isInvoiceManagedClient(client)) continue;
    for (const line of invoice.lines) {
      if (!dateInPlanMonth(line.serviceDate, planMonth)) continue;
      actualAmount += line.lineAmount ?? 0;
    }
  }

  return {
    actualHours: round2(actualHours),
    actualAmount: round2(actualAmount),
  };
}

function evaluateReconcileStatus(
  plannedHours: number,
  plannedAmount: number,
  actualHours: number,
  actualAmount: number,
  hasPlan: boolean
): { status: PlanReconcileStatus; message: string } {
  if (!hasPlan) {
    return {
      status: "No plan",
      message: "Delivery recorded with no monthly service plan for this month.",
    };
  }
  if (actualHours <= 0 && actualAmount <= 0) {
    return {
      status: "No actual",
      message: "Monthly plan exists but no approved timesheet or billing lines for this month.",
    };
  }

  const hoursVariance = round2(actualHours - plannedHours);
  const amountVariance = round2(actualAmount - plannedAmount);
  const hoursOk =
    plannedHours > 0
      ? Math.abs(hoursVariance) <= PLAN_RECONCILE_HOURS_TOLERANCE
      : actualHours <= 0;
  const amountOk =
    plannedAmount > 0
      ? Math.abs(amountVariance) <= PLAN_RECONCILE_AMOUNT_TOLERANCE
      : actualAmount <= 0;

  if (hoursOk && amountOk) {
    return { status: "Matched", message: "Planned hours and billed amount align with delivery." };
  }

  const parts: string[] = [];
  if (!hoursOk) {
    parts.push(
      `Hours ${hoursVariance >= 0 ? "+" : ""}${hoursVariance.toFixed(1)}h vs plan (${plannedHours.toFixed(1)}h planned, ${actualHours.toFixed(1)}h delivered)`
    );
  }
  if (!amountOk) {
    parts.push(
      `Amount ${amountVariance >= 0 ? "+" : ""}$${amountVariance.toFixed(2)} vs plan ($${plannedAmount.toFixed(2)} planned, $${actualAmount.toFixed(2)} billed)`
    );
  }
  return { status: "Variance", message: parts.join("; ") };
}

export function buildPlanVsActualRow(
  ctx: PlanVsActualContext,
  planMonth: string,
  clientId: string,
  plan: MonthlyServicePlanRecord | undefined
): PlanVsActualRow {
  const { plannedHours, plannedAmount } = plan
    ? summarizeMonthlyServicePlan(plan.lines)
    : { plannedHours: 0, plannedAmount: 0 };
  const scheduledHours = scheduledHoursForClientMonth(ctx.rosterShifts, clientId, planMonth);
  const { actualHours, actualAmount } = actualDeliveryForClientMonth(ctx, clientId, planMonth);
  const rejectedClaimAmount = rejectedClaimAmountForClientMonth(ctx.claims, clientId, planMonth);
  const hoursVariance = round2(actualHours - plannedHours);
  const amountVariance = round2(actualAmount - plannedAmount);
  const { status, message } = evaluateReconcileStatus(
    plannedHours,
    plannedAmount,
    actualHours,
    actualAmount,
    Boolean(plan)
  );

  const detailParts = [message];
  if (scheduledHours > 0 && Math.abs(scheduledHours - plannedHours) > PLAN_RECONCILE_HOURS_TOLERANCE) {
    detailParts.push(
      `Scheduled ${scheduledHours.toFixed(1)}h on roster vs ${plannedHours.toFixed(1)}h planned`
    );
  }
  if (rejectedClaimAmount > 0) {
    detailParts.push(`Rejected claims $${rejectedClaimAmount.toFixed(2)} this month`);
  }

  return {
    clientId,
    planMonth,
    monthlyPlanId: plan?.id ?? "",
    monthlyPlanStatus: plan?.status ?? "",
    plannedHours: round2(plannedHours),
    scheduledHours,
    plannedAmount: round2(plannedAmount),
    actualHours,
    actualAmount,
    rejectedClaimAmount,
    hoursVariance,
    amountVariance,
    reconcileStatus: status,
    reconcileMessage: detailParts.join("; "),
  };
}

export function buildPlanVsActualRows(ctx: PlanVsActualContext, planMonth: string): PlanVsActualRow[] {
  const rows: PlanVsActualRow[] = [];
  const seenClients = new Set<string>();

  const plansForMonth = ctx.monthlyServicePlans.filter((p) => p.planMonth === planMonth);
  for (const plan of plansForMonth) {
    if (!plan.clientId?.trim()) continue;
    seenClients.add(plan.clientId);
    rows.push(buildPlanVsActualRow(ctx, planMonth, plan.clientId, plan));
  }

  const clientsWithActual = new Set<string>();
  for (const timesheet of ctx.timesheets) {
    if (timesheet.status !== "Approved") continue;
    for (const line of timesheet.lines) {
      if (line.clientId?.trim() && dateInPlanMonth(line.shiftDate, planMonth)) {
        clientsWithActual.add(line.clientId);
      }
    }
  }
  for (const claim of ctx.claims) {
    if (!claimCountsForPlanReconciliation(claim)) continue;
    const client = ctx.clients.find((c) => c.id === claim.clientId);
    if (!isAgencyManagedClient(client)) continue;
    for (const line of claim.lines) {
      if (claim.clientId?.trim() && dateInPlanMonth(line.serviceDate, planMonth)) {
        clientsWithActual.add(claim.clientId);
      }
    }
  }
  for (const invoice of ctx.invoices) {
    if (!invoiceCountsForPlanReconciliation(invoice)) continue;
    const client = ctx.clients.find((c) => c.id === invoice.clientId);
    if (!isInvoiceManagedClient(client)) continue;
    for (const line of invoice.lines) {
      if (invoice.clientId?.trim() && dateInPlanMonth(line.serviceDate, planMonth)) {
        clientsWithActual.add(invoice.clientId);
      }
    }
  }

  for (const clientId of clientsWithActual) {
    if (seenClients.has(clientId)) continue;
    rows.push(buildPlanVsActualRow(ctx, planMonth, clientId, undefined));
  }

  return rows.sort((a, b) => a.clientId.localeCompare(b.clientId));
}

export function summarizePlanVsActual(rows: PlanVsActualRow[]): PlanVsActualDigest {
  return rows.reduce(
    (acc, row) => {
      acc.participantCount += 1;
      if (row.reconcileStatus === "Matched") acc.matchedCount += 1;
      if (row.reconcileStatus === "Variance") acc.varianceCount += 1;
      if (row.reconcileStatus === "No plan") acc.noPlanCount += 1;
      if (row.reconcileStatus === "No actual") acc.noActualCount += 1;
      acc.totalPlannedHours = round2(acc.totalPlannedHours + row.plannedHours);
      acc.totalActualHours = round2(acc.totalActualHours + row.actualHours);
      acc.totalPlannedAmount = round2(acc.totalPlannedAmount + row.plannedAmount);
      acc.totalActualAmount = round2(acc.totalActualAmount + row.actualAmount);
      return acc;
    },
    {
      participantCount: 0,
      matchedCount: 0,
      varianceCount: 0,
      noPlanCount: 0,
      noActualCount: 0,
      totalPlannedHours: 0,
      totalActualHours: 0,
      totalPlannedAmount: 0,
      totalActualAmount: 0,
    }
  );
}

export function planReconcileStatusClass(status: PlanReconcileStatus | string): string {
  switch (status) {
    case "Matched":
      return "bg-emerald-100 text-emerald-950";
    case "Variance":
      return "bg-amber-100 text-amber-950";
    case "No plan":
      return "bg-rose-100 text-rose-950";
    case "No actual":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function planVsActualCsv(rows: PlanVsActualRow[], clients: ClientRecord[]): string {
  const header = [
    "Client",
    "PlanMonth",
    "PlanStatus",
    "PlannedHours",
    "ScheduledHours",
    "PlannedAmount",
    "ActualHours",
    "ActualAmount",
    "RejectedClaims",
    "HoursVariance",
    "AmountVariance",
    "ReconcileStatus",
    "Message",
  ].join(",");
  const lines = rows.map((row) => {
    const client = clients.find((c) => c.id === row.clientId);
    const label = client ? `${client.searchKey} — ${client.name}` : row.clientId;
    return [
      `"${label.replace(/"/g, '""')}"`,
      row.planMonth,
      row.monthlyPlanStatus || "—",
      row.plannedHours.toFixed(2),
      row.scheduledHours.toFixed(2),
      row.plannedAmount.toFixed(2),
      row.actualHours.toFixed(2),
      row.actualAmount.toFixed(2),
      row.rejectedClaimAmount.toFixed(2),
      row.hoursVariance.toFixed(2),
      row.amountVariance.toFixed(2),
      row.reconcileStatus,
      `"${row.reconcileMessage.replace(/"/g, '""')}"`,
    ].join(",");
  });
  return [header, ...lines].join("\r\n");
}
