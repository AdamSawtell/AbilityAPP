/**
 * Tasks — work items assigned to a user or role,
 * usually linked to a record (service agreement, client, enquiry, etc.).
 */

import { legacyActionTypeToId } from "@/lib/task-type";

export type TaskStatus = "Open" | "In progress" | "Completed" | "Cancelled";

export type TaskAssignmentType = "user" | "role";

export type TaskUpdateAction =
  | "created"
  | "status_changed"
  | "reassigned"
  | "note_added"
  | "closed"
  | "updated";

export type TaskEntityType =
  | "enquiry"
  | "client"
  | "employee"
  | "service-agreement"
  | "contract"
  | "product"
  | "price-list"
  | "incident";

export type TaskUpdate = {
  id: string;
  at: string;
  byUserId: string;
  byName: string;
  action: TaskUpdateAction;
  summary: string;
  detail: string;
};

export type TaskRecord = {
  id: string;
  documentNo: string;
  title: string;
  description: string;
  status: TaskStatus;
  taskTypeId: string;
  priority: "Low" | "Normal" | "High";
  dueDate: string;
  assignmentType: TaskAssignmentType;
  assigneeUserId: string;
  assigneeRoleId: string;
  entityType: TaskEntityType | "";
  entityId: string;
  entityLabel: string;
  createdByUserId: string;
  createdBy: string;
  updatedBy: string;
  completedBy: string;
  completedAt: string;
  resolutionNotes: string;
  updates: TaskUpdate[];
  /** Set when created by a task automation rule. */
  automationRuleId?: string;
  automationDedupeKey?: string;
};

export const taskStatusOptions: TaskStatus[] = ["Open", "In progress", "Completed", "Cancelled"];
export const taskPriorityOptions = ["Low", "Normal", "High"] as const;

export const taskEntityTypeLabels: Record<TaskEntityType, string> = {
  enquiry: "Enquiry",
  client: "Client",
  employee: "Employee",
  "service-agreement": "Service agreement",
  contract: "Contract",
  product: "Product",
  "price-list": "Price list",
  incident: "Incident",
};

export const TASK_ENTITY_TYPES = Object.keys(taskEntityTypeLabels) as TaskEntityType[];

export const taskUpdateActionLabels: Record<TaskUpdateAction, string> = {
  created: "Created",
  status_changed: "Status changed",
  reassigned: "Reassigned",
  note_added: "Note added",
  closed: "Closed",
  updated: "Updated",
};

export function entityHref(entityType: TaskEntityType, entityId: string): string {
  switch (entityType) {
    case "enquiry":
      return `/enquiries/${entityId}`;
    case "client":
      return `/clients/${entityId}`;
    case "employee":
      return `/employees/${entityId}`;
    case "service-agreement":
      return `/service-agreements/${entityId}`;
    case "contract":
      return `/contracts/${entityId}`;
    case "product":
      return `/products/${entityId}`;
    case "price-list":
      return `/price-lists/${entityId}`;
    case "incident":
      return `/incidents/${entityId}`;
    default:
      return "/";
  }
}

export function isActiveTask(task: TaskRecord) {
  return task.status === "Open" || task.status === "In progress";
}

export function isPastTask(task: TaskRecord) {
  return task.status === "Completed" || task.status === "Cancelled";
}

export function describeAssignee(
  task: Pick<TaskRecord, "assignmentType" | "assigneeUserId" | "assigneeRoleId">,
  userName?: string,
  roleName?: string
) {
  if (task.assignmentType === "user") {
    return userName ? `user ${userName}` : `user ${task.assigneeUserId}`;
  }
  return roleName ? `role ${roleName}` : `role ${task.assigneeRoleId}`;
}

export function logTaskUpdate(
  task: TaskRecord,
  update: Omit<TaskUpdate, "id" | "at"> & { at?: string }
): TaskRecord {
  const entry: TaskUpdate = {
    id: `tu-${Date.now()}-${task.updates.length}`,
    at: update.at ?? new Date().toISOString(),
    byUserId: update.byUserId,
    byName: update.byName,
    action: update.action,
    summary: update.summary,
    detail: update.detail ?? "",
  };
  return {
    ...task,
    updates: [...task.updates, entry],
    updatedBy: update.byName,
  };
}

export function normalizeTask(task: TaskRecord & { actionType?: string }): TaskRecord {
  const taskTypeId =
    task.taskTypeId ||
    (task.actionType ? legacyActionTypeToId(task.actionType) : "") ||
    "tt-review";
  return {
    ...task,
    taskTypeId,
    assigneeUserId: task.assigneeUserId ?? "",
    assigneeRoleId: task.assigneeRoleId ?? "",
    entityType: task.entityType ?? "",
    entityId: task.entityId ?? "",
    entityLabel: task.entityLabel ?? "",
    completedBy: task.completedBy ?? "",
    completedAt: task.completedAt ?? "",
    resolutionNotes: task.resolutionNotes ?? "",
    updates: task.updates ?? [],
    automationRuleId: task.automationRuleId ?? "",
    automationDedupeKey: task.automationDedupeKey ?? "",
  };
}

let taskSeq = 1005;

