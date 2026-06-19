import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { auditNewId } from "@/lib/audit-monitoring/shared";
import { logAiPrepareCreated } from "@/lib/ai/prepare-audit";

export type AiDraftRow = {
  id: string;
  user_id: string;
  role_id: string;
  entity_type: string;
  target_route: string;
  payload: Record<string, unknown>;
  summary: string;
  created_at: string;
  expires_at: string;
};

const DRAFT_TTL_HOURS = 48;

export async function createAiDraft(
  supabase: SupabaseClient,
  session: AuthSession,
  input: {
    entityType: string;
    targetRoute: string;
    payload: Record<string, unknown>;
    summary: string;
  }
): Promise<{ id: string; href: string }> {
  const id = auditNewId("aid");
  const expiresAt = new Date(Date.now() + DRAFT_TTL_HOURS * 3600 * 1000).toISOString();
  const href = `${input.targetRoute}${input.targetRoute.includes("?") ? "&" : "?"}aiDraft=${id}`;

  const { error } = await supabase.from("ai_draft").insert({
    id,
    user_id: session.userId,
    role_id: session.activeRoleId,
    entity_type: input.entityType,
    target_route: input.targetRoute,
    payload: input.payload,
    summary: input.summary,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  void logAiPrepareCreated(session, {
    draftId: id,
    entityType: input.entityType,
    entityLabel: input.summary,
    targetRoute: input.targetRoute,
  });

  return { id, href };
}

export async function fetchAiDraftForSession(
  supabase: SupabaseClient,
  session: AuthSession,
  draftId: string
): Promise<AiDraftRow | null> {
  const { data, error } = await supabase
    .from("ai_draft")
    .select("*")
    .eq("id", draftId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data as AiDraftRow;
}
