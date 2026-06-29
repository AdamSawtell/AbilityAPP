import type {
  MaintenanceRequestPriority,
  MaintenanceRequestRecord,
  MaintenanceRequestStatus,
} from "@/lib/maintenance-request";

/** Default cost approval threshold (AUD) — Matt review CA2. */
export const MAINTENANCE_COST_APPROVAL_THRESHOLD = 500;

/** Default cost variance alert threshold — Matt review CA5. */
export const MAINTENANCE_COST_VARIANCE_THRESHOLD = 0.2;

const SLA_RESPOND_HOURS: Record<MaintenanceRequestPriority, number> = {
  urgent: 4,
  high: 24,
  medium: 24 * 7,
  low: 24 * 30,
};

const SLA_ESCALATE_HOURS: Record<MaintenanceRequestPriority, number> = {
  urgent: 8,
  high: 48,
  medium: 24 * 7,
  low: 24 * 30,
};

function parseWhen(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function maintenanceSlaDueAt(record: MaintenanceRequestRecord): string | null {
  const start = parseWhen(record.reportedAt);
  if (start == null) return null;
  const priority = (record.priority || "medium") as MaintenanceRequestPriority;
  const hours = SLA_RESPOND_HOURS[priority] ?? SLA_RESPOND_HOURS.medium;
  return new Date(start + hours * 60 * 60 * 1000).toISOString();
}

export function maintenanceSlaEscalatesAt(record: MaintenanceRequestRecord): string | null {
  const start = parseWhen(record.reportedAt);
  if (start == null) return null;
  const priority = (record.priority || "medium") as MaintenanceRequestPriority;
  const hours = SLA_ESCALATE_HOURS[priority] ?? SLA_ESCALATE_HOURS.medium;
  return new Date(start + hours * 60 * 60 * 1000).toISOString();
}

export function maintenanceSlaBreached(record: MaintenanceRequestRecord, now = Date.now()): boolean {
  if (!isOpenMaintenanceStatus(record.status)) return false;
  const due = parseWhen(maintenanceSlaDueAt(record) ?? undefined);
  return due != null && now > due;
}

export function maintenanceSlaEscalated(record: MaintenanceRequestRecord, now = Date.now()): boolean {
  if (!isOpenMaintenanceStatus(record.status)) return false;
  const due = parseWhen(maintenanceSlaEscalatesAt(record) ?? undefined);
  return due != null && now > due;
}

export function isOpenMaintenanceStatus(status: string): boolean {
  return status !== "closed" && status !== "cancelled" && status !== "resolved";
}

export function maintenanceCalendarDate(record: MaintenanceRequestRecord): string {
  const scheduled = record.scheduledAt?.trim();
  if (scheduled) return scheduled.slice(0, 10);
  return record.reportedAt?.slice(0, 10) ?? "";
}

export function maintenanceRequiresCostApproval(record: MaintenanceRequestRecord): boolean {
  const amount = record.actualCost === "" ? record.estimatedCost : record.actualCost;
  if (amount === "" || amount == null) return false;
  return Number(amount) >= MAINTENANCE_COST_APPROVAL_THRESHOLD;
}

export function maintenanceCostVarianceExceeded(record: MaintenanceRequestRecord): boolean {
  if (record.estimatedCost === "" || record.actualCost === "") return false;
  const estimated = Number(record.estimatedCost);
  const actual = Number(record.actualCost);
  if (!Number.isFinite(estimated) || estimated <= 0) return false;
  return Math.abs(actual - estimated) / estimated > MAINTENANCE_COST_VARIANCE_THRESHOLD;
}

export function validateMaintenanceClose(record: MaintenanceRequestRecord): string | null {
  if (record.status !== "closed") return null;
  if (!record.requestorConfirmedAt?.trim()) {
    return "Requestor confirmation is required before closing.";
  }
  if (record.resolvedAt?.trim() && !record.resolvedAt.trim()) {
    return "Resolved date is required before closing.";
  }
  return null;
}

export function applyMaintenanceLifecycleTimestamps(
  record: MaintenanceRequestRecord,
  previousStatus?: string
): MaintenanceRequestRecord {
  const now = new Date().toISOString();
  const next = { ...record, slaBreached: maintenanceSlaBreached(record) };

  if (next.status === "assigned" && previousStatus === "reported" && !next.assignedEmployeeId && !next.contractorName.trim()) {
    return next;
  }

  if (next.status === "resolved" && !next.resolvedAt?.trim()) {
    next.resolvedAt = now;
  }

  if (next.status === "closed") {
    if (!next.closedAt?.trim()) next.closedAt = now;
    if (!next.resolvedAt?.trim()) next.resolvedAt = now;
  }

  return next;
}

export function canAdvanceMaintenanceStatus(
  record: MaintenanceRequestRecord,
  nextStatus: MaintenanceRequestStatus
): string | null {
  const current = record.status as MaintenanceRequestStatus;
  if (current === nextStatus) return null;

  const allowed: Record<MaintenanceRequestStatus, MaintenanceRequestStatus[]> = {
    reported: ["assigned", "in_progress", "cancelled"],
    assigned: ["in_progress", "resolved", "cancelled"],
    in_progress: ["resolved", "cancelled"],
    resolved: ["closed", "in_progress"],
    closed: [],
    cancelled: [],
  };

  if (!allowed[current]?.includes(nextStatus)) {
    return `Cannot move from ${current.replace(/_/g, " ")} to ${nextStatus.replace(/_/g, " ")}.`;
  }

  if (nextStatus === "assigned" && !record.assignedEmployeeId && !record.contractorName.trim()) {
    return "Assign an employee or enter contractor details before marking assigned.";
  }

  if (nextStatus === "closed" && !record.requestorConfirmedAt?.trim()) {
    return "The original requestor must confirm resolution before closing.";
  }

  return null;
}
