import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { filterTasksByTypeAccess } from "@/lib/task-type-access";
import { taskVisibleToSession } from "@/lib/task-access";
import { fetchTasks } from "@/lib/supabase/data-api";
import { describeAssignee, isActiveTask, normalizeTask } from "@/lib/task";
import { taskUrgency } from "@/lib/task-hub";

export async function runTaskListOverdue(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { limit?: number }
) {
  if (!aiCanAccessWindow(session, "tasks")) {
    return { count: 0, results: [], note: "You do not have access to tasks." };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 40);

  const tasks = filterTasksByTypeAccess((await fetchTasks(supabase)).map(normalizeTask), session)
    .filter((t) => isActiveTask(t) && taskVisibleToSession(t, session) && taskUrgency(t) === "overdue")
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return {
    count: tasks.length,
    results: tasks.slice(0, limit).map((t) => ({
      id: t.id,
      documentNo: t.documentNo,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assignee: describeAssignee(t),
      entityLabel: t.entityLabel,
      href: `/tasks/${t.id}`,
    })),
  };
}
