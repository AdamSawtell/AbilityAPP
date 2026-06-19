import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { aiCanAccessWindow } from "@/lib/ai/access";

export async function runEnquiryListRecent(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { hours?: number; limit?: number; status?: string }
) {
  if (!aiCanAccessWindow(session, "enquiries")) {
    return { count: 0, results: [], note: "You do not have access to enquiries." };
  }

  const hours = Math.min(Math.max(Number(args.hours) || 168, 1), 24 * 90);
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
  const status = args.status?.trim() ?? "";
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("enquiry")
    .select("id, document_no, first_name, last_name, status, email, phone, updated_at")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status) query = query.ilike("status", status);

  const { data, error } = await query;
  if (error) throw error;

  return {
    hours,
    since,
    status: status || null,
    count: data?.length ?? 0,
    results: (data ?? []).map((row) => ({
      id: row.id,
      documentNo: row.document_no,
      name: `${row.first_name} ${row.last_name}`.trim(),
      status: row.status,
      email: row.email,
      phone: row.phone,
      updatedAt: row.updated_at,
      href: `/enquiries/${row.id}`,
    })),
  };
}
