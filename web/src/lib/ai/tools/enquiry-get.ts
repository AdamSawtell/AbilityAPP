import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { enquiryFromRow } from "@/lib/supabase/mappers";

export async function runEnquiryGet(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { enquiryId?: string; documentNo?: string; name?: string }
) {
  if (!aiCanAccessWindow(session, "enquiries")) {
    return { found: false, note: "You do not have access to enquiries." };
  }

  const enquiryId = args.enquiryId?.trim() ?? "";
  const documentNo = args.documentNo?.trim() ?? "";
  const name = args.name?.trim() ?? "";

  let query = supabase.from("enquiry").select("*");
  if (enquiryId) query = query.eq("id", enquiryId);
  else if (documentNo) query = query.eq("document_no", documentNo);
  else if (name) query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
  else return { found: false, error: "Provide enquiryId, documentNo, or name." };

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return { found: false };

  const { data: activities } = await supabase
    .from("enquiry_activity")
    .select("id, activity_date, activity_type, subject, description, updated_at")
    .eq("enquiry_id", data.id)
    .order("updated_at", { ascending: false })
    .limit(8);

  const enquiry = enquiryFromRow(data);
  return {
    found: true,
    enquiry: {
      id: enquiry.id,
      documentNo: enquiry.documentNo,
      name: `${enquiry.firstName} ${enquiry.lastName}`.trim(),
      status: enquiry.status,
      email: enquiry.email,
      phone: enquiry.phone,
      fundingBody: enquiry.fundingBody,
      disability: enquiry.disability,
      services: enquiry.services,
      description: enquiry.description,
      dateReceived: enquiry.dateReceived,
      updatedAt: data.updated_at,
      href: `/enquiries/${enquiry.id}`,
    },
    recentActivity: (activities ?? []).map((a) => ({
      date: a.activity_date,
      type: a.activity_type,
      subject: a.subject,
      description: (a.description ?? "").slice(0, 200),
      updatedAt: a.updated_at,
    })),
  };
}
