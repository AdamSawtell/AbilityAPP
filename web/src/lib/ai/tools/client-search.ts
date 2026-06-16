import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

export async function runClientSearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; limit?: number }
) {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { query: args.query ?? "", count: 0, results: [], note: "You do not have access to client records." };
  }

  const query = args.query?.trim() ?? "";
  const limit = Math.min(Math.max(args.limit ?? 15, 1), 30);

  const { data, error } = await supabase
    .from("client")
    .select("id, search_key, name, status, email, phone, updated_at")
    .order("name")
    .limit(200);
  if (error) throw error;

  const q = query.toLowerCase();
  const filtered = (data ?? []).filter((row) => {
    if (!q) return true;
    const blob = [row.name, row.search_key, row.email, row.phone, row.status].join(" ").toLowerCase();
    return blob.includes(q);
  });

  return {
    query,
    count: filtered.length,
    results: filtered.slice(0, limit).map((row) => ({
      id: row.id,
      searchKey: row.search_key,
      name: row.name,
      status: row.status,
      email: row.email,
      phone: row.phone,
      updatedAt: row.updated_at,
      href: `/clients/${row.search_key ?? row.id}`,
    })),
  };
}
