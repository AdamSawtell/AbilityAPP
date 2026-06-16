import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { fetchTasks } from "@/lib/supabase/data-api";
import { describeAssignee, normalizeTask } from "@/lib/task";

export async function runTaskSearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; status?: string; limit?: number; sortBy?: "updated" | "due" }
) {
  if (!canAccessWindow(session.windowKeys, "tasks")) {
    return { count: 0, results: [], note: "You do not have access to tasks." };
  }

  const query = args.query?.trim().toLowerCase() ?? "";
  const status = args.status?.trim() ?? "";
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 40);
  const sortBy = args.sortBy === "due" ? "due" : "updated";

  const tasks = await fetchTasks(supabase);
  let filtered = tasks.map(normalizeTask);

  if (status) {
    filtered = filtered.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }
  if (query) {
    filtered = filtered.filter((t) => {
      const blob = [t.title, t.description, t.documentNo, t.entityLabel, describeAssignee(t)].join(" ").toLowerCase();
      return blob.includes(query);
    });
  }

  filtered.sort((a, b) => {
    if (sortBy === "due") {
      return (b.dueDate || "").localeCompare(a.dueDate || "");
    }
    const aUpdated = a.updates.at(-1)?.at ?? "";
    const bUpdated = b.updates.at(-1)?.at ?? "";
    return bUpdated.localeCompare(aUpdated) || b.documentNo.localeCompare(a.documentNo);
  });

  return {
    query,
    status: status || null,
    sortBy,
    count: filtered.length,
    results: filtered.slice(0, limit).map((t) => ({
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
