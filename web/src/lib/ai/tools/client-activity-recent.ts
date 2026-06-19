import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { resolveClient } from "@/lib/ai/tools/client-resolve";

export type ClientActivityRecentPurpose = "summary" | "coach";

const GUIDANCE: Record<ClientActivityRecentPurpose, string> = {
  summary:
    "Summarise these notes in plain language for handover. Use bullets: themes, risks, follow-ups, and gaps. Only use what is in the notes — do not invent details.",
  coach:
    "Step 2 only — call after the user confirmed the client (Step 1). The UI shows notes in a table; also give a short numbered overview in your reply, then ask one question at a time about what is new. After 2–3 answers, call client_activity_prepare. User saves from the review popup.",
};

function daysSince(isoDate: string): number | null {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

export async function runClientActivityRecent(
  supabase: SupabaseClient,
  session: AuthSession,
  args: {
    clientId?: string;
    searchKey?: string;
    name?: string;
    clientName?: string;
    limit?: number;
    purpose?: string;
    pagePath?: string;
  },
  threadState: ChatThreadState = {}
) {
  const canAccess =
    canAccessWindow(session.windowKeys, "clients") || canAccessWindow(session.windowKeys, "client-activity");
  if (!canAccess) {
    return { found: false, note: "You do not have access to client activity." };
  }

  const client = await resolveClient(supabase, {
    clientId: args.clientId,
    searchKey: args.searchKey,
    name: args.clientName ?? args.name,
    pagePath: args.pagePath,
  });
  if (!client) {
    return { found: false, error: "Provide clientId, searchKey, or client name." };
  }

  const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 10);
  const purpose: ClientActivityRecentPurpose = args.purpose === "coach" ? "coach" : "summary";

  const { data: rows, error } = await supabase
    .from("client_activity")
    .select("id, line_no, activity_date, activity_type, subject, description, created_by, updated_at")
    .eq("client_id", client.id)
    .order("activity_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const activities = (rows ?? []).map((row, index) => ({
    position: index + 1,
    lineNo: row.line_no,
    date: row.activity_date,
    type: row.activity_type,
    subject: row.subject,
    description: row.description ?? "",
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    daysAgo: daysSince(row.activity_date ?? row.updated_at ?? ""),
  }));

  return {
    found: true,
    purpose,
    guidance: GUIDANCE[purpose],
    client: {
      id: client.id,
      name: client.name,
      searchKey: client.searchKey,
      href: `/clients/${client.id}?tab=Activity`,
    },
    limit,
    count: activities.length,
    activities,
    emptyNote:
      activities.length === 0
        ? "No activity notes on file yet. Ask the user what happened today, then use client_activity_prepare when ready."
        : undefined,
    threadState:
      purpose === "coach" && threadState.activityCoachClient
        ? {
            ...threadState,
            activityCoachNotesReviewed: true,
            activityCoachClientConfirmed: true,
          }
        : threadState,
  };
}
