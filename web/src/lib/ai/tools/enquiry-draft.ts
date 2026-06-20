import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, EnquiryDraft } from "@/lib/ai/types";
import { aiCanAccessWindow } from "@/lib/ai/access";

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

export async function runEnquiryDraftCreate(
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "enquiries")) {
    return { threadState, message: "Your role cannot create enquiries." };
  }

  const draft = normalizeDraft(args);
  if (!draft.firstName || !draft.lastName) {
    return { threadState, message: "First name and last name are required." };
  }

  return {
    threadState: { ...threadState, pendingEnquiryDraft: draft },
    message: "Enquiry draft ready. Ask the user to confirm before creating.",
    summary: `${draft.firstName} ${draft.lastName}${draft.phone ? ` · ${draft.phone}` : ""}`,
    draft,
  };
}

export async function runEnquiryDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState
) {
  const draft = threadState.pendingEnquiryDraft;
  if (!draft) {
    return { threadState, message: "No pending enquiry draft. Use enquiry_draft_create first." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const { persistAiEnquiry } = await import("@/lib/ai/persist");
  const result = await persistAiEnquiry(supabase, session, draft);
  if (!result.ok) return { threadState, message: result.error };

  return {
    threadState: { ...threadState, pendingEnquiryDraft: null },
    message: "Enquiry created in the database.",
    enquiry: result.record,
    href: result.href,
  };
}
