import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, ClientDraft } from "@/lib/ai/types";
import { persistAiClient } from "@/lib/ai/persist";
import { canAccessWindow } from "@/lib/access/catalog";

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

export async function runClientDraftCreate(
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
): Promise<{ draft: ClientDraft; threadState: ChatThreadState; message: string; summary?: string }> {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { draft: normalizeDraft(args), threadState, message: "Your role cannot create clients." };
  }

  const draft = normalizeDraft(args);
  if (!draft.firstName || !draft.lastName) {
    return { draft, threadState, message: "First name and last name are required." };
  }

  const nextState: ChatThreadState = { ...threadState, pendingClientDraft: draft };
  return {
    draft,
    threadState: nextState,
    message: "Client draft ready. Ask the user to confirm before creating.",
    summary: `${draft.firstName} ${draft.lastName}${draft.email ? ` · ${draft.email}` : ""}`,
  };
}

export async function runClientDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState
) {
  const draft = threadState.pendingClientDraft;
  if (!draft) {
    return { client: null, threadState, message: "No pending client draft. Use client_draft_create first." };
  }
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { client: null, threadState, message: "Your role cannot create clients." };
  }
  if (!supabase) {
    return { client: null, threadState, message: "Database not configured." };
  }

  const result = await persistAiClient(supabase, session, draft);
  if (!result.ok) {
    return { client: null, threadState, message: result.error };
  }

  return {
    client: result.record,
    threadState: { ...threadState, pendingClientDraft: null },
    message: "Client created in the database.",
    href: result.href,
  };
}
