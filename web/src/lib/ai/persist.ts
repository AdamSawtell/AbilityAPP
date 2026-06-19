import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ClientDraft, ClientPatchDraft, EnquiryDraft, TaskDraft, TaskUpdateDraft } from "@/lib/ai/types";
import { aiCanAccessWindow, aiCanProcess, aiCanWriteWindow } from "@/lib/ai/access";
import { clientActivityCoachSaveHref } from "@/lib/ai/activity-coach-display";
import { emptyClientRecord, normalizeClient, type ClientRecord } from "@/lib/client";
import { convertEnquiryToClient } from "@/lib/convert";
import { createEnquiry, emptyEnquiry, normalizeEnquiry, type EnquiryRecord } from "@/lib/enquiry";
import {
  appendClientActivity,
  fetchTasks,
  nextClientActivityLineNo,
  patchClientFields,
  saveClient,
  saveEnquiry,
  saveTask,
} from "@/lib/supabase/data-api";
import { enquiryFromRow } from "@/lib/supabase/mappers";
import { createTask, describeAssignee, logTaskUpdate, normalizeTask, type TaskRecord } from "@/lib/task";
import { canActionTask } from "@/lib/task-access";
import { canCreateTaskType } from "@/lib/task-type-access";
import type { IncidentDraft } from "@/lib/ai/tools/incident-draft";
import { incidentDraftToPartial } from "@/lib/ai/tools/incident-draft";
import type { IncidentUpdateDraft } from "@/lib/ai/types";
import { createIncident, advanceIncidentWorkflow, normalizeIncident, type IncidentRecord } from "@/lib/incident";
import { fetchIncidents, saveIncident } from "@/lib/supabase/data-api";

export type AiPersistResult<T> =
  | { ok: true; record: T; href?: string }
  | { ok: false; error: string };

function canReadClientActivity(session: AuthSession): boolean {
  return aiCanAccessWindow(session, "clients") || aiCanAccessWindow(session, "client-activity");
}

