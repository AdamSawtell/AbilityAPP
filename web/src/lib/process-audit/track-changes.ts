import type { EmployeeRecord } from "@/lib/employee";
import type { IncidentRecord } from "@/lib/incident";
import type { LocationRecord } from "@/lib/location";
import { trackProcessExecution } from "@/lib/process-audit/track.client";

function linkCountChanged(before: unknown[] | undefined, after: unknown[] | undefined) {
  return (before?.length ?? 0) !== (after?.length ?? 0);
}

export function trackLocationProcessChanges(before: LocationRecord | undefined, after: LocationRecord) {
  if (linkCountChanged(before?.clientLinks, after.clientLinks)) {
    trackProcessExecution({
      processId: "assign-location-client",
      entityType: "location",
      entityId: after.id,
      entityLabel: after.name,
      detail: `${after.clientLinks.length} client link(s)`,
    });
  }
  if (linkCountChanged(before?.employeeLinks, after.employeeLinks)) {
    trackProcessExecution({
      processId: "assign-location-employee",
      entityType: "location",
      entityId: after.id,
      entityLabel: after.name,
      detail: `${after.employeeLinks.length} employee link(s)`,
    });
  }
  if (linkCountChanged(before?.productLinks, after.productLinks)) {
    trackProcessExecution({
      processId: "assign-location-product",
      entityType: "location",
      entityId: after.id,
      entityLabel: after.name,
      detail: `${after.productLinks.length} product link(s)`,
    });
  }
}

export function trackEmployeeCredentialChanges(before: EmployeeRecord | undefined, after: EmployeeRecord) {
  if (linkCountChanged(before?.credentials, after.credentials)) {
    trackProcessExecution({
      processId: "assign-employee-credential",
      entityType: "employee",
      entityId: after.id,
      entityLabel: after.name,
      detail: `${after.credentials.length} credential(s)`,
    });
  }
}

export function trackIncidentProcessChanges(before: IncidentRecord | undefined, after: IncidentRecord, isCreate: boolean) {
  if (isCreate) {
    trackProcessExecution({
      processId: "report-incident",
      entityType: "incident",
      entityId: after.id,
      entityLabel: after.documentNo,
      detail: after.title,
    });
    return;
  }
  if (!before?.ndisNotifiedAt && after.ndisNotifiedAt) {
    trackProcessExecution({
      processId: "notify-ndis-reportable",
      entityType: "incident",
      entityId: after.id,
      entityLabel: after.documentNo,
      detail: after.ndisNotificationRef || "NDIS notification recorded",
    });
  }
}
