import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

export async function runEmployeeSearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; limit?: number; activeOnly?: boolean }
) {
  if (!canAccessWindow(session.windowKeys, "employees")) {
    return { count: 0, results: [], note: "You do not have access to employee records." };
  }

  const query = args.query?.trim() ?? "";
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);
  const activeOnly = args.activeOnly !== false;

  let dbQuery = supabase
    .from("employee")
    .select("id, search_key, name, first_name, last_name, employment_status, email, phone, job_title, updated_at")
    .order("last_name")
    .order("first_name")
    .limit(query ? 200 : limit);

  if (activeOnly) dbQuery = dbQuery.eq("employment_status", "Active");

  const { data, error } = await dbQuery;
  if (error) throw error;

  const q = query.toLowerCase();
  const filtered = (data ?? []).filter((row) => {
    if (!q) return true;
    const blob = [row.name, row.first_name, row.last_name, row.search_key, row.email, row.job_title]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });

  return {
    query,
    count: filtered.length,
    results: filtered.slice(0, limit).map((row) => ({
      id: row.id,
      searchKey: row.search_key,
      name: row.name,
      status: row.employment_status,
      email: row.email,
      phone: row.phone,
      jobTitle: row.job_title,
      updatedAt: row.updated_at,
      href: `/employees/${row.id}`,
    })),
  };
}
