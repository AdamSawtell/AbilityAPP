import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { ReportResult } from "@/lib/reports/types";
import { describeAssignee, taskEntityTypeLabels, type TaskRecord } from "@/lib/task";
import { INITIAL_TASK_TYPES } from "@/lib/task-type";

type TaskColumn = {
  id: string;
  label: string;
  getValue: (row: TaskRecord) => string;
};

const taskTypeNameById = new Map(INITIAL_TASK_TYPES.map((t) => [t.id, t.name]));

export function buildTasksAllReport(
  tasks: TaskRecord[],
  users: AppUserRecord[],
  roles: AppRoleRecord[]
): ReportResult {
  const userNameById = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim() || u.username]));
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));

  const columns: TaskColumn[] = [
    { id: "documentNo", label: "Document no.", getValue: (r) => r.documentNo },
    { id: "title", label: "Title", getValue: (r) => r.title },
    { id: "status", label: "Status", getValue: (r) => r.status },
    { id: "taskType", label: "Task type", getValue: (r) => taskTypeNameById.get(r.taskTypeId) ?? r.taskTypeId },
    { id: "priority", label: "Priority", getValue: (r) => r.priority },
    { id: "dueDate", label: "Due date", getValue: (r) => r.dueDate },
    {
      id: "assignee",
      label: "Assignee",
      getValue: (r) =>
        describeAssignee(
          r,
          userNameById.get(r.assigneeUserId),
          roleNameById.get(r.assigneeRoleId)
        ),
    },
    { id: "assignmentType", label: "Assignment type", getValue: (r) => r.assignmentType },
    {
      id: "entityType",
      label: "Linked record type",
      getValue: (r) => (r.entityType ? taskEntityTypeLabels[r.entityType as keyof typeof taskEntityTypeLabels] ?? r.entityType : ""),
    },
    { id: "entityLabel", label: "Linked record", getValue: (r) => r.entityLabel },
    { id: "entityId", label: "Linked record ID", getValue: (r) => r.entityId },
    { id: "description", label: "Description", getValue: (r) => r.description },
    { id: "createdBy", label: "Created by", getValue: (r) => r.createdBy },
    { id: "updatedBy", label: "Updated by", getValue: (r) => r.updatedBy },
    { id: "completedBy", label: "Completed by", getValue: (r) => r.completedBy },
    { id: "completedAt", label: "Completed at", getValue: (r) => r.completedAt },
    { id: "resolutionNotes", label: "Resolution notes", getValue: (r) => r.resolutionNotes },
    { id: "updateCount", label: "Update count", getValue: (r) => String(r.updates.length) },
  ];

  const rows = [...tasks]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || a.documentNo.localeCompare(b.documentNo))
    .map((task) => {
      const flat: Record<string, string> = {};
      for (const col of columns) {
        flat[col.id] = col.getValue(task);
      }
      return flat;
    });

  return {
    columns: columns.map(({ id, label }) => ({ id, label })),
    rows,
  };
}
