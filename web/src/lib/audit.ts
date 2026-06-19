/** Shared audit metadata for all records, tables, and windows. */

export type AuditEntityType =
  | "enquiry"
  | "client"
  | "location"
  | "employee"
  | "contract"
  | "product"
  | "price-list"
  | "service-agreement"
  | "support-plan"
  | "plan-document"
  | "task"
  | "incident"
  | "organization";

export type AuditAction = "created" | "updated" | "deleted" | "converted" | "assigned" | "status_changed" | "imported";

export type RecordAuditMeta = {
  createdAt: string;
  createdBy: string;
  createdByUserId: string;
  updatedAt: string;
  updatedBy: string;
  updatedByUserId: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  byUserId: string;
  byName: string;
  action: AuditAction;
  summary: string;
  detail: string;
  sessionId?: string;
};

export type AuditStampable = {
  createdAt?: string;
  createdBy?: string;
  createdByUserId?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByUserId?: string;
};

export type AppShellAuditProps =
  | {
      entityType: AuditEntityType;
      entityId: string;
      meta: RecordAuditMeta;
      extraEvents?: AuditEvent[];
    }
  | {
      moduleLabel: string;
    };

export const auditEntityLabels: Record<AuditEntityType, string> = {
  enquiry: "Enquiry",
  client: "Client",
  location: "Location",
  employee: "Employee",
  contract: "Contract",
  product: "Product",
  "price-list": "Price list",
  "service-agreement": "Service agreement",
  "support-plan": "Support plan",
  "plan-document": "Plan document",
  task: "Task",
  incident: "Incident",
  organization: "Organisation",
};

export const auditActionLabels: Record<AuditAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  converted: "Converted",
  assigned: "Assigned",
  status_changed: "Status changed",
  imported: "Imported",
};

export function entityAuditKey(entityType: AuditEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatAuditDateTime(iso: string) {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function auditMetaFrom(record: AuditStampable): RecordAuditMeta {
  const fallback = nowIso();
  return {
    createdAt: record.createdAt || fallback,
    createdBy: record.createdBy || "—",
    createdByUserId: record.createdByUserId || "",
    updatedAt: record.updatedAt || record.createdAt || fallback,
    updatedBy: record.updatedBy || record.createdBy || "—",
    updatedByUserId: record.updatedByUserId || record.createdByUserId || "",
  };
}

export function stampRecordAudit<T extends AuditStampable>(record: T, isCreate: boolean): T {
  const now = nowIso();
  if (isCreate) {
    return {
      ...record,
      createdAt: record.createdAt || now,
      updatedAt: now,
      createdBy: record.createdBy || record.updatedBy || "System",
      updatedBy: record.updatedBy || record.createdBy || "System",
      createdByUserId: record.createdByUserId || record.updatedByUserId || "",
      updatedByUserId: record.updatedByUserId || record.createdByUserId || "",
    };
  }
  return {
    ...record,
    createdAt: record.createdAt || now,
    updatedAt: now,
    updatedBy: record.updatedBy || record.createdBy || "System",
    updatedByUserId: record.updatedByUserId || record.createdByUserId || "",
  };
}

type TaskAuditSource = {
  createdBy: string;
  createdByUserId: string;
  updatedBy: string;
  updates: Array<{
    id: string;
    at: string;
    byUserId: string;
    byName: string;
    action: string;
    summary: string;
    detail: string;
  }>;
};

const taskActionToAudit: Record<string, AuditAction> = {
  created: "created",
  status_changed: "status_changed",
  reassigned: "assigned",
  note_added: "updated",
  closed: "status_changed",
  updated: "updated",
};

export function auditMetaFromTask(task: TaskAuditSource): RecordAuditMeta {
  const created = task.updates.find((u) => u.action === "created") ?? task.updates[0];
  const latest = task.updates[task.updates.length - 1];
  return {
    createdAt: created?.at ?? nowIso(),
    createdBy: task.createdBy || created?.byName || "—",
    createdByUserId: task.createdByUserId || created?.byUserId || "",
    updatedAt: latest?.at ?? created?.at ?? nowIso(),
    updatedBy: task.updatedBy || latest?.byName || task.createdBy || "—",
    updatedByUserId: latest?.byUserId || task.createdByUserId || "",
  };
}

export function taskUpdatesToAuditEvents(
  updates: TaskAuditSource["updates"]
): AuditEvent[] {
  return [...updates]
    .reverse()
    .map((update) => ({
      id: update.id,
      at: update.at,
      byUserId: update.byUserId,
      byName: update.byName,
      action: taskActionToAudit[update.action] ?? "updated",
      summary: update.summary,
      detail: update.detail,
    }));
}
