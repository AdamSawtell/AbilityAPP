export type PriceUpdateRunStatus = "draft" | "analysed" | "applied" | "closed" | "error";

export type PriceUpdateClassification =
  | "safe_auto_update"
  | "review_required"
  | "consent_required"
  | "protected"
  | "no_action"
  | "blocked";

export type PriceUpdateDecision = "pending" | "approved" | "ignored" | "blocked";

export type PriceUpdateApplyStatus = "pending" | "applied" | "skipped" | "error" | "protected";

export type PriceUpdateEntityType =
  | "service-agreement"
  | "service-booking"
  | "plan-budget"
  | "monthly-service-plan"
  | "claim"
  | "invoice";

export type PriceUpdateRun = {
  id: string;
  sourceImportBatchId: string;
  status: PriceUpdateRunStatus;
  effectiveStart: string;
  guideYear: string;
  createdBy: string;
  createdAt: string;
  appliedBy: string;
  appliedAt: string;
  closedBy: string;
  closedAt: string;
  scannedCount: number;
  impactCount: number;
  safeCount: number;
  reviewCount: number;
  consentCount: number;
  protectedCount: number;
  blockedCount: number;
  appliedCount: number;
  notes: string;
};

export type PriceUpdateImpact = {
  id: string;
  runId: string;
  entityType: PriceUpdateEntityType;
  entityId: string;
  entityLineId: string;
  clientId: string;
  clientName: string;
  productId: string;
  supportItemNumber: string;
  region: string;
  recordLabel: string;
  recordStatus: string;
  oldPrice: number | null;
  newPrice: number | null;
  deltaAmount: number | null;
  deltaPercent: number | null;
  effectiveStart: string;
  classification: PriceUpdateClassification;
  recommendedAction: string;
  decision: PriceUpdateDecision;
  decisionReason: string;
  approvedBy: string;
  approvedAt: string;
  evidenceRef: string;
  applyStatus: PriceUpdateApplyStatus;
  applyMessage: string;
  taskId: string;
};

export const PRICE_UPDATE_CLASSIFICATION_LABELS: Record<PriceUpdateClassification, string> = {
  safe_auto_update: "Safe auto-update",
  review_required: "Review required",
  consent_required: "Consent required",
  protected: "Protected",
  no_action: "No action",
  blocked: "Blocked",
};

export function entityHref(entityType: PriceUpdateEntityType, entityId: string): string {
  switch (entityType) {
    case "service-agreement":
      return `/service-agreements/${entityId}`;
    case "service-booking":
      return `/service-bookings/${entityId}`;
    case "claim":
      return `/claims/${entityId}`;
    case "invoice":
      return `/invoices/${entityId}`;
    case "plan-budget":
      return entityId ? `/clients/${entityId}?tab=plan-budgets` : "/clients";
    case "monthly-service-plan":
      return `/service-planning?clientId=${entityId.split(":")[0] || entityId}`;
    default:
      return "/";
  }
}
