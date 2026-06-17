import type { IncidentRecord, IncidentStatus } from "@/lib/incident";

export type IncidentManagerReviewAccess = {
  /** Logged-in user's linked employee record id (from employeeBpId). */
  userEmployeeId: string;
  /** Admin / quality override — bypass accountable-manager check. */
  canOverride: boolean;
};

export function canPerformIncidentManagerReview(
  accountableManagerEmployeeId: string | undefined,
  access: IncidentManagerReviewAccess
): boolean {
  if (access.canOverride) return true;
  if (!accountableManagerEmployeeId?.trim() || !access.userEmployeeId?.trim()) return false;
  return access.userEmployeeId === accountableManagerEmployeeId;
}

/** Reportable incidents require manager sign-off before close (unless override). */
export function canCloseReportableIncident(
  record: IncidentRecord,
  access: IncidentManagerReviewAccess
): boolean {
  if (!record.isReportable) return true;
  if (access.canOverride) return true;
  return Boolean(record.managerReviewedAt?.trim());
}

export function isIncidentStatusTransitionAllowed(
  record: IncidentRecord,
  nextStatus: IncidentStatus,
  access: IncidentManagerReviewAccess,
  accountableManagerEmployeeId?: string
): boolean {
  if (nextStatus === record.status) return true;

  const canManage = canPerformIncidentManagerReview(accountableManagerEmployeeId, access);

  if (record.isReportable) {
    if (
      (nextStatus === "Manager reviewed" || nextStatus === "Commission notified") &&
      !canManage
    ) {
      return false;
    }
    if (nextStatus === "Closed" && !canCloseReportableIncident(record, access)) {
      return false;
    }
  }

  return true;
}

export function incidentStatusOptionsForUser(
  record: IncidentRecord,
  access: IncidentManagerReviewAccess,
  accountableManagerEmployeeId?: string
): IncidentStatus[] {
  const all: IncidentStatus[] = [
    "Draft",
    "Submitted",
    "Manager reviewed",
    "Commission notified",
    "Under investigation",
    "Actions in progress",
    "Closed",
  ];
  const allowed = all.filter((status) =>
    isIncidentStatusTransitionAllowed(record, status, access, accountableManagerEmployeeId)
  );
  if (!allowed.includes(record.status)) {
    return [record.status, ...allowed];
  }
  return allowed;
}
