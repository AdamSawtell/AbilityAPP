import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import type { ClientActivityDraft } from "@/lib/ai/persist";
import { canAccessWindow } from "@/lib/access/catalog";
import { createAiDraft } from "@/lib/ai/draft-server";
import { resolveClient } from "@/lib/ai/tools/client-resolve";

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

  const client = await resolveClient(supabase, {
    clientId: String(args.clientId ?? ""),
    searchKey: String(args.searchKey ?? ""),
    name: String(args.clientName ?? args.name ?? ""),
    pagePath: String(args.pagePath ?? ""),
  });
  if (!client) {
    return { threadState, message: "Which client is this activity for? Provide name or search key." };
  }

  const subject = String(args.subject ?? args.title ?? "").trim();
  const notes = String(args.notes ?? args.description ?? args.body ?? "").trim();
  if (!subject && !notes) {
    return { threadState, message: "What should the activity note say? Provide a subject or notes." };
  }

  const rawDate = String(args.activityDate ?? args.date ?? "").trim();
  const activityDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);

  const draft: ClientActivityDraft = {
    clientId: client.id,
    clientName: client.name,
    clientSearchKey: client.searchKey,
    subject: subject || notes.slice(0, 80),
    description: notes || subject,
    activityType: String(args.activityType ?? "Note").trim() || "Note",
    activityDate,
  };

  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "client_activity",
    targetRoute: `/clients/${client.id}?tab=Activity`,
    payload: { ...draft, prepareKind: "activity" },
    summary: `${client.name}: ${draft.subject}`,
  });

  return {
    threadState: {
      ...threadState,
      pendingClientActivityDraft: draft,
      activityCoachClient: { id: client.id, name: client.name, searchKey: client.searchKey },
    },
    message:
      "Activity note prepared. Tell the user to click Open form and save in chat — you have not saved it.",
    summary: draft.subject,
    href,
    draftId: id,
  };
}
