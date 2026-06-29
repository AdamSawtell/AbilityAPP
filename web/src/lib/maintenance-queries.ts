import { isOpenMaintenanceStatus } from "@/lib/maintenance-compliance";
import type { MaintenanceRequestRecord } from "@/lib/maintenance-request";

export function maintenanceRequestsForLocation(
  records: MaintenanceRequestRecord[],
  locationId: string
): MaintenanceRequestRecord[] {
  return filterByLocation(records, locationId).sort((a, b) =>
    (b.reportedAt || "").localeCompare(a.reportedAt || "")
  );
}

export function filterByLocation(records: MaintenanceRequestRecord[], locationId: string) {
  return records.filter((row) => row.locationId === locationId);
}

export function openMaintenanceRequests(records: MaintenanceRequestRecord[]): MaintenanceRequestRecord[] {
  return records.filter((row) => row.status !== "closed" && row.status !== "cancelled");
}

export function overdueMaintenanceWithoutSchedule(
  records: MaintenanceRequestRecord[],
  now = Date.now()
): MaintenanceRequestRecord[] {
  // Match SLA-breach semantics: resolved requests are no longer actionable and
  // must not count as overdue, even though they are still "open" until closed.
  return records.filter((row) => isOpenMaintenanceStatus(row.status)).filter((row) => {
    if (row.scheduledAt?.trim()) return false;
    const due = Date.parse(row.reportedAt);
    if (!Number.isFinite(due)) return false;
    const priorityHours =
      row.priority === "urgent" ? 4 : row.priority === "high" ? 24 : row.priority === "medium" ? 24 * 7 : 24 * 30;
    return now > due + priorityHours * 60 * 60 * 1000;
  });
}
