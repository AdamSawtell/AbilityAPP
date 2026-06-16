import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { emptyIncident, type IncidentRecord } from "@/lib/incident";

export type IncidentDraft = {
  title: string;
  description: string;
  severity: IncidentRecord["severity"];
  category: string;
  isReportable: boolean;
  reportableType: IncidentRecord["reportableType"];
  primaryClientId: string;
  primaryEmployeeId: string;
  primaryLocationId: string;
  clientName?: string;
  employeeName?: string;
};

function canAccess(session: AuthSession): boolean {
  return canAccessWindow(session.windowKeys, "incidents");
}

export async function runIncidentDraftCreate(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!canAccess(session)) {
    return { threadState, message: "Your role cannot report incidents." };
  }

  const title = String(args.title ?? "").trim();
  const description = String(args.description ?? args.whatHappened ?? "").trim();
  if (!title && !description) {
    return { threadState, message: "What happened? Provide a title or description for the incident." };
  }

  let primaryClientId = String(args.clientId ?? args.primaryClientId ?? "").trim();
  const clientName = String(args.clientName ?? "").trim();
  if (!primaryClientId && clientName && supabase) {
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

  return {
    threadState: { ...threadState, pendingIncidentDraft: draft },
    message: "Incident draft ready. Ask the user to confirm before saving.",
    summary: draft.title,
    draft,
  };
}

export async function runIncidentDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState,
  persist: (draft: IncidentDraft) => Promise<
    { ok: true; record: IncidentRecord; href?: string } | { ok: false; error: string }
  >
) {
  const draft = threadState.pendingIncidentDraft;
  if (!draft) {
    return { threadState, message: "No pending incident draft. Use incident_draft_create first." };
  }
  if (!supabase) {
    return { threadState, message: "Database not configured." };
  }
  if (!canAccess(session)) {
    return { threadState, message: "Your role cannot report incidents." };
  }

  const result = await persist(draft);
  if (!result.ok) {
    return { threadState, message: result.error };
  }

  return {
    threadState: { ...threadState, pendingIncidentDraft: null },
    message: "Incident saved.",
    incident: result.record,
    href: result.href,
  };
}

export function incidentDraftToPartial(draft: IncidentDraft, createdBy: string): IncidentRecord {
  return {
    ...emptyIncident(),
    title: draft.title,
    description: draft.description,
    severity: draft.severity,
    category: draft.category,
    isReportable: draft.isReportable,
    reportableType: draft.isReportable ? draft.reportableType || "Serious injury" : "",
    status: "Submitted",
    primaryClientId: draft.primaryClientId,
    primaryEmployeeId: draft.primaryEmployeeId,
    primaryLocationId: draft.primaryLocationId,
    createdBy,
    updatedBy: createdBy,
  };
}
