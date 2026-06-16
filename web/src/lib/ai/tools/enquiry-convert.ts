import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import { aiCanAccessWindow, aiCanProcess } from "@/lib/ai/access";

async function resolveEnquiry(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<{ id: string; documentNo: string; name: string } | null> {
  const enquiryId = String(args.enquiryId ?? "").trim();
  const documentNo = String(args.documentNo ?? "").trim();
  const name = String(args.enquiryName ?? args.name ?? "").trim();

  let query = supabase.from("enquiry").select("id, document_no, first_name, last_name");
  if (enquiryId) query = query.eq("id", enquiryId);
  else if (documentNo) query = query.eq("document_no", documentNo);
  else if (name) query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
  else return null;

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    documentNo: data.document_no,
    name: `${data.first_name} ${data.last_name}`.trim(),
  };
}

export async function runEnquiryConvertDraftCreate(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "enquiries") || !aiCanAccessWindow(session, "clients")) {
    return { threadState, message: "Your role cannot convert enquiries to clients." };
  }
  if (!aiCanProcess(session, "enquiry-to-client")) {
    return { threadState, message: "Your role does not have the enquiry-to-client process." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const enquiry = await resolveEnquiry(supabase, args);
  if (!enquiry) {
    return { threadState, message: "Which enquiry should be converted? Provide document number or name." };
  }

  const { data: existingClient } = await supabase
    .from("client")
    .select("id, search_key")
    .eq("enquiry_id", enquiry.id)
    .maybeSingle();
  if (existingClient) {
    return {
      threadState,
      message: `This enquiry was already converted to client ${existingClient.search_key}.`,
    };
  }

  return {
    threadState: { ...threadState, pendingEnquiryConvertId: enquiry.id },
    message: "Conversion draft ready. Ask the user to confirm before converting.",
    summary: `Convert enquiry ${enquiry.documentNo} (${enquiry.name}) to a client`,
    enquiryId: enquiry.id,
  };
}

export async function runEnquiryConvertDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState
) {
  const enquiryId = threadState.pendingEnquiryConvertId;
  if (!enquiryId) {
    return { threadState, message: "No pending conversion. Use enquiry_convert_draft_create first." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const { persistAiEnquiryConvert } = await import("@/lib/ai/persist");
  const result = await persistAiEnquiryConvert(supabase, session, enquiryId);
  if (!result.ok) return { threadState, message: result.error };

  return {
    threadState: { ...threadState, pendingEnquiryConvertId: null },
    message: "Enquiry converted to client in the database.",
    client: result.record,
    href: result.href,
  };
}
