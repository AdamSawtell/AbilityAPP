import type { AuthSession } from "@/lib/access/types";
import type { TaskTypeRecord } from "@/lib/task-type";
import { activeTaskTypes } from "@/lib/task-type";
import type { TaskRecord } from "@/lib/task";

function permissionMap(session: Pick<AuthSession, "taskTypePermissions">) {
  return new Map(session.taskTypePermissions.map((p) => [p.taskTypeId, p]));
}

export function canSeeTaskType(session: Pick<AuthSession, "taskTypePermissions">, taskTypeId: string) {
  return permissionMap(session).get(taskTypeId)?.canSee ?? false;
}

export function canSelectTaskType(session: Pick<AuthSession, "taskTypePermissions">, taskTypeId: string) {
  return permissionMap(session).get(taskTypeId)?.canSelect ?? false;
}

export function canCreateTaskType(session: Pick<AuthSession, "taskTypePermissions">, taskTypeId: string) {
  return permissionMap(session).get(taskTypeId)?.canCreate ?? false;
}

/** Types the role may pick when creating a task. Requires select + create. */
export function creatableTaskTypes(
  session: Pick<AuthSession, "taskTypePermissions">,
  types: TaskTypeRecord[]
): TaskTypeRecord[] {
  return activeTaskTypes(types).filter(
    (t) => canSelectTaskType(session, t.id) && canCreateTaskType(session, t.id)
  );
}

export function taskVisibleByType(session: Pick<AuthSession, "taskTypePermissions">, task: Pick<TaskRecord, "taskTypeId">) {
  return canSeeTaskType(session, task.taskTypeId);
}

export function filterTasksByTypeAccess(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "taskTypePermissions">
): TaskRecord[] {
  return tasks.filter((task) => taskVisibleByType(session, task));
}
