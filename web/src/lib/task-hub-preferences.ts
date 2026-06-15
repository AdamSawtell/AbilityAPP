import type { TaskListView } from "@/lib/task-access";
import type { TaskGroupMode, TaskSortMode } from "@/lib/task-hub";

export type TaskHubPreferences = {
  defaultScope: TaskListView;
  sort: TaskSortMode;
  groupBy: TaskGroupMode;
  showStats: boolean;
  showCritical: boolean;
  compactList: boolean;
};

export const DEFAULT_TASK_HUB_PREFERENCES: TaskHubPreferences = {
  defaultScope: "assigned-to-me",
  sort: "due",
  groupBy: "none",
  showStats: true,
  showCritical: true,
  compactList: false,
};

const STORAGE_KEY = "abilityerp-task-hub-prefs";

export function loadTaskHubPreferences(): TaskHubPreferences {
  if (typeof window === "undefined") return DEFAULT_TASK_HUB_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return DEFAULT_TASK_HUB_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<TaskHubPreferences>;
    return { ...DEFAULT_TASK_HUB_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_TASK_HUB_PREFERENCES;
  }
}

export function saveTaskHubPreferences(prefs: TaskHubPreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
