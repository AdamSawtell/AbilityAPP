import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, ClientDraft } from "@/lib/ai/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { createAiDraft } from "@/lib/ai/draft-server";

function normalizeDraft(raw: Record<string, unknown>): ClientDraft {
  return {
    firstName: String(raw.firstName ?? "").trim(),
    lastName: String(raw.lastName ?? "").trim(),
    preferredName: String(raw.preferredName ?? "").trim(),
    email: String(raw.email ?? "").trim(),
    phone: String(raw.phone ?? "").trim(),
    status: String(raw.status ?? "1_Prospect").trim(),
    fundingBody: String(raw.fundingBody ?? "").trim(),
    disability: String(raw.disability ?? "").trim(),
    services: String(raw.services ?? "").trim(),
  };
}

export async function runClientCreatePrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
): Promise<{
  threadState: ChatThreadState;
  message: string;
  summary?: string;
  href?: string;
  draftId?: string;
}> {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { threadState, message: "Your role cannot create clients." };
  }

  const draft = normalizeDraft(args);
  if (!draft.firstName || !draft.lastName) {
    return { threadState, message: "First name and last name are required before preparing a client." };
  }

  if (!supabase) {
    return { threadState, message: "Database not configured." };
  }

  const summary = `${draft.firstName} ${draft.lastName}${draft.email ? ` · ${draft.email}` : ""}`;
  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "client",
    targetRoute: "/clients/new",
    payload: draft,
    summary,
  });

  const nextState: ChatThreadState = { ...threadState, pendingClientDraft: null };

  return {
    threadState: nextState,
    message:
      "Client prepared for review. The user must open the link, check the details, and click Save on the form. You cannot save records yourself.",
    summary,
    href,
    draftId: id,
  };
}
