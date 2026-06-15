import type { AuthSession } from "@/lib/access/types";
import {
  filterTasksForView,
  taskAssignedToRole,
  taskAssignedToUser,
  type TaskListView,
} from "@/lib/task-access";
import { isActiveTask, type TaskRecord } from "@/lib/task";

export type TaskSortMode = "due" | "priority" | "updated";
export type TaskGroupMode = "none" | "due" | "priority" | "status";
export type TaskUrgency = "overdue" | "today" | "soon" | "later" | "none";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function taskUrgency(task: TaskRecord, today = todayIso()): TaskUrgency {
  if (!task.dueDate || !isActiveTask(task)) return "none";
  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "today";
  if (task.dueDate <= addDaysIso(today, 3)) return "soon";
  return "later";
}

export function isCriticalTask(task: TaskRecord, today = todayIso()): boolean {
  if (!isActiveTask(task)) return false;
  const urgency = taskUrgency(task, today);
  if (urgency === "overdue") return true;
  if (task.priority === "High" && (urgency === "today" || urgency === "soon")) return true;
  return false;
}

const priorityRank: Record<TaskRecord["priority"], number> = {
  High: 0,
  Normal: 1,
  Low: 2,
};

const urgencyRank: Record<TaskUrgency, number> = {
  overdue: 0,
  today: 1,
  soon: 2,
  later: 3,
  none: 4,
};

export function sortTasks(tasks: TaskRecord[], mode: TaskSortMode, today = todayIso()): TaskRecord[] {
  return [...tasks].sort((a, b) => {
    if (mode === "priority") {
      const pr = priorityRank[a.priority] - priorityRank[b.priority];
      if (pr !== 0) return pr;
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    }
    if (mode === "updated") {
      const aAt = a.updates.at(-1)?.at ?? "";
      const bAt = b.updates.at(-1)?.at ?? "";
      return bAt.localeCompare(aAt);
    }
    const ua = urgencyRank[taskUrgency(a, today)] - urgencyRank[taskUrgency(b, today)];
    if (ua !== 0) return ua;
    const pr = priorityRank[a.priority] - priorityRank[b.priority];
    if (pr !== 0) return pr;
    return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
  });
}

export function groupTasks(
  tasks: TaskRecord[],
  mode: TaskGroupMode,
  today = todayIso()
): { key: string; label: string; tasks: TaskRecord[] }[] {
  if (mode === "none" || !tasks.length) {
    return [{ key: "all", label: "All tasks", tasks }];
  }

  const buckets = new Map<string, { label: string; tasks: TaskRecord[] }>();

  function add(key: string, label: string, task: TaskRecord) {
    const bucket = buckets.get(key) ?? { label, tasks: [] };
    bucket.tasks.push(task);
    buckets.set(key, bucket);
  }

  for (const task of tasks) {
    if (mode === "due") {
      const u = taskUrgency(task, today);
      if (u === "overdue") add("overdue", "Overdue", task);
      else if (u === "today") add("today", "Due today", task);
      else if (u === "soon") add("soon", "Due soon", task);
      else if (u === "later") add("later", "Due later", task);
      else add("none", "No due date", task);
    } else if (mode === "priority") {
      add(task.priority, `${task.priority} priority`, task);
    } else if (mode === "status") {
      add(task.status, task.status, task);
    }
  }

  const order =
    mode === "due"
      ? ["overdue", "today", "soon", "later", "none"]
      : mode === "priority"
        ? ["High", "Normal", "Low"]
        : ["Open", "In progress", "Completed", "Cancelled"];

  return order
    .filter((key) => buckets.has(key))
    .map((key) => ({ key, label: buckets.get(key)!.label, tasks: buckets.get(key)!.tasks }));
}

export type TaskDashboardStats = {
  overdue: number;
  dueToday: number;
  highPriority: number;
  assignedToMe: number;
  myRole: number;
  allActive: number;
  past: number;
};

export function taskDashboardStats(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">,
  today = todayIso()
): TaskDashboardStats {
  const mine = filterTasksForView(tasks, "assigned-to-me", session);
  const role = filterTasksForView(tasks, "my-role", session);
  const allActive = filterTasksForView(tasks, "all", session);
  const past = filterTasksForView(tasks, "past", session);
  const activePool = [...new Map([...mine, ...role, ...allActive].map((t) => [t.id, t])).values()];

  return {
    overdue: activePool.filter((t) => taskUrgency(t, today) === "overdue").length,
    dueToday: activePool.filter((t) => taskUrgency(t, today) === "today").length,
    highPriority: activePool.filter((t) => t.priority === "High").length,
    assignedToMe: mine.length,
    myRole: role.length,
    allActive: allActive.length,
    past: past.length,
  };
}

export function criticalTasksForSession(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">,
  today = todayIso()
): TaskRecord[] {
  const pools = [
    ...filterTasksForView(tasks, "assigned-to-me", session),
    ...filterTasksForView(tasks, "my-role", session),
  ];
  const unique = [...new Map(pools.map((t) => [t.id, t])).values()];
  return sortTasks(unique.filter((t) => isCriticalTask(t, today)), "due", today);
}

export function parseTaskScope(value: string | null | undefined, fallback: TaskListView): TaskListView {
  if (value === "assigned-to-me" || value === "my-role" || value === "all" || value === "past") {
    return value;
  }
  return fallback;
}

export function taskScopeLabel(scope: TaskListView): string {
  switch (scope) {
    case "assigned-to-me":
      return "Assigned to me";
    case "my-role":
      return "To my role";
    case "all":
      return "All active";
    case "past":
      return "Past";
  }
}

export function taskMatchesSearch(task: TaskRecord, query: string, typeName: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [task.title, task.documentNo, task.entityLabel, task.description, typeName]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function taskAssignmentLabel(
  task: TaskRecord,
  session: Pick<AuthSession, "userId" | "activeRoleId">
): "mine" | "role" | "other" {
  if (taskAssignedToUser(task, session.userId)) return "mine";
  if (taskAssignedToRole(task, session.activeRoleId)) return "role";
  return "other";
}
