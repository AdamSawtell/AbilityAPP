import type { AppUserRecord } from "@/lib/access/types";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import { formatShiftTimeRange, type RosterShiftRecord } from "@/lib/roster-shift";
import { createTask, type TaskRecord } from "@/lib/task";

export type RosterPublishNotificationResult = {
  tasks: Omit<TaskRecord, "id" | "documentNo">[];
  workerCount: number;
  shiftCount: number;
};

function userIdForEmployee(employeeId: string, users: Pick<AppUserRecord, "id" | "employeeBpId">[]): string {
  return users.find((u) => u.employeeBpId === employeeId)?.id ?? "";
}

function employeeName(employees: EmployeeRecord[], employeeId: string): string {
  return employees.find((e) => e.id === employeeId)?.name ?? "Worker";
}

function clientLabel(clients: ClientRecord[], clientId: string): string {
  const client = clients.find((c) => c.id === clientId);
  return client ? `${client.searchKey} — ${client.preferredName || client.name}` : clientId;
}

/** Build in-app tasks notifying workers of newly published shifts (one task per worker per batch). */
export function buildRosterPublishNotifications(params: {
  published: RosterShiftRecord[];
  previous: RosterShiftRecord[];
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  users: Pick<AppUserRecord, "id" | "employeeBpId">[];
  existingTasks: TaskRecord[];
  actorUserId: string;
  actorName: string;
}): RosterPublishNotificationResult {
  const {
    published,
    previous,
    clients,
    employees,
    users,
    existingTasks,
    actorUserId,
    actorName,
  } = params;

  const prevById = new Map(previous.map((s) => [s.id, s]));
  const newlyPublished = published.filter((shift) => {
    const before = prevById.get(shift.id);
    return shift.status === "Published" && before?.status === "Draft";
  });

  if (!newlyPublished.length) {
    return { tasks: [], workerCount: 0, shiftCount: 0 };
  }

  const byWorker = new Map<string, RosterShiftRecord[]>();
  for (const shift of newlyPublished) {
    const workerId = shift.employeeId?.trim();
    if (!workerId) continue;
    const list = byWorker.get(workerId) ?? [];
    list.push(shift);
    byWorker.set(workerId, list);
  }

  const tasks: Omit<TaskRecord, "id" | "documentNo">[] = [];
  const due = new Date();
  due.setDate(due.getDate() + 2);
  const dueDate = due.toISOString().slice(0, 10);

  for (const [employeeId, shifts] of byWorker) {
    const dedupeKey = `roster-publish-${employeeId}-${shifts.map((s) => s.id).sort().join(",")}`;
    if (existingTasks.some((t) => t.automationDedupeKey === dedupeKey && t.status !== "Completed")) {
      continue;
    }

    const shiftLines = shifts
      .slice(0, 5)
      .map(
        (s) =>
          `${s.shiftDate} ${formatShiftTimeRange(s.startTime, s.endTime)} — ${clientLabel(clients, s.clientId)}`
      )
      .join("\n");
    const more = shifts.length > 5 ? `\n+ ${shifts.length - 5} more shift${shifts.length - 5 === 1 ? "" : "s"}` : "";

    const assigneeUserId = userIdForEmployee(employeeId, users);
    tasks.push({
      title: `Roster published — ${shifts.length} shift${shifts.length === 1 ? "" : "s"}`,
      description: `Your coordinator published ${shifts.length} shift${shifts.length === 1 ? "" : "s"}. Open My workplace → My shifts to review and check in on the day.\n\n${shiftLines}${more}`,
      status: "Open",
      taskTypeId: "tt-review",
      priority: "Normal",
      dueDate,
      assignmentType: assigneeUserId ? "user" : "role",
      assigneeUserId: assigneeUserId || "",
      assigneeRoleId: assigneeUserId ? "" : "role-support-worker",
      entityType: "roster-shift",
      entityId: shifts[0]!.id,
      entityLabel: shifts[0]!.shiftRef || shifts[0]!.id,
      createdByUserId: actorUserId,
      createdBy: actorName,
      updatedBy: actorName,
      completedBy: "",
      completedAt: "",
      resolutionNotes: "",
      updates: [],
      automationRuleId: "",
      automationDedupeKey: dedupeKey,
    });
  }

  return {
    tasks,
    workerCount: byWorker.size,
    shiftCount: newlyPublished.length,
  };
}

export function createRosterPublishTasks(
  partials: Omit<TaskRecord, "id" | "documentNo">[],
  existing: TaskRecord[]
): TaskRecord[] {
  return partials.map((partial) => createTask({ ...partial, updates: partial.updates ?? [] }, existing));
}
