import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { filterTasksByTypeAccess } from "@/lib/task-type-access";
import { taskAssignedToRole, taskAssignedToUser } from "@/lib/task-access";
import { fetchTasks } from "@/lib/supabase/data-api";
import { describeAssignee, isActiveTask, normalizeTask } from "@/lib/task";

export async function runTaskListMine(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { scope?: string; limit?: number }
) {
  if (!aiCanAccessWindow(session, "tasks")) {
    return { count: 0, results: [], note: "You do not have access to tasks." };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 40);
  const scope = args.scope === "role" ? "role" : "user";

  const tasks = filterTasksByTypeAccess((await fetchTasks(supabase)).map(normalizeTask), session)
    .filter((t) => {
      if (!isActiveTask(t)) return false;
      if (scope === "role") return taskAssignedToRole(t, session.activeRoleId);
      return taskAssignedToUser(t, session.userId);
    })
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return {
    scope,
    assignee: scope === "role" ? session.activeRoleName : session.displayName,
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
