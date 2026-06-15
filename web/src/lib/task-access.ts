import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { filterTasksByTypeAccess } from "@/lib/task-type-access";
import { isActiveTask, isPastTask, type TaskRecord } from "@/lib/task";

export type TaskListView = "assigned-to-me" | "my-role" | "all" | "past";

export const TASK_LIST_VIEWS: {
  key: TaskListView;
  label: string;
  windowKey: string;
  href: string;
  description: string;
}[] = [
  {
    key: "assigned-to-me",
    label: "Assigned to me",
    windowKey: "tasks-assigned-to-me",
    href: "/tasks?scope=assigned-to-me",
    description: "Open tasks assigned directly to you",
  },
  {
    key: "my-role",
    label: "To my role",
    windowKey: "tasks-for-my-role",
    href: "/tasks?scope=my-role",
    description: "Tasks assigned to your current role",
  },
  {
    key: "all",
    label: "All tasks",
    windowKey: "tasks-all",
    href: "/tasks?scope=all",
    description: "Every active task you can see",
  },
  {
    key: "past",
    label: "Past",
    windowKey: "tasks-past",
    href: "/tasks?scope=past",
    description: "Completed and cancelled tasks",
  },
];

export function taskAssignedToUser(task: TaskRecord, userId: string) {
  return task.assignmentType === "user" && task.assigneeUserId === userId;
}

export function taskAssignedToRole(task: TaskRecord, roleId: string) {
  return task.assignmentType === "role" && task.assigneeRoleId === roleId;
}

/** Task is visible to the signed-in user in their current role. */
export function taskVisibleToSession(task: TaskRecord, session: Pick<AuthSession, "userId" | "activeRoleId">) {
  if (taskAssignedToUser(task, session.userId)) return true;
  if (taskAssignedToRole(task, session.activeRoleId)) return true;
  if (task.createdByUserId === session.userId) return true;
  return false;
}

export function filterTasksForView(
  tasks: TaskRecord[],
  view: TaskListView,
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">
): TaskRecord[] {
  const canSeeAll = canAccessWindow(session.windowKeys, "tasks-all");
  const visibleByType = filterTasksByTypeAccess(tasks, session);

  return visibleByType.filter((task) => {
    if (!taskVisibleToSession(task, session) && !canSeeAll) return false;

    switch (view) {
      case "assigned-to-me":
        return taskAssignedToUser(task, session.userId) && isActiveTask(task);
      case "my-role":
        return taskAssignedToRole(task, session.activeRoleId) && isActiveTask(task);
      case "all":
        if (!canAccessWindow(session.windowKeys, "tasks-all")) return false;
        return (
          (taskAssignedToUser(task, session.userId) ||
            taskAssignedToRole(task, session.activeRoleId) ||
            task.createdByUserId === session.userId) &&
          isActiveTask(task)
        );
      case "past":
        if (!canAccessWindow(session.windowKeys, "tasks-past")) return false;
        return (
          taskAssignedToUser(task, session.userId) ||
          taskAssignedToRole(task, session.activeRoleId) ||
          task.createdByUserId === session.userId
        ) && isPastTask(task);
      default:
        return false;
    }
  });
}

export function taskCountsForSession(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">
) {
  return {
    assignedToMe: filterTasksForView(tasks, "assigned-to-me", session).length,
    myRole: filterTasksForView(tasks, "my-role", session).length,
    all: canAccessWindow(session.windowKeys, "tasks-all")
      ? filterTasksForView(tasks, "all", session).length
      : 0,
    past: canAccessWindow(session.windowKeys, "tasks-past")
      ? filterTasksForView(tasks, "past", session).length
      : 0,
  };
}

export function canActionTask(
  task: TaskRecord,
  session: Pick<AuthSession, "userId" | "activeRoleId" | "processIds">
) {
  if (!session.processIds.includes("action-task")) return false;
  if (!isActiveTask(task)) return false;
  return taskAssignedToUser(task, session.userId) || taskAssignedToRole(task, session.activeRoleId);
}

export function visibleTaskViews(windowKeys: string[]) {
  return TASK_LIST_VIEWS.filter((v) => canAccessWindow(windowKeys, v.windowKey));
}