export function createTask(
  partial: Omit<TaskRecord, "id" | "documentNo">,
  existing: TaskRecord[]
): TaskRecord {
  const maxNo = existing.reduce((max, t) => {
    const n = parseInt(t.documentNo.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, taskSeq);
  taskSeq = maxNo + 1;
  const id = `task-${Date.now()}`;
  const documentNo = `REQ-${taskSeq}`;
  return normalizeTask({
    ...partial,
    id,
    documentNo,
    updates: partial.updates ?? [],
  });
}

function seedUpdates(task: Omit<TaskRecord, "updates">, entries: Omit<TaskUpdate, "id">[]): TaskRecord {
  return normalizeTask({
    ...task,
    updates: entries.map((e, i) => ({ ...e, id: `tu-seed-${task.id}-${i}` })),
  });
}

export const initialTasks: TaskRecord[] = [
  seedUpdates(
    {
      id: "task-sa-review-isla",
      documentNo: "REQ-1001",
      title: "Review service agreement",
      description:
        "Review this agreement, decide on approach and develop the implementation plan before activation.",
      status: "Open",
      taskTypeId: "tt-review",
      priority: "High",
      dueDate: "2026-06-20",
      assignmentType: "user",
      assigneeUserId: "user-isla",
      assigneeRoleId: "",
      entityType: "service-agreement",
      entityId: "sa-rose-ni",
      entityLabel: "SA-ROSE-NI — Bernadette Rose NDIS",
      createdByUserId: "user-superuser",
      createdBy: "Super User",
      updatedBy: "Super User",
      completedBy: "",
      completedAt: "",
      resolutionNotes: "",
    },
    [
      {
        at: "2026-06-10T09:00:00.000Z",
        byUserId: "user-superuser",
        byName: "Super User",
        action: "created",
        summary: "Created and assigned to user Isla Robinson",
        detail: "Linked to service agreement SA-ROSE-NI.",
      },
    ]
  ),
  seedUpdates(
    {
      id: "task-sa-approve-role",
      documentNo: "REQ-1002",
      title: "Approve service agreement terms",
      description: "Confirm funding type, price list and line items match the client plan.",
      status: "In progress",
      taskTypeId: "tt-approve",
      priority: "Normal",
      dueDate: "2026-06-25",
      assignmentType: "role",
      assigneeUserId: "",
      assigneeRoleId: "role-coordinator",
      entityType: "service-agreement",
      entityId: "sa-rose-ni",
      entityLabel: "SA-ROSE-NI — Bernadette Rose NDIS",
      createdByUserId: "user-superuser",
      createdBy: "Super User",
      updatedBy: "Isla Robinson",
      completedBy: "",
      completedAt: "",
      resolutionNotes: "",
    },
    [
      {
        at: "2026-06-08T10:00:00.000Z",
        byUserId: "user-superuser",
        byName: "Super User",
        action: "created",
        summary: "Created and assigned to role Support Coordinator",
        detail: "",
      },
      {
        at: "2026-06-12T14:30:00.000Z",
        byUserId: "user-isla",
        byName: "Isla Robinson",
        action: "status_changed",
        summary: "Status changed from Open to In progress",
        detail: "Started reviewing line items against the active price list.",
      },
    ]
  ),
  seedUpdates(
    {
      id: "task-client-intake",
      documentNo: "REQ-1003",
      title: "Complete intake paperwork",
      description: "Follow up on consents and legal orders for new support receiver.",
      status: "Open",
      taskTypeId: "tt-develop",
      priority: "Normal",
      dueDate: "2026-06-18",
      assignmentType: "role",
      assigneeUserId: "",
      assigneeRoleId: "role-intake",
      entityType: "client",
      entityId: "bp-bern",
      entityLabel: "Bern — Bernadette Rose",
      createdByUserId: "user-isla",
      createdBy: "Isla Robinson",
      updatedBy: "Isla Robinson",
      completedBy: "",
      completedAt: "",
      resolutionNotes: "",
    },
    [
      {
        at: "2026-06-11T11:00:00.000Z",
        byUserId: "user-isla",
        byName: "Isla Robinson",
        action: "created",
        summary: "Created and assigned to role Intake Coordinator",
        detail: "",
      },
    ]
  ),
  seedUpdates(
    {
      id: "task-enquiry-past",
      documentNo: "REQ-0998",
      title: "Initial enquiry triage",
      description: "Review participant details and support needs from web form.",
      status: "Completed",
      taskTypeId: "tt-review",
      priority: "Normal",
      dueDate: "2025-12-01",
      assignmentType: "user",
      assigneeUserId: "user-gabriela",
      assigneeRoleId: "",
      entityType: "enquiry",
      entityId: "1000025",
      entityLabel: "ENQ-1000025 — Enquiry",
      createdByUserId: "user-superuser",
      createdBy: "Super User",
      updatedBy: "Gabriela Wilson",
      completedBy: "Gabriela Wilson",
      completedAt: "2025-11-28",
      resolutionNotes: "Enquiry accepted and forwarded to intake coordinator.",
    },
    [
      {
        at: "2025-11-25T09:00:00.000Z",
        byUserId: "user-superuser",
        byName: "Super User",
        action: "created",
        summary: "Created and assigned to user Gabriela Wilson",
        detail: "",
      },
      {
        at: "2025-11-28T16:00:00.000Z",
        byUserId: "user-gabriela",
        byName: "Gabriela Wilson",
        action: "closed",
        summary: "Task completed",
        detail: "Enquiry accepted and forwarded to intake coordinator.",
      },
    ]
  ),
];
