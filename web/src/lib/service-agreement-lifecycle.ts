import { localDateIso } from "@/lib/booking-cancellation";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";

export const AGREEMENT_LIFECYCLE_STATUSES = [
  "Draft",
  "Sent",
  "Signed",
  "Active",
  "Expiring",
  "Expired",
  "Terminated",
  "Cancelled",
] as const;

export type AgreementLifecycleStatus = (typeof AGREEMENT_LIFECYCLE_STATUSES)[number];

/** Valid forward paths; terminal states have no outbound transitions. */
export const AGREEMENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  Draft: ["Sent", "Cancelled"],
  Sent: ["Signed", "Draft", "Cancelled"],
  Signed: ["Active", "Sent", "Cancelled"],
  Active: ["Expiring", "Terminated", "Cancelled"],
  Expiring: ["Active", "Expired", "Terminated", "Cancelled"],
  Expired: [],
  Terminated: [],
  Cancelled: [],
  Completed: ["Expired"],
};

export type AgreementLifecycleIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

function parseMoney(value: string | undefined): number {
  const n = parseFloat(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function isValidAgreementTransition(from: string, to: string): boolean {
  if (from === to) return true;
  const allowed = AGREEMENT_STATUS_TRANSITIONS[from] ?? AGREEMENT_LIFECYCLE_STATUSES;
  return allowed.includes(to);
}

export function validateServiceAgreementLifecycle(
  record: ServiceAgreementRecord,
  previousStatus?: string
): AgreementLifecycleIssue[] {
  const issues: AgreementLifecycleIssue[] = [];
  const status = record.status?.trim() || "Draft";
  const prev = previousStatus?.trim() || status;

  if (prev !== status && !isValidAgreementTransition(prev, status)) {
    issues.push({
      code: "STATUS_TRANSITION_INVALID",
      message: `Cannot change status from "${prev}" to "${status}". Follow the lifecycle: Draft → Sent → Signed → Active.`,
      severity: "error",
    });
  }

  if (!record.clientId?.trim()) {
    issues.push({
      code: "CLIENT_REQUIRED",
      message: "Link a client before progressing the agreement lifecycle.",
      severity: "error",
    });
  }

  const linesWithProduct = record.lines.filter((l) => l.productId?.trim());
  if (linesWithProduct.length === 0 && status !== "Draft" && status !== "Cancelled") {
    issues.push({
      code: "LINES_REQUIRED",
      message: "Add at least one schedule line with a product before sending or signing.",
      severity: "error",
    });
  }

  if (["Sent", "Signed", "Active", "Expiring", "Expired"].includes(status) && !record.sentAt?.trim()) {
    issues.push({
      code: "SENT_DATE_REQUIRED",
      message: "Enter or confirm the sent date when status is Sent or later.",
      severity: "error",
    });
  }

  if (["Signed", "Active", "Expiring", "Expired"].includes(status) && !record.signedAt?.trim()) {
    issues.push({
      code: "SIGNED_DATE_REQUIRED",
      message: "Enter the signed date when status is Signed or later.",
      severity: "error",
    });
  }

  if (["Active", "Expiring", "Expired"].includes(status)) {
    if (!record.contractDate?.trim() || !record.finishDate?.trim()) {
      issues.push({
        code: "DATES_REQUIRED",
        message: "Contract and finish dates are required for Active agreements.",
        severity: "error",
      });
    }
    if (!record.activatedAt?.trim()) {
      issues.push({
        code: "ACTIVATED_DATE_REQUIRED",
        message: "Enter the activated date when status is Active or later.",
        severity: "error",
      });
    }
    const pricedLines = record.lines.filter((l) => parseMoney(l.plannedPrice) > 0);
    if (pricedLines.length === 0) {
      issues.push({
        code: "PRICING_REQUIRED",
        message: "Enter planned prices on schedule lines before activating.",
        severity: "error",
      });
    }
  }

  if (status === "Expiring" && record.finishDate) {
    const today = localDateIso();
    const daysUntilFinish = Math.floor(
      (new Date(`${record.finishDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysUntilFinish > 60) {
      issues.push({
        code: "EXPIRING_EARLY",
        message: "Expiring status is usually set within 60 days of finish date.",
        severity: "warning",
      });
    }
  }

  if (record.finishDate && record.contractDate && record.finishDate < record.contractDate) {
    issues.push({
      code: "DATES_INVALID",
      message: "Finish date must be on or after contract date.",
      severity: "error",
    });
  }

  return issues;
}

export function agreementLifecycleBlocked(issues: AgreementLifecycleIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export function applyLifecycleStatusChange(
  record: ServiceAgreementRecord,
  newStatus: string
): ServiceAgreementRecord {
  const today = localDateIso();
  const next = { ...record, status: newStatus };

  if (newStatus === "Sent" && !next.sentAt?.trim()) next.sentAt = today;
  if (newStatus === "Signed" && !next.signedAt?.trim()) next.signedAt = today;
  if (newStatus === "Active" && !next.activatedAt?.trim()) next.activatedAt = today;
  if (newStatus === "Draft") {
    next.sentAt = "";
    next.signedAt = "";
    next.activatedAt = "";
  }

  return next;
}

export function lifecycleStatusTone(status: string): string {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700";
    case "Sent":
      return "bg-sky-100 text-sky-900";
    case "Signed":
      return "bg-indigo-100 text-indigo-900";
    case "Active":
      return "bg-emerald-100 text-emerald-800";
    case "Expiring":
      return "bg-amber-100 text-amber-900";
    case "Expired":
    case "Terminated":
      return "bg-orange-100 text-orange-900";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
