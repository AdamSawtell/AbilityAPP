/**
 * Configurable task types — Review, Approve, Check, etc.
 */

export const ACTIVITY_DELETE_TASK_TYPE_ID = "tt-activity-delete";

export type TaskTypeRecord = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
};

export type TaskTypePermission = {
  taskTypeId: string;
  canSee: boolean;
  canSelect: boolean;
  canCreate: boolean;
};

export const INITIAL_TASK_TYPES: TaskTypeRecord[] = [
  { id: "tt-review", name: "Review", description: "Review information or a record before proceeding.", active: true, sortOrder: 10 },
  { id: "tt-approve", name: "Approve", description: "Approve terms, funding, or a decision.", active: true, sortOrder: 20 },
  { id: "tt-check", name: "Check", description: "Verify details, documents, or compliance.", active: true, sortOrder: 30 },
  { id: "tt-develop", name: "Develop", description: "Prepare or develop plans, paperwork, or content.", active: true, sortOrder: 40 },
  { id: "tt-decide", name: "Decide", description: "Make a decision on options or next steps.", active: true, sortOrder: 50 },
  {
    id: ACTIVITY_DELETE_TASK_TYPE_ID,
    name: "Activity deletion",
    description: "Review and remove an activity line when a staff member requests deletion.",
    active: true,
    sortOrder: 55,
  },
  { id: "tt-other", name: "Other", description: "General task not covered by other types.", active: true, sortOrder: 99 },
];

const LEGACY_ACTION_TYPE_IDS: Record<string, string> = {
  Review: "tt-review",
  Approve: "tt-approve",
  Check: "tt-check",
  Develop: "tt-develop",
  Decide: "tt-decide",
  Other: "tt-other",
};

export function legacyActionTypeToId(actionType: string): string {
  return LEGACY_ACTION_TYPE_IDS[actionType] ?? "tt-other";
}

const ID_TO_LEGACY_ACTION_TYPE = Object.fromEntries(
  Object.entries(LEGACY_ACTION_TYPE_IDS).map(([legacy, id]) => [id, legacy])
) as Record<string, string>;

export function taskTypeIdToLegacy(taskTypeId: string): string {
  return ID_TO_LEGACY_ACTION_TYPE[taskTypeId] ?? "Other";
}

export function normalizeTaskType(type: TaskTypeRecord): TaskTypeRecord {
  return {
    ...type,
    description: type.description ?? "",
    active: type.active ?? true,
    sortOrder: type.sortOrder ?? 99,
  };
}

export function sortTaskTypes(types: TaskTypeRecord[]): TaskTypeRecord[] {
  return [...types].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "en-AU"));
}

export function activeTaskTypes(types: TaskTypeRecord[]): TaskTypeRecord[] {
  return sortTaskTypes(types.filter((t) => t.active));
}

export function taskTypeName(types: TaskTypeRecord[], taskTypeId: string): string {
  return types.find((t) => t.id === taskTypeId)?.name ?? taskTypeId;
}

export function newTaskTypeId(): string {
  return `tt-${Date.now()}`;
}

export function fullTaskTypePermissions(taskTypeIds: string[]): TaskTypePermission[] {
  return taskTypeIds.map((taskTypeId) => ({
    taskTypeId,
    canSee: true,
    canSelect: true,
    canCreate: true,
  }));
}

export function permissionsForTypes(
  taskTypeIds: string[],
  flags: Pick<TaskTypePermission, "canSee" | "canSelect" | "canCreate"> = {
    canSee: true,
    canSelect: true,
    canCreate: true,
  }
): TaskTypePermission[] {
  return taskTypeIds.map((taskTypeId) => ({ taskTypeId, ...flags }));
}

export function mergeTaskTypePermissions(
  existing: TaskTypePermission[] | undefined,
  taskTypeIds: string[]
): TaskTypePermission[] {
  const byId = new Map((existing ?? []).map((p) => [p.taskTypeId, p]));
  return taskTypeIds.map((taskTypeId) => byId.get(taskTypeId) ?? { taskTypeId, canSee: false, canSelect: false, canCreate: false });
}
