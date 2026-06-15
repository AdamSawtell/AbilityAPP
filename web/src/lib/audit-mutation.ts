import {
  auditEntityLabels,
  stampRecordAudit,
  type AuditAction,
  type AuditEntityType,
  type AuditStampable,
} from "@/lib/audit";
import { buildChangeSummary, formatChangeDetail } from "@/lib/audit-diff";
import { logRecordAudit } from "@/lib/audit-log";

type Identifiable = AuditStampable & { id: string };

export type AuditLogOptions = {
  skip?: boolean;
  action?: AuditAction;
  summary?: string;
  detail?: string;
};

export function logRecordChange<T extends Identifiable>(
  entityType: AuditEntityType,
  before: T | undefined,
  after: T,
  options?: AuditLogOptions & { isCreate?: boolean }
) {
  if (options?.skip) return;

  const isCreate = options?.isCreate ?? !before;
  const beforeObj = before as Record<string, unknown> | undefined;
  const afterObj = after as Record<string, unknown>;

  const detail = options?.detail ?? formatChangeDetail(entityType, beforeObj, afterObj);
  if (!isCreate && !detail && before && JSON.stringify(before) === JSON.stringify(after)) return;

  const summary =
    options?.summary ?? buildChangeSummary(entityType, beforeObj, afterObj, isCreate);

  const actorName = after.updatedBy || after.createdBy || "System";
  const actorId = after.updatedByUserId || after.createdByUserId || "";

  logRecordAudit(
    entityType,
    after.id,
    options?.action ?? (isCreate ? "created" : "updated"),
    summary,
    { byUserId: actorId, byName: actorName },
    detail
  );
}

/** Stamp audit timestamps and append a change log entry (call outside React state updaters). */
export function persistRecordAudit<T extends Identifiable>(
  entityType: AuditEntityType,
  record: T,
  isCreate: boolean,
  before?: T,
  options?: AuditLogOptions
): T {
  const stamped = stampRecordAudit(record, isCreate);
  logRecordChange(entityType, before, stamped, { ...options, isCreate });
  return stamped;
}

export function auditEntityLabel(entityType: AuditEntityType) {
  return auditEntityLabels[entityType];
}
