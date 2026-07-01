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

// Smallest number of single-character edits between two short strings. Used for
// typo tolerance so "Bernedette" still grounds on "Bernadette" (KAREN-BUG-0003).
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

// A token is a fuzzy match for a name part when it is within one edit for short
// words (≤5 chars) or two edits for longer words. This tolerates common typos
// like "Bernedette" → "Bernadette" without matching unrelated names.
function isFuzzyTokenMatch(token: string, namePart: string): boolean {
  if (!token || !namePart) return false;
  if (namePart.includes(token) || token.includes(namePart)) return true;
  const allowed = Math.max(token.length, namePart.length) > 5 ? 2 : 1;
  return editDistance(token, namePart) <= allowed;
}

// Minimum score for a confident grounding. Below this the assistant must ask the
// user which client they mean rather than guessing (KAREN-BUG-0003).
export const MIN_CONFIDENT_CLIENT_SCORE = 20;

export function scoreClientMatch(row: ClientRow, term: string): number {
  const q = term.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  const name = row.name.toLowerCase();
  const first = row.first_name.toLowerCase();
  const last = row.last_name.toLowerCase();
  const preferred = row.preferred_name.toLowerCase();
  const sk = row.search_key.toLowerCase();
  const nameParts = name.split(/\s+/).filter(Boolean);
  let score = 0;
  if (name === q) score += 100;
  if (first === q || last === q || preferred === q) score += 80;
  if (q.length >= 3 && name.includes(q)) score += 50;
  if (q.length >= 3 && sk.includes(q)) score += 40;
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (first.includes(t) || last.includes(t) || preferred.includes(t) || sk.includes(t)) score += 20;
    if (t.length >= 4 && (first.startsWith(t.slice(0, 4)) || t.startsWith(first.slice(0, 4)))) score += 15;
    // Typo tolerance: reward tokens that are a near-match to any name part.
    if (
      t.length >= 3 &&
      [first, last, preferred, ...nameParts].some((part) => part.length >= 3 && isFuzzyTokenMatch(t, part))
    ) {
      score += 12;
    }
  }
  return score;
}

export type RankedClientMatch = { row: ClientRow; score: number };

export type ResolveClientOptions = {
  /** When set, only clients in this id set may be returned. */
  allowedClientIds?: Set<string> | null;
  /** Override minimum score (default MIN_CONFIDENT_CLIENT_SCORE). Coach follow-ups use a lower bar for typos. */
  minMatchScore?: number;
};

function filterPoolByAllowed(rows: ClientRow[], allowed?: Set<string> | null): ClientRow[] {
  if (!allowed) return rows;
  return rows.filter((row) => allowed.has(row.id));
}

function guardResolved(client: ResolvedClient | null, allowed?: Set<string> | null): ResolvedClient | null {
  if (!client || !allowed) return client;
  return allowed.has(client.id) ? client : null;
}

/** All rows scored against the term, highest score first (zero-score rows dropped). */
export function rankClientMatches(rows: ClientRow[], term: string): RankedClientMatch[] {
  return rows
    .map((row) => ({ row, score: scoreClientMatch(row, term) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Return null instead of an arbitrary row when nothing actually matches the
// query — this prevents the assistant from grounding on the wrong client
// (KAREN-BUG-0003). Callers treat null as "ask the user which client".
export function pickBestMatch(
  rows: ClientRow[],
  term: string,
  minScore = MIN_CONFIDENT_CLIENT_SCORE
): ClientRow | null {
  const ranked = rankClientMatches(rows, term);
  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < minScore) return null;
  if (minScore < MIN_CONFIDENT_CLIENT_SCORE && second && second.score >= best.score - 4) {
    return null;
  }
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

// Build a de-duplicated pool of candidate clients for a free-text name using
// partial (and per-token) matches. Shared by resolveClient and client_get so
// both ground the assistant the same way (KAREN-BUG-0003).
export async function fetchClientPool(
  supabase: SupabaseClient,
  name: string,
  options?: ResolveClientOptions
): Promise<ClientRow[]> {
  const trimmed = name.trim();
  if (!trimmed) return [];

  const pool: ClientRow[] = [];
  const seen = new Set<string>();
  function add(rows: ClientRow[]) {
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        pool.push(row);
      }
    }
  }

  add(await fetchByIlike(supabase, "name", `%${trimmed}%`));

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    add(await fetchByIlike(supabase, "first_name", `%${token}%`));
    add(await fetchByIlike(supabase, "last_name", `%${token}%`));
    add(await fetchByIlike(supabase, "preferred_name", `%${token}%`));
    add(await fetchByIlike(supabase, "search_key", `%${token}%`));
    if (token.length >= 3) {
      add(await fetchByIlike(supabase, "first_name", `${token.slice(0, 4)}%`));
      add(await fetchByIlike(supabase, "last_name", `${token.slice(0, 4)}%`));
    }
  }

  add(await fetchByIlike(supabase, "search_key", `%${trimmed}%`));

  return filterPoolByAllowed(pool, options?.allowedClientIds);
}

export async function resolveClient(
  supabase: SupabaseClient,
  args: {
    clientId?: string;
    searchKey?: string;
    name?: string;
    clientName?: string;
    pagePath?: string;
  },
  options?: ResolveClientOptions
): Promise<ResolvedClient | null> {
  const allowed = options?.allowedClientIds;
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
    if (byId) return guardResolved({ id: byId.id, name: byId.name, searchKey: byId.search_key }, allowed);

    const { data: bySearchKey } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("search_key", clientId)
      .maybeSingle();
    if (bySearchKey) return guardResolved({ id: bySearchKey.id, name: bySearchKey.name, searchKey: bySearchKey.search_key }, allowed);
  }

  if (searchKey) {
    const { data } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("search_key", searchKey)
      .maybeSingle();
    if (data) return guardResolved({ id: data.id, name: data.name, searchKey: data.search_key }, allowed);
  }

  if (pageClientId && !name) {
    const { data: byId } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("id", pageClientId)
      .maybeSingle();
    if (byId) return guardResolved({ id: byId.id, name: byId.name, searchKey: byId.search_key }, allowed);

    const { data: bySearchKey } = await supabase
      .from("client")
      .select("id, name, search_key")
      .eq("search_key", pageClientId)
      .maybeSingle();
    if (bySearchKey) return guardResolved({ id: bySearchKey.id, name: bySearchKey.name, searchKey: bySearchKey.search_key }, allowed);
  }

  if (!name) return null;

  const pools = await fetchClientPool(supabase, name, options);

  const minScore = options?.minMatchScore ?? MIN_CONFIDENT_CLIENT_SCORE;
  const match = pickBestMatch(pools, name, minScore);
  if (match) return guardResolved({ id: match.id, name: match.name, searchKey: match.search_key }, allowed);

  // A name was explicitly requested but nothing matched confidently. Do NOT fall
  // back to the client whose page happens to be open — that is how the assistant
  // grounded on the wrong person (KAREN-BUG-0003). Return null so the caller asks
  // the user to pick the right client.
  return null;
}
