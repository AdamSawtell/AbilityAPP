import { ADMIN_ROLE_ID, isAdminRole } from "@/lib/access/role-access-templates";
import type { AppRoleRecord } from "@/lib/access/types";
import { createTask, type TaskEntityType, type TaskRecord } from "@/lib/task";
import { ACTIVITY_DELETE_TASK_TYPE_ID } from "@/lib/task-type";

export type LineDeletePolicy = "default" | "admin-only";

export type ActivityLineDeleteContext = {
  entityType: TaskEntityType;
  entityId: string;
  entityLabel: string;
  collectionLabel: string;
};

export function canDeleteActivityLines(
  deletePolicy: LineDeletePolicy | undefined,
  activeRole: Pick<AppRoleRecord, "id" | "roleKey"> | string | null | undefined
): boolean {
  if (deletePolicy !== "admin-only") return true;
  if (!activeRole) return false;
  return isAdminRole(activeRole);
}

export function activityLineDedupeKey(entityType: string, entityId: string, lineId: string): string {
  return `activity-delete-request:${entityType}:${entityId}:${lineId}`;
}

export function summarizeActivityLine(row: { lineNo: number; [key: string]: unknown }): string {
  const subject = String(row.subject ?? row.contactName ?? "").trim();
  const date = String(row.date ?? "").trim();
  const type = String(row.activityType ?? "").trim();
  const parts = [date, type, subject].filter(Boolean);
  return parts.length ? parts.join(" · ") : `Line ${row.lineNo}`;
}

function dueDateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function findOpenActivityDeleteRequest(
  tasks: TaskRecord[],
  entityType: string,
  entityId: string,
  lineId: string
): TaskRecord | undefined {
  const key = activityLineDedupeKey(entityType, entityId, lineId);
  return tasks.find(
    (t) =>
      t.automationDedupeKey === key &&
      t.status !== "Completed" &&
      t.status !== "Cancelled"
  );
}

export function buildActivityDeletionRequestTask(input: {
  row: { id: string; lineNo: number; [key: string]: unknown };
  context: ActivityLineDeleteContext;
  createdByUserId: string;
  createdBy: string;
  existingTasks: TaskRecord[];
}): TaskRecord {
  const summary = summarizeActivityLine(input.row);
  const { context } = input;
  return createTask(
    {
      title: `Remove activity — ${summary}`,
      description: [
        `${context.collectionLabel} deletion requested on ${context.entityLabel}.`,
        "",
        `Line ${input.row.lineNo}: ${summary}`,
        "",
        "Open the record, review the activity line, and remove it if appropriate. Complete this task when done.",
      ].join("\n"),
      status: "Open",
      taskTypeId: ACTIVITY_DELETE_TASK_TYPE_ID,
      priority: "Normal",
      dueDate: dueDateInDays(3),
      assignmentType: "role",
      assigneeUserId: "",
      assigneeRoleId: ADMIN_ROLE_ID,
      entityType: context.entityType,
      entityId: context.entityId,
      entityLabel: context.entityLabel,
      createdByUserId: input.createdByUserId,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      completedBy: "",
      completedAt: "",
      resolutionNotes: "",
      automationDedupeKey: activityLineDedupeKey(context.entityType, context.entityId, input.row.id),
      updates: [],
    },
    input.existingTasks
  );
}
