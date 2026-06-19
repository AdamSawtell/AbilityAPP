import type { ClientActivityDraft } from "@/lib/ai/persist";
import { persistAiClientActivity } from "@/lib/ai/persist";
import type { AuthSession } from "@/lib/access/types";
import { deleteAiDraft, fetchAiDraftForSession } from "@/lib/ai/draft-server";
import { logAiPrepareSaved } from "@/lib/ai/prepare-audit";
import type { SupabaseClient } from "@supabase/supabase-js";

function activityDraftFromPayload(payload: Record<string, unknown>): ClientActivityDraft | null {
  const clientId = String(payload.clientId ?? "").trim();
  if (!clientId) return null;
  const subject = String(payload.subject ?? "").trim();
  const description = String(payload.description ?? "").trim();
  if (!subject && !description) return null;
  const rawDate = String(payload.activityDate ?? "").trim();
  return {
    clientId,
    clientName: String(payload.clientName ?? ""),
    clientSearchKey: String(payload.clientSearchKey ?? ""),
    subject: subject || description.slice(0, 80),
    description: description || subject,
    activityType: String(payload.activityType ?? "Note").trim() || "Note",
    activityDate: /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().slice(0, 10),
  };
}

export async function saveClientActivityDraft(
  supabase: SupabaseClient,
  session: AuthSession,
  draftId: string
) {
  const draft = await fetchAiDraftForSession(supabase, session, draftId);
  if (!draft) {
    return { ok: false as const, error: "Draft not found or expired." };
  }
  if (draft.entity_type !== "client_activity") {
    return { ok: false as const, error: "This draft cannot be saved from here." };
  }

  const activityDraft = activityDraftFromPayload(draft.payload);
  if (!activityDraft) {
    return { ok: false as const, error: "Activity draft is missing required fields." };
  }

  const saved = await persistAiClientActivity(supabase, session, activityDraft);
  if (!saved.ok) {
    return { ok: false as const, error: saved.error ?? "Could not save activity." };
  }

  await deleteAiDraft(supabase, session, draftId);
  await logAiPrepareSaved(session, {
    draftId,
    entityType: "client_activity",
    entityId: saved.record.clientId,
    entityLabel: activityDraft.clientName || activityDraft.clientSearchKey,
  });

  return {
    ok: true as const,
    activityId: saved.record.id,
    clientId: saved.record.clientId,
    clientName: activityDraft.clientName,
    subject: saved.record.subject,
    href: saved.href,
  };
}