export async function persistAiClient(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: ClientDraft
): Promise<AiPersistResult<ClientRecord>> {
  if (!aiCanWriteWindow(session, "clients")) {
    return { ok: false, error: "Your role cannot create clients." };
  }

  const { data: existingRows } = await supabase.from("client").select("id, search_key");
  const existing = (existingRows ?? []).map((r) => ({ searchKey: r.search_key as string }));
  const client = emptyClientRecord(draft, session.displayName, existing);

  const duplicate = (existingRows ?? []).find((r) => r.id === client.id);
  if (duplicate) {
    return { ok: false, error: `A client already exists with search key ${client.searchKey}.` };
  }

  try {
    await saveClient(supabase, client);
    return {
      ok: true,
      record: normalizeClient(client),
      href: `/clients/${client.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save client";
    return { ok: false, error: message };
  }
}

export async function persistAiTask(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: TaskDraft
): Promise<AiPersistResult<TaskRecord>> {
  if (!aiCanWriteWindow(session, "tasks")) {
    return { ok: false, error: "Your role cannot create tasks." };
  }
  if (!canCreateTaskType(session, draft.taskTypeId)) {
    return { ok: false, error: "Your role cannot create this task type." };
  }
  if (!draft.title.trim()) {
    return { ok: false, error: "Task title is required." };
  }

  try {
    const existing = await fetchTasks(supabase);
    const base = createTask(
      {
        title: draft.title,
        description: draft.description,
        status: "Open",
        taskTypeId: draft.taskTypeId,
        priority: draft.priority,
        dueDate: draft.dueDate,
        assignmentType: draft.assignmentType,
        assigneeUserId: draft.assigneeUserId,
        assigneeRoleId: draft.assigneeRoleId,
        entityType: (draft.entityType || "") as TaskRecord["entityType"],
        entityId: draft.entityId,
        entityLabel: draft.entityLabel,
        createdByUserId: session.userId,
        createdBy: session.displayName,
        updatedBy: session.displayName,
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
        updates: [],
      },
      existing
    );
    const assignee = describeAssignee(base);
    const created = logTaskUpdate(base, {
      byUserId: session.userId,
      byName: session.displayName,
      action: "created",
      summary: `Created and assigned to ${assignee}`,
      detail: draft.entityLabel ? `Linked to ${draft.entityLabel}.` : draft.description || "",
    });
    await saveTask(supabase, created);
    return {
      ok: true,
      record: normalizeTask(created),
      href: `/tasks/${created.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save task";
    return { ok: false, error: message };
  }
}

export type ClientActivityDraft = {
  clientId: string;
  clientName: string;
  clientSearchKey: string;
  subject: string;
  description: string;
  activityType: string;
  activityDate: string;
};

export async function persistAiClientActivity(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: ClientActivityDraft
): Promise<AiPersistResult<{ id: string; clientId: string; subject: string }>> {
  if (!aiCanWriteWindow(session, "client-activity")) {
    return { ok: false, error: "Your role cannot add client activity." };
  }

  const { data: client } = await supabase
    .from("client")
    .select("id, search_key, name")
    .eq("id", draft.clientId)
    .maybeSingle();
  if (!client) {
    return { ok: false, error: "Client not found." };
  }

  const lineNo = await nextClientActivityLineNo(supabase, draft.clientId);
  const id = `ca-ai-${Date.now().toString(36)}`;
  const activity = {
    id,
    lineNo,
    date: draft.activityDate || new Date().toISOString().slice(0, 10),
    activityType: draft.activityType || "Note",
    subject: draft.subject,
    description: draft.description,
    createdBy: session.displayName,
  };

  try {
    await appendClientActivity(supabase, draft.clientId, activity);
    await supabase
      .from("client")
      .update({ updated_by: session.displayName })
      .eq("id", draft.clientId);
    return {
      ok: true,
      record: { id, clientId: draft.clientId, subject: draft.subject },
      href: clientActivityCoachSaveHref(client.id),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save activity";
    return { ok: false, error: message };
  }
}

export async function persistAiClientPatch(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: ClientPatchDraft
): Promise<AiPersistResult<ClientRecord>> {
  if (!aiCanWriteWindow(session, "clients") && !aiCanWriteWindow(session, "client-activity")) {
    return { ok: false, error: "Your role cannot update clients." };
  }

  try {
    await patchClientFields(supabase, draft.clientId, draft.fields, session.displayName);
    const { data } = await supabase.from("client").select("*").eq("id", draft.clientId).maybeSingle();
    if (!data) return { ok: false, error: "Client not found after update." };
    const record = normalizeClient(clientFromRowMinimal(data, draft.clientName, draft.clientSearchKey));
    return {
      ok: true,
      record,
      href: `/clients/${draft.clientId}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update client";
    return { ok: false, error: message };
  }
}

function clientFromRowMinimal(
  row: Record<string, unknown>,
  name: string,
  searchKey: string
): ClientRecord {
  return {
    id: String(row.id),
    enquiryId: String(row.enquiry_id ?? ""),
    searchKey: String(row.search_key ?? searchKey),
    businessPartnerGroup: String(row.business_partner_group ?? "Support Receiver"),
    name: String(row.name ?? name),
    riskAlerts: String(row.risk_alerts ?? ""),
    consentAlertList: String(row.consent_alert_list ?? ""),
    firstName: String(row.first_name ?? ""),
    preferredName: String(row.preferred_name ?? ""),
    lastName: String(row.last_name ?? ""),
    middleName: String(row.middle_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    status: String(row.status ?? ""),
    lifecycleStatus: String(row.lifecycle_status ?? "intake"),
    planReviewDueDate: String(row.plan_review_due_date ?? ""),
    lifecycleExitReason: String(row.lifecycle_exit_reason ?? ""),
    birthday: String(row.birthday ?? ""),
    isEstimatedAge: Boolean(row.is_estimated_age),
    gender: String(row.gender ?? ""),
    decisionMaking: String(row.decision_making ?? ""),
    lgbtiqa: String(row.lgbtiqa ?? ""),
    livingArrangement: String(row.living_arrangement ?? ""),
    salesRepresentative: String(row.sales_representative ?? ""),
    services: String(row.services ?? ""),
    fundingBody: String(row.funding_body ?? ""),
    fundingBodyNumber: String(row.funding_body_number ?? ""),
    transitionedToPace: String(row.transitioned_to_pace ?? ""),
    dateSupportCommencement: String(row.date_support_commencement ?? ""),
    dateSupportCeased: String(row.date_support_ceased ?? ""),
    aboriginalTorresStraitIslander: String(row.aboriginal_torres_strait_islander ?? ""),
    culturalAffiliation: String(row.cultural_affiliation ?? ""),
    disability: String(row.disability ?? ""),
    additionalDisabilityInformation: String(row.additional_disability_information ?? ""),
    createdBy: String(row.created_by ?? ""),
    updatedBy: String(row.updated_by ?? ""),
    alerts: [],
    activity: [],
    locations: [],
    restrictivePractices: [],
    consents: [],
    risks: [],
    bpAssociations: [],
    contactActivity: [],
    needsAndRules: [],
  };
}

export async function persistAiEnquiry(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: EnquiryDraft
): Promise<AiPersistResult<EnquiryRecord>> {
  if (!aiCanWriteWindow(session, "enquiries")) {
    return { ok: false, error: "Your role cannot create enquiries." };
  }

  try {
    const { data: existingRows } = await supabase.from("enquiry").select("id, document_no");
    const existing = (existingRows ?? []).map((r) =>
      normalizeEnquiry({ ...emptyEnquiry(), id: r.id, documentNo: r.document_no })
    );
    const enquiry = createEnquiry(
      {
        ...emptyEnquiry(),
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email ?? "",
        phone: draft.phone ?? "",
        fundingBody: draft.fundingBody ?? "",
        disability: draft.disability ?? "",
        services: draft.services ?? "",
        description: draft.description ?? "",
        enquirySource: draft.enquirySource ?? "Phone Call",
        status: draft.status ?? "1_Initial Enquiry",
        createdBy: session.displayName,
        updatedBy: session.displayName,
      },
      existing
    );
    await saveEnquiry(supabase, enquiry);
    return { ok: true, record: enquiry, href: `/enquiries/${enquiry.id}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save enquiry";
    return { ok: false, error: message };
  }
}

export async function persistAiEnquiryConvert(
  supabase: SupabaseClient,
  session: AuthSession,
  enquiryId: string
): Promise<AiPersistResult<ClientRecord>> {
  if (!aiCanWriteWindow(session, "enquiries") || !aiCanWriteWindow(session, "clients")) {
    return { ok: false, error: "Your role cannot convert enquiries." };
  }
  if (!aiCanProcess(session, "enquiry-to-client")) {
    return { ok: false, error: "Your role does not have the enquiry-to-client process." };
  }

  try {
    const { data: enquiryRow } = await supabase.from("enquiry").select("*").eq("id", enquiryId).maybeSingle();
    if (!enquiryRow) return { ok: false, error: "Enquiry not found." };

    const { data: activityRows } = await supabase
      .from("enquiry_activity")
      .select("*")
      .eq("enquiry_id", enquiryId);
    const enquiry = enquiryFromRow(enquiryRow, activityRows ?? []);

    const { data: clientRows } = await supabase.from("client").select("*");
    const existingClients = (clientRows ?? []).map((r) =>
      normalizeClient(clientFromRowMinimal(r, String(r.name ?? ""), String(r.search_key ?? "")))
    );

    const existing = existingClients.find((c) => c.enquiryId === enquiryId);
    if (existing) {
      return { ok: true, record: existing, href: `/clients/${existing.id}` };
    }

    const client = convertEnquiryToClient(enquiry, existingClients);
    const updatedEnquiry: EnquiryRecord = {
      ...enquiry,
      status: "4_Converted",
      outcome:
        enquiry.outcome ||
        `Converted to client ${client.searchKey} on ${new Date().toLocaleDateString("en-AU")}.`,
      updatedBy: session.displayName,
    };

    await saveClient(supabase, client);
    await saveEnquiry(supabase, updatedEnquiry);

    return { ok: true, record: normalizeClient(client), href: `/clients/${client.searchKey}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not convert enquiry";
    return { ok: false, error: message };
  }
}

export async function persistAiTaskUpdate(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: TaskUpdateDraft
): Promise<AiPersistResult<TaskRecord>> {
  if (!aiCanWriteWindow(session, "tasks")) {
    return { ok: false, error: "Your role cannot update tasks." };
  }

  const tasks = await fetchTasks(supabase);
  const task = tasks.find((t) => t.id === draft.taskId);
  if (!task) return { ok: false, error: "Task not found." };
  if (!canActionTask(task, session) && !aiCanAccessWindow(session, "tasks-all")) {
    return { ok: false, error: "You cannot action this task." };
  }

  let next = normalizeTask(task);

  try {
    if (draft.action === "complete") {
      next = logTaskUpdate(
        {
          ...next,
          status: "Completed",
          completedBy: session.displayName,
          completedAt: new Date().toISOString(),
          resolutionNotes: draft.resolutionNotes ?? next.resolutionNotes,
        },
        {
          byUserId: session.userId,
          byName: session.displayName,
          action: "closed",
          summary: "Task completed",
          detail: draft.resolutionNotes ?? "",
        }
      );
    } else if (draft.action === "change_status" && draft.status) {
      next = logTaskUpdate(next, {
        byUserId: session.userId,
        byName: session.displayName,
        action: "status_changed",
        summary: `Status changed to ${draft.status}`,
        detail: "",
      });
      next = { ...next, status: draft.status };
    } else if (draft.action === "reassign" && draft.assignmentType) {
      const reassigned = {
        ...next,
        assignmentType: draft.assignmentType,
        assigneeUserId: draft.assigneeUserId ?? "",
        assigneeRoleId: draft.assigneeRoleId ?? "",
      };
      next = logTaskUpdate(reassigned, {
        byUserId: session.userId,
        byName: session.displayName,
        action: "reassigned",
        summary: `Reassigned to ${describeAssignee(reassigned)}`,
        detail: "",
      });
    } else if (draft.action === "add_note" && draft.note) {
      next = logTaskUpdate(next, {
        byUserId: session.userId,
        byName: session.displayName,
        action: "note_added",
        summary: "Note added",
        detail: draft.note,
      });
    } else {
      return { ok: false, error: "Invalid task update." };
    }

    await saveTask(supabase, next);
    return { ok: true, record: next, href: `/tasks/${next.id}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update task";
    return { ok: false, error: message };
  }
}

export async function persistAiIncident(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: IncidentDraft
): Promise<AiPersistResult<IncidentRecord>> {
  if (!aiCanWriteWindow(session, "incidents")) {
    return { ok: false, error: "Your role cannot report incidents." };
  }

  try {
    const existing = await fetchIncidents(supabase);
    const partial = incidentDraftToPartial(draft, session.displayName);
    const created = createIncident(partial, existing);
    await saveIncident(supabase, created);
    return {
      ok: true,
      record: created,
      href: `/incidents/${created.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save incident";
    return { ok: false, error: message };
  }
}

export async function persistAiIncidentUpdate(
  supabase: SupabaseClient,
  session: AuthSession,
  draft: IncidentUpdateDraft
): Promise<AiPersistResult<IncidentRecord>> {
  if (!aiCanWriteWindow(session, "incidents")) {
    return { ok: false, error: "Your role cannot update incidents." };
  }

  try {
    const incidents = await fetchIncidents(supabase);
    const existing = incidents.find((i) => i.id === draft.incidentId);
    if (!existing) {
      return { ok: false, error: `Incident ${draft.documentNo} not found.` };
    }

    let next = normalizeIncident({ ...existing });

    switch (draft.action) {
      case "change_status":
        if (draft.status) next = normalizeIncident({ ...next, status: draft.status, updatedBy: session.displayName });
        break;
      case "manager_review":
        next = advanceIncidentWorkflow(next, "manager_review", session.displayName);
        next = { ...next, updatedBy: session.displayName };
        break;
      case "commission_notified":
        next = advanceIncidentWorkflow(next, "commission_notified", session.displayName);
        if (draft.ndisNotificationRef) {
          next = { ...next, ndisNotificationRef: draft.ndisNotificationRef, updatedBy: session.displayName };
        }
        break;
      case "add_investigation_note": {
        const note = draft.investigationNote?.trim() ?? "";
        const prefix = next.investigationSummary.trim() ? `${next.investigationSummary}\n\n` : "";
        next = normalizeIncident({
          ...next,
          investigationSummary: `${prefix}[${session.displayName}] ${note}`,
          status: next.status === "Submitted" || next.status === "Manager reviewed" ? "Under investigation" : next.status,
          updatedBy: session.displayName,
        });
        break;
      }
      case "close":
        next = normalizeIncident({ ...next, status: "Closed", updatedBy: session.displayName });
        break;
      default:
        return { ok: false, error: "Invalid incident update action." };
    }

    await saveIncident(supabase, next);
    return {
      ok: true,
      record: next,
      href: `/incidents/${next.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update incident";
    return { ok: false, error: message };
  }
}
