import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, EnquiryDraft } from "@/lib/ai/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { createAiDraft } from "@/lib/ai/draft-server";

function normalizeDraft(raw: Record<string, unknown>): EnquiryDraft {
  return {
    firstName: String(raw.firstName ?? "").trim(),
    lastName: String(raw.lastName ?? "").trim(),
    email: String(raw.email ?? "").trim(),
    phone: String(raw.phone ?? "").trim(),
    fundingBody: String(raw.fundingBody ?? "").trim(),
    disability: String(raw.disability ?? "").trim(),
    services: String(raw.services ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    enquirySource: String(raw.enquirySource ?? "Phone Call").trim(),
    status: String(raw.status ?? "1_Enquiry received").trim(),
  };
}

export async function runEnquiryCreatePrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "enquiries")) {
    return { threadState, message: "Your role cannot create enquiries." };
  }

  const draft = normalizeDraft(args);
  if (!draft.firstName || !draft.lastName) {
    return { threadState, message: "First name and last name are required before preparing an enquiry." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const summary = `${draft.firstName} ${draft.lastName}${draft.phone ? ` · ${draft.phone}` : ""}`;
  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "enquiry",
    targetRoute: "/enquiries/new",
    payload: { ...draft, prepareKind: "create" },
    summary,
  });

  return {
    threadState: { ...threadState, pendingEnquiryDraft: null },
    message: "Enquiry prepared for review. Send the user the link — they must open the form and click Create enquiry.",
    summary,
    href,
    draftId: id,
  };
}
