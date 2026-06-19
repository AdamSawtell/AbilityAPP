import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedClient = { id: string; name: string; searchKey: string };

export async function resolveClient(
  supabase: SupabaseClient,
  args: { clientId?: string; searchKey?: string; name?: string; clientName?: string }
): Promise<ResolvedClient | null> {
  const clientId = String(args.clientId ?? "").trim();
  const searchKey = String(args.searchKey ?? "").trim();
  const name = String(args.clientName ?? args.name ?? "").trim();

  let query = supabase.from("client").select("id, name, search_key");
  if (clientId) query = query.eq("id", clientId);
  else if (searchKey) query = query.eq("search_key", searchKey);
  else if (name) query = query.ilike("name", `%${name}%`);
  else return null;

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.name, searchKey: data.search_key };
}
