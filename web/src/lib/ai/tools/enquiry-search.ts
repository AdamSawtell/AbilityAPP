import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { aiCanAccessWindow } from "@/lib/ai/access";

export async function runEnquirySearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; limit?: number; sortBy?: "name" | "updated" }
) {
  if (!aiCanAccessWindow(session, "enquiries")) {
    return { count: 0, results: [], note: "You do not have access to enquiries." };
  }

  const query = args.query?.trim() ?? "";
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);
  const sortBy = args.sortBy === "updated" ? "updated" : "name";

  const { data, error } = await supabase
    .from("enquiry")
    .select("id, document_no, first_name, last_name, status, email, phone, updated_at")
    .order(sortBy === "updated" ? "updated_at" : "last_name", { ascending: sortBy !== "updated" })
    .limit(sortBy === "updated" && !query ? limit : 200);
  if (error) throw error;

  const q = query.toLowerCase();
  const filtered = (data ?? []).filter((row) => {
    if (!q) return true;
    const blob = [row.first_name, row.last_name, row.document_no, row.email, row.status].join(" ").toLowerCase();
    return blob.includes(q);
  });

  const sorted =
    sortBy === "updated" && q
      ? [...filtered].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
      : filtered;

  return {
    query,
    count: sorted.length,
    results: sorted.slice(0, limit).map((row) => ({
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
