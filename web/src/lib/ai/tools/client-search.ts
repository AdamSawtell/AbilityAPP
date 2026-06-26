import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { filterAiClientRows } from "@/lib/ai/tools/client-location-access";

export async function runClientSearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; limit?: number; sortBy?: "name" | "updated" }
) {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { query: args.query ?? "", count: 0, results: [], note: "You do not have access to client records." };
  }

  const query = args.query?.trim() ?? "";
  const limit = Math.min(Math.max(args.limit ?? 15, 1), 30);
  const sortBy = args.sortBy === "updated" ? "updated" : "name";

  const { data, error } = await supabase
    .from("client")
    .select("id, search_key, name, status, email, phone, updated_at")
    .order(sortBy === "updated" ? "updated_at" : "name", { ascending: sortBy !== "updated" })
    .limit(sortBy === "updated" && !query ? limit : 200);
  if (error) throw error;

  const q = query.toLowerCase();
  const scopedRows = await filterAiClientRows(supabase, session, data ?? []);
  const filtered = scopedRows.filter((row) => {
    if (!q) return true;
    const blob = [row.name, row.search_key, row.email, row.phone, row.status].join(" ").toLowerCase();
    return blob.includes(q);
  });

  const sorted =
    sortBy === "updated" && q
      ? [...filtered].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
      : filtered;

  return {
    query,
    sortBy,
    count: sorted.length,
    results: sorted.slice(0, limit).map((row) => ({
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
