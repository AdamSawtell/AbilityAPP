import {
  auditEntityLabels,
  stampRecordAudit,
  type AuditAction,
  type AuditEntityType,
  type AuditStampable,
} from "@/lib/audit";
import { logRecordAudit } from "@/lib/audit-log";

type Identifiable = AuditStampable & { id: string };

export function persistRecordAudit<T extends Identifiable>(
  entityType: AuditEntityType,
  record: T,
  isCreate: boolean,
  options?: { action?: AuditAction; summary?: string; detail?: string }
): T {
  const stamped = stampRecordAudit(record, isCreate);
  const label = auditEntityLabels[entityType];
  const actorName = stamped.updatedBy || stamped.createdBy || "System";
  const actorId = stamped.updatedByUserId || stamped.createdByUserId || "";

  logRecordAudit(
    entityType,
    stamped.id,
    options?.action ?? (isCreate ? "created" : "updated"),
    options?.summary ?? (isCreate ? `${label} created` : `${label} updated`),
    { byUserId: actorId, byName: actorName },
    options?.detail ?? ""
  );

  return stamped;
}
