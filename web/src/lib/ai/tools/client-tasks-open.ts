import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { resolveClient } from "@/lib/ai/tools/client-resolve";
import { fetchTasks } from "@/lib/supabase/data-api";
import { describeAssignee, isActiveTask, normalizeTask } from "@/lib/task";

export async function runClientTasksOpen(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { clientId?: string; searchKey?: string; name?: string; clientName?: string; limit?: number }
) {
  if (!canAccessWindow(session.windowKeys, "clients") && !canAccessWindow(session.windowKeys, "tasks")) {
    return { found: false, count: 0, results: [], note: "You do not have access to client tasks." };
  }

  const client = await resolveClient(supabase, args);
  if (!client) {
    return { found: false, error: "Provide clientId, searchKey, or client name." };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);
  const tasks = (await fetchTasks(supabase))
    .map(normalizeTask)
    .filter((t) => t.entityType === "client" && t.entityId === client.id && isActiveTask(t))
    .sort((a, b) => (b.dueDate || "9999").localeCompare(a.dueDate || "9999"));

  return {
    found: true,
    client: { id: client.id, name: client.name, searchKey: client.searchKey, href: `/clients/${client.id}` },
    count: tasks.length,
    results: tasks.slice(0, limit).map((t) => ({
      id: t.id,
      documentNo: t.documentNo,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assignee: describeAssignee(t),
      href: `/tasks/${t.id}`,
    })),
  };
}
