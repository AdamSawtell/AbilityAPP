import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, IncidentUpdateDraft } from "@/lib/ai/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { persistAiIncidentUpdate } from "@/lib/ai/persist";
import { resolveIncident } from "@/lib/ai/tools/incident-resolve";
import type { IncidentStatus } from "@/lib/incident";

const VALID_ACTIONS: IncidentUpdateDraft["action"][] = [
  "change_status",
  "manager_review",
  "commission_notified",
  "add_investigation_note",
  "close",
];

const STATUS_VALUES: IncidentStatus[] = [
  "Draft",
  "Submitted",
  "Manager reviewed",
  "Commission notified",
  "Under investigation",
  "Actions in progress",
  "Closed",
];

export async function runIncidentUpdateDraftCreate(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "incidents")) {
    return { threadState, message: "Your role cannot update incidents." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const incident = await resolveIncident(supabase, args);
  if (!incident) {
    return { threadState, message: "Which incident? Provide document number, title, or incident id." };
  }

  const action = String(args.action ?? "").trim() as IncidentUpdateDraft["action"];
  if (!VALID_ACTIONS.includes(action)) {
    return {
      threadState,
      message:
        "What should happen? change_status, manager_review, commission_notified, add_investigation_note, or close.",
    };
  }

  const draft: IncidentUpdateDraft = {
    incidentId: incident.id,
    documentNo: incident.documentNo,
    title: incident.title,
    action,
  };

  if (action === "change_status") {
    const status = String(args.status ?? "").trim() as IncidentStatus;
    if (!STATUS_VALUES.includes(status)) {
      return { threadState, message: `Which status? One of: ${STATUS_VALUES.join(", ")}` };
    }
    draft.status = status;
  }
  if (action === "add_investigation_note") {
    draft.investigationNote = String(args.note ?? args.investigationNote ?? "").trim();
    if (!draft.investigationNote) {
      return { threadState, message: "What investigation note should be added?" };
    }
  }
  if (action === "commission_notified") {
    draft.ndisNotificationRef = String(args.ndisNotificationRef ?? args.reference ?? "").trim();
  }

  const summary = `${incident.documentNo}: ${action}${draft.status ? ` → ${draft.status}` : ""}`;

  return {
    threadState: { ...threadState, pendingIncidentUpdate: draft },
    message: "Incident update draft ready. Ask the user to confirm before saving.",
    summary,
    draft,
  };
}

export async function runIncidentUpdateDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState
) {
  const draft = threadState.pendingIncidentUpdate;
  if (!draft) {
    return { threadState, message: "No pending incident update. Use incident_update_draft_create first." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const result = await persistAiIncidentUpdate(supabase, session, draft);
  if (!result.ok) return { threadState, message: result.error };

  return {
    threadState: { ...threadState, pendingIncidentUpdate: null },
    message: "Incident updated in the database.",
    incident: result.record,
    href: result.href,
  };
}
