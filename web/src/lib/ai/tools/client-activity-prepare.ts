import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import type { ClientActivityDraft } from "@/lib/ai/persist";
import { canAccessWindow } from "@/lib/access/catalog";
import { createAiDraft } from "@/lib/ai/draft-server";

async function resolveClient(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<{ id: string; name: string; searchKey: string } | null> {
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

export async function runClientActivityPrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  const canAccess =
    canAccessWindow(session.windowKeys, "clients") || canAccessWindow(session.windowKeys, "client-activity");
  if (!canAccess) {
    return { threadState, message: "Your role cannot add client activity." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const client = await resolveClient(supabase, args);
  if (!client) {
    return { threadState, message: "Which client is this activity for? Provide name or search key." };
  }

  const subject = String(args.subject ?? args.title ?? "").trim();
  const notes = String(args.notes ?? args.description ?? args.body ?? "").trim();
  if (!subject && !notes) {
    return { threadState, message: "What should the activity note say? Provide a subject or notes." };
  }

  const draft: ClientActivityDraft = {
    clientId: client.id,
    clientName: client.name,
    clientSearchKey: client.searchKey,
    subject: subject || notes.slice(0, 80),
    description: notes || subject,
    activityType: String(args.activityType ?? "Note").trim() || "Note",
    activityDate: new Date().toISOString().slice(0, 10),
  };

  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "client_activity",
    targetRoute: `/clients/${client.searchKey}?tab=Activity`,
    payload: { ...draft, prepareKind: "activity" },
    summary: `${client.name}: ${draft.subject}`,
  });

  return {
    threadState: { ...threadState, pendingClientActivityDraft: null },
    message: "Activity note prepared for review. Send the user the link — they must open Activity and save.",
    summary: draft.subject,
    href,
    draftId: id,
  };
}
