import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedClient = { id: string; name: string; searchKey: string };

type ClientRow = {
  id: string;
  name: string;
  search_key: string;
  first_name: string;
  last_name: string;
  preferred_name: string;
};

function clientIdFromPagePath(pagePath?: string): string {
  if (!pagePath) return "";
  const path = pagePath.split("?")[0] ?? "";
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "clients" || !parts[1] || parts[1] === "new") return "";
  return parts[1];
}

export function scoreClientMatch(row: ClientRow, term: string): number {
  const q = term.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  const name = row.name.toLowerCase();
  const first = row.first_name.toLowerCase();
  const last = row.last_name.toLowerCase();
  const preferred = row.preferred_name.toLowerCase();
  const sk = row.search_key.toLowerCase();
  let score = 0;
  if (name === q) score += 100;
  if (first === q || last === q || preferred === q) score += 80;
  if (q.length >= 3 && name.includes(q)) score += 50;
  if (q.length >= 3 && sk.includes(q)) score += 40;
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (first.includes(t) || last.includes(t) || preferred.includes(t) || sk.includes(t)) score += 20;
    if (t.length >= 4 && (first.startsWith(t.slice(0, 4)) || t.startsWith(first.slice(0, 4)))) score += 15;
  }
  return score;
}

// Return null instead of an arbitrary row when nothing actually matches the
// query — this prevents the assistant from grounding on the wrong client
// (KAREN-BUG-0003). Callers treat null as "ask the user which client".
export function pickBestMatch(rows: ClientRow[], term: string): ClientRow | null {
  if (!rows.length) return null;

  const scored = rows
    .map((row) => ({ row, score: scoreClientMatch(row, term) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score <= 0) return null;
  return best.row;
}

async function fetchByIlike(
  supabase: SupabaseClient,
  column: "name" | "first_name" | "last_name" | "preferred_name" | "search_key",
  pattern: string
): Promise<ClientRow[]> {
  const { data } = await supabase
    .from("client")
    .select("id, name, search_key, first_name, last_name, preferred_name")
    .ilike(column, pattern)
    .limit(8);
  return (data ?? []) as ClientRow[];
}

export async function resolveClient(
  supabase: SupabaseClient,
  args: {
    clientId?: string;
    searchKey?: string;
    name?: string;
    clientName?: string;
    pagePath?: string;
  }
): Promise<ResolvedClient | null> {
  const clientId = String(args.clientId ?? "").trim();
  const searchKey = String(args.searchKey ?? "").trim();
  const name = String(args.clientName ?? args.name ?? "").trim();
  const pageClientId = clientIdFromPagePath(args.pagePath);

  if (clientId) {
    const { data: byId } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("id", clientId)
      .maybeSingle();
    if (byId) return { id: byId.id, name: byId.name, searchKey: byId.search_key };

    const { data: bySearchKey } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("search_key", clientId)
      .maybeSingle();
    if (bySearchKey) return { id: bySearchKey.id, name: bySearchKey.name, searchKey: bySearchKey.search_key };
  }

  if (searchKey) {
    const { data } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("search_key", searchKey)
      .maybeSingle();
    if (data) return { id: data.id, name: data.name, searchKey: data.search_key };
  }

  if (pageClientId && !name) {
    const { data: byId } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("id", pageClientId)
      .maybeSingle();
    if (byId) return { id: byId.id, name: byId.name, searchKey: byId.search_key };

    const { data: bySearchKey } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("search_key", pageClientId)
      .maybeSingle();
    if (bySearchKey) return { id: bySearchKey.id, name: bySearchKey.name, searchKey: bySearchKey.search_key };
  }

  if (!name) return null;

  const pools: ClientRow[] = [];
  const seen = new Set<string>();

  function add(rows: ClientRow[]) {
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        pools.push(row);
      }
    }
  }

  add(await fetchByIlike(supabase, "name", `%${name}%`));

  const tokens = name.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    add(await fetchByIlike(supabase, "first_name", `%${token}%`));
    add(await fetchByIlike(supabase, "last_name", `%${token}%`));
    add(await fetchByIlike(supabase, "preferred_name", `%${token}%`));
    add(await fetchByIlike(supabase, "search_key", `%${token}%`));
    if (token.length >= 3) {
      add(await fetchByIlike(supabase, "first_name", `${token.slice(0, 4)}%`));
    }
  }

  add(await fetchByIlike(supabase, "search_key", `%${name}%`));

  const match = pickBestMatch(pools, name);
  if (match) return { id: match.id, name: match.name, searchKey: match.search_key };

  // A name was explicitly requested but nothing matched confidently. Do NOT fall
  // back to the client whose page happens to be open — that is how the assistant
  // grounded on the wrong person (KAREN-BUG-0003). Return null so the caller asks
  // the user to pick the right client.
  return null;
}
