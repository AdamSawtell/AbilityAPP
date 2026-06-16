import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { resolveIncident } from "@/lib/ai/tools/incident-resolve";
import {
  formatDisplayDateTime,
  isNdisReportOverdue,
  ndisDeadlineLabel,
  type IncidentRecord,
} from "@/lib/incident";
import { ndisChecklistProgress } from "@/lib/incident-ndis";

function summariseIncident(incident: IncidentRecord, labels: { client?: string; employee?: string; location?: string }) {
  const checklist = ndisChecklistProgress(incident);
  return {
    id: incident.id,
    documentNo: incident.documentNo,
    title: incident.title,
    status: incident.status,
    severity: incident.severity,
    category: incident.category,
    isReportable: incident.isReportable,
    reportableType: incident.reportableType,
    occurredAt: formatDisplayDateTime(incident.occurredAt),
    awareAt: formatDisplayDateTime(incident.awareAt),
    reportedAt: incident.reportedAt,
    reportDeadlineAt: incident.reportDeadlineAt ? formatDisplayDateTime(incident.reportDeadlineAt) : "",
    ndisDeadline: ndisDeadlineLabel(incident),
    ndisOverdue: isNdisReportOverdue(incident),
    ndisNotifiedAt: incident.ndisNotifiedAt ? formatDisplayDateTime(incident.ndisNotifiedAt) : "",
    ndisNotificationRef: incident.ndisNotificationRef,
    managerReviewedAt: incident.managerReviewedAt ? formatDisplayDateTime(incident.managerReviewedAt) : "",
    managerReviewedBy: incident.managerReviewedBy,
    primaryClient: labels.client || incident.primaryClientId || "",
    primaryEmployee: labels.employee || incident.primaryEmployeeId || "",
    primaryLocation: labels.location || incident.primaryLocationId || "",
    description: incident.description.slice(0, 500),
    immediateActions: incident.immediateActions.slice(0, 300),
    investigationSummary: incident.investigationSummary.slice(0, 400),
    correctiveActions: incident.correctiveActions.slice(0, 300),
    lessonsLearned: incident.lessonsLearned.slice(0, 200),
    partyCount: incident.parties.length,
    actionCount: incident.actions.length,
    notificationCount: incident.notifications.length,
    evidenceCount: incident.evidence.length,
    checklistComplete: checklist.complete,
    checklistDone: `${checklist.doneRequired}/${checklist.totalRequired}`,
    href: `/incidents/${incident.id}`,
  };
}

export async function runIncidentGet(
  supabase: SupabaseClient,
  session: AuthSession,
  args: Record<string, unknown>
) {
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return { found: false, note: "You do not have access to incidents." };
  }

  const incident = await resolveIncident(supabase, args);
  if (!incident) {
    return { found: false, error: "Incident not found. Provide incidentId, documentNo, or title." };
  }

  const [clientRes, employeeRes, locationRes] = await Promise.all([
    incident.primaryClientId
      ? supabase.from("client").select("id, name, search_key").eq("id", incident.primaryClientId).maybeSingle()
      : Promise.resolve({ data: null }),
    incident.primaryEmployeeId
      ? supabase.from("employee").select("id, name, search_key").eq("id", incident.primaryEmployeeId).maybeSingle()
      : Promise.resolve({ data: null }),
    incident.primaryLocationId
      ? supabase.from("support_location").select("id, name, search_key").eq("id", incident.primaryLocationId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const clientLabel = clientRes.data
    ? `${clientRes.data.search_key} — ${clientRes.data.name}`
    : undefined;
  const employeeLabel = employeeRes.data
    ? `${employeeRes.data.search_key} — ${employeeRes.data.name}`
    : undefined;
  const locationLabel = locationRes.data
    ? `${locationRes.data.search_key} — ${locationRes.data.name}`
    : undefined;

  const checklist = ndisChecklistProgress(incident);

  return {
    found: true,
    incident: summariseIncident(incident, {
      client: clientLabel,
      employee: employeeLabel,
      location: locationLabel,
    }),
    parties: incident.parties.map((p) => ({
      type: p.partyType,
      name: p.partyName || p.entityId,
      role: p.roleInIncident,
    })),
    recentActions: incident.actions.slice(0, 6).map((a) => ({
      date: a.actionDate,
      type: a.actionType,
      description: a.description.slice(0, 120),
      owner: a.owner,
    })),
    notifications: incident.notifications.map((n) => ({
      at: n.notifiedAt ? formatDisplayDateTime(n.notifiedAt) : "",
      target: n.notifyTarget,
      method: n.method,
      reference: n.reference,
    })),
    evidence: incident.evidence.slice(0, 5).map((e) => ({
      fileName: e.fileName,
      fileUrl: e.fileUrl,
      uploadedBy: e.uploadedBy,
    })),
    ndisChecklist: checklist.items.map((i) => ({
      label: i.label,
      done: i.done,
      required: i.required,
      detail: i.detail,
    })),
  };
}
