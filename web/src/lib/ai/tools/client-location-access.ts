import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import {
  assertClientAccessibleInSession,
  filterRowsByClientScope,
  resolveLocationScopeForSession,
} from "@/lib/location-scope.server";

export async function aiAllowedClientIds(
  supabase: SupabaseClient,
  session: AuthSession
): Promise<Set<string> | null> {
  const scope = await resolveLocationScopeForSession(supabase, session);
  return scope.visibleClientIds;
}

export async function assertAiClientAccessible(
  supabase: SupabaseClient,
  session: AuthSession,
  clientId: string
) {
  return assertClientAccessibleInSession(supabase, session, clientId);
}

export async function filterAiClientRows<T extends { id: string }>(
  supabase: SupabaseClient,
  session: AuthSession,
  rows: T[]
): Promise<T[]> {
  const scope = await resolveLocationScopeForSession(supabase, session);
  return filterRowsByClientScope(rows, scope);
}
