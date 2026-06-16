import type { TaskRecord } from "@/lib/task";
import { isActiveTask } from "@/lib/task";
import type { TaskAutomationDedupePolicy } from "@/lib/task-automation";

/**
 * In-memory dedupe index for automation tasks.
 * Built once per evaluation batch — O(open automation tasks), not O(all tasks × rules).
 */
export type AutomationDedupeIndex = {
  openKeys: Set<string>;
  everKeys: Set<string>;
};

export function buildAutomationDedupeIndex(tasks: TaskRecord[]): AutomationDedupeIndex {
  const openKeys = new Set<string>();
  const everKeys = new Set<string>();

  for (const task of tasks) {
    const key = task.automationDedupeKey?.trim();
    if (!key) continue;
    everKeys.add(key);
    if (isActiveTask(task)) {
      openKeys.add(key);
    }
  }

  return { openKeys, everKeys };
}

export function shouldSkipAutomationTask(
  index: AutomationDedupeIndex,
  dedupeKey: string,
  policy: TaskAutomationDedupePolicy
): boolean {
  if (policy === "none") return false;
  if (policy === "once_ever") return index.everKeys.has(dedupeKey);
  return index.openKeys.has(dedupeKey);
}

export function registerAutomationDedupeKey(index: AutomationDedupeIndex, dedupeKey: string) {
  index.everKeys.add(dedupeKey);
  index.openKeys.add(dedupeKey);
}
