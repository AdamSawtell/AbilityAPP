import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { createAiDraft } from "@/lib/ai/draft-server";
import type { IncidentDraft } from "@/lib/ai/tools/incident-draft";

export async function runIncidentCreatePrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return { threadState, message: "Your role cannot report incidents." };
  }

  const title = String(args.title ?? "").trim();
  const description = String(args.description ?? args.whatHappened ?? "").trim();
  if (!title && !description) {
    return { threadState, message: "Provide a title or description before preparing an incident." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  let primaryClientId = String(args.clientId ?? args.primaryClientId ?? "").trim();
  const clientName = String(args.clientName ?? "").trim();
  if (!primaryClientId && clientName) {
    const { data } = await supabase.from("client").select("id, name").ilike("name", `%${clientName}%`).limit(1).maybeSingle();
    if (data) primaryClientId = data.id;
  }

  const draft: IncidentDraft = {
    title: title || description.slice(0, 80),
    description: description || title,
    severity: (["Low", "Medium", "High", "Critical"].includes(String(args.severity))
      ? args.severity
      : "Medium") as IncidentDraft["severity"],
    category: String(args.category ?? "Operational").trim() || "Operational",
    isReportable: Boolean(args.isReportable ?? args.reportable),
    reportableType: String(args.reportableType ?? "") as IncidentDraft["reportableType"],
    primaryClientId,
    primaryEmployeeId: String(args.employeeId ?? args.primaryEmployeeId ?? "").trim(),
    primaryLocationId: String(args.locationId ?? args.primaryLocationId ?? "").trim(),
    clientName: clientName || undefined,
  };

  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "incident",
    targetRoute: "/incidents/new",
    payload: { ...draft, prepareKind: "create" },
    summary: draft.title,
  });

  return {
    threadState: { ...threadState, pendingIncidentDraft: null },
    message: "Incident prepared for review. Send the user the link — they must complete the wizard and submit.",
    summary: draft.title,
    href,
    draftId: id,
  };
}
