import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";
import { summarizePlanBudgets } from "@/lib/client-plan-budget";
import type { ServiceBookingRecord } from "@/lib/service-booking";

export type ComplianceSeverity = "error" | "warning";

export type BookingComplianceIssue = {
  code: string;
  message: string;
  severity: ComplianceSeverity;
};

export type BookingComplianceContext = {
  client?: ClientRecord | null;
};

function parseMoney(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function validateServiceBookingCompliance(
  booking: ServiceBookingRecord,
  context: BookingComplianceContext = {}
): BookingComplianceIssue[] {
  const issues: BookingComplianceIssue[] = [];
  const client = context.client;

  if (!booking.clientId?.trim()) {
    issues.push({
      code: "CLIENT_REQUIRED",
      message: "Select a business partner (client) for this service booking.",
      severity: "error",
    });
  } else if (!client) {
    issues.push({
      code: "CLIENT_NOT_FOUND",
      message: "The linked client record could not be found.",
      severity: "error",
    });
  } else if (
    client.lifecycleStatus === "intake" ||
    client.lifecycleStatus === "exit"
  ) {
    issues.push({
      code: "CLIENT_LIFECYCLE",
      message: `Client lifecycle is "${client.lifecycleStatus.replace(/_/g, " ")}" — bookings are usually created for active participants.`,
      severity: "warning",
    });
  }

  if (booking.startDate && booking.endDate && booking.startDate > booking.endDate) {
    issues.push({
      code: "DATES_INVALID",
      message: "Start date must be on or before end date.",
      severity: "error",
    });
  }

  if (client?.dateSupportCeased && booking.endDate && booking.endDate > client.dateSupportCeased) {
    issues.push({
      code: "SUPPORT_CEASED",
      message: "Booking end date is after the client's support ceased date.",
      severity: "error",
    });
  }

  const lineTotal = booking.lines.reduce((sum, line) => sum + parseMoney(line.lineAmount), 0);
  const headerTotal = parseMoney(booking.grandTotal);
  const bookingTotal = headerTotal > 0 ? headerTotal : lineTotal;

  if (booking.lines.length === 0) {
    issues.push({
      code: "LINES_EMPTY",
      message: "Add at least one service booking line before confirming.",
      severity: "warning",
    });
  }

  const budgets = client?.planBudgets ?? [];
  if (budgets.length && bookingTotal > 0) {
    const { overall } = summarizePlanBudgets(budgets);
    if (bookingTotal > overall.remaining) {
      issues.push({
        code: "BUDGET_EXCEEDED",
        message: `Booking total (${bookingTotal.toFixed(2)}) exceeds remaining plan budget (${overall.remaining.toFixed(2)}).`,
        severity: "error",
      });
    } else if (bookingTotal > overall.remaining * 0.9) {
      issues.push({
        code: "BUDGET_NEAR_LIMIT",
        message: "Booking total uses more than 90% of remaining plan budget.",
        severity: "warning",
      });
    }
  }

  for (const line of booking.lines) {
    if (line.startDate && line.endDate && line.startDate > line.endDate) {
      issues.push({
        code: "LINE_DATES_INVALID",
        message: `Line ${line.lineNo}: start date must be on or before end date.`,
        severity: "error",
      });
    }
  }

  return issues;
}

export function bookingComplianceBlocked(issues: BookingComplianceIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export function bookingBudgetRemaining(
  planBudgets: ClientPlanBudgetRow[] | undefined,
  bookingTotal: number
): number | null {
  if (!planBudgets?.length) return null;
  return summarizePlanBudgets(planBudgets).overall.remaining - bookingTotal;
}
