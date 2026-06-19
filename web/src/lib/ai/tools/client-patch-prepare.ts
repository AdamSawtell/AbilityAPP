import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, ClientPatchDraft } from "@/lib/ai/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { createAiDraft } from "@/lib/ai/draft-server";

async function resolveClientId(
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

export async function runClientPatchPrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "clients")) {
    return { threadState, message: "Your role cannot update clients." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const client = await resolveClientId(supabase, args);
  if (!client) {
    return { threadState, message: "Which client should be updated? Provide name or search key." };
  }

  const fields: ClientPatchDraft["fields"] = {};
  if (args.status !== undefined) fields.status = String(args.status).trim();
  if (args.email !== undefined) fields.email = String(args.email).trim();
  if (args.phone !== undefined) fields.phone = String(args.phone).trim();
  if (args.fundingBody !== undefined) fields.fundingBody = String(args.fundingBody).trim();
  if (args.disability !== undefined) fields.disability = String(args.disability).trim();
  if (args.services !== undefined) fields.services = String(args.services).trim();
  if (args.preferredName !== undefined) fields.preferredName = String(args.preferredName).trim();

  if (!Object.keys(fields).length) {
    return { threadState, message: "What should change? For example status, phone, or funding body." };
  }

  const draft: ClientPatchDraft = {
    clientId: client.id,
    clientName: client.name,
    clientSearchKey: client.searchKey,
    fields,
  };

  const summary = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "client_patch",
    targetRoute: `/clients/${client.searchKey}`,
    payload: { ...draft, prepareKind: "patch" },
    summary: `${client.name} — ${summary}`,
  });

  return {
    threadState: { ...threadState, pendingClientPatch: null },
    message: "Client update prepared for review. Send the user the link — they must check fields and click Save.",
    summary: `${client.name} — ${summary}`,
    href,
    draftId: id,
  };
}
