import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import { persistAiClientActivity, type ClientActivityDraft } from "@/lib/ai/persist";
import { canAccessWindow } from "@/lib/access/catalog";
import { resolveClient } from "@/lib/ai/tools/client-resolve";

function canAccess(session: AuthSession): boolean {
  return canAccessWindow(session.windowKeys, "clients") || canAccessWindow(session.windowKeys, "client-activity");
}

export async function runClientActivityDraftCreate(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!canAccess(session)) {
    return { threadState, message: "Your role cannot add client activity." };
  }
  if (!supabase) {
    return { threadState, message: "Database not configured." };
  }

  const client = await resolveClient(supabase, {
    clientId: String(args.clientId ?? ""),
    searchKey: String(args.searchKey ?? ""),
    name: String(args.clientName ?? args.name ?? ""),
    pagePath: String(args.pagePath ?? ""),
  });
  if (!client) {
    return { threadState, message: "Which client is this activity for? Provide a name or search key." };
  }

  const subject = String(args.subject ?? "").trim();
  const description = String(args.description ?? args.note ?? "").trim();
  if (!subject && !description) {
    return { threadState, message: "What should the activity note say? Provide a subject or description." };
  }

  const draft: ClientActivityDraft = {
    clientId: client.id,
    clientName: client.name,
    clientSearchKey: client.searchKey,
    subject: subject || description.slice(0, 80),
    description: description || subject,
    activityType: String(args.activityType ?? "Note").trim() || "Note",
    activityDate: String(args.activityDate ?? "").trim(),
  };

  return {
    threadState: { ...threadState, pendingClientActivityDraft: draft },
    message: "Activity draft ready. Ask the user to confirm before saving.",
    summary: `${client.name}: ${draft.subject}`,
    draft,
  };
}

export async function runClientActivityDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState
) {
  const draft = threadState.pendingClientActivityDraft;
  if (!draft) {
    return { threadState, message: "No pending activity draft. Use client_activity_draft_create first." };
  }
  if (!supabase) {
    return { threadState, message: "Database not configured." };
  }

  const result = await persistAiClientActivity(supabase, session, draft);
  if (!result.ok) {
    return { threadState, message: result.error };
  }

  return {
    threadState: { ...threadState, pendingClientActivityDraft: null },
    message: "Activity saved.",
    activity: result.record,
    href: result.href,
  };
}
