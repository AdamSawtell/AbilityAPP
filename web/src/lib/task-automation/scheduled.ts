import { TASK_AUTOMATION_SCHEDULED_STORAGE_KEY, TASK_AUTOMATION_SCHEDULED_THROTTLE_MS } from "@/lib/task-automation";

export function shouldRunScheduledAutomations(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(TASK_AUTOMATION_SCHEDULED_STORAGE_KEY);
    if (!raw) return true;
    const last = Number(raw);
    return !Number.isFinite(last) || now - last >= TASK_AUTOMATION_SCHEDULED_THROTTLE_MS;
  } catch {
    return true;
  }
}

export function markScheduledAutomationsRan(at = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TASK_AUTOMATION_SCHEDULED_STORAGE_KEY, String(at));
  } catch {
    // ignore
  }
}
