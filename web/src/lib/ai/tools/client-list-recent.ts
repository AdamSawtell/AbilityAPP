import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

export async function runClientListRecent(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { hours?: number; limit?: number }
) {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { count: 0, results: [], note: "You do not have access to client records." };
  }

  const hours = Math.min(Math.max(Number(args.hours) || 168, 1), 24 * 90);
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("client")
    .select("id, search_key, name, status, email, phone, updated_at")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return {
    hours,
    since,
    count: data?.length ?? 0,
    results: (data ?? []).map((row) => ({
      id: row.id,
      searchKey: row.search_key,
      name: row.name,
      status: row.status,
      email: row.email,
      phone: row.phone,
      updatedAt: row.updated_at,
      href: `/clients/${row.id}`,
    })),
  };
}
