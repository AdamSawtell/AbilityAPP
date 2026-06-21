import {
  createServiceAgreement,
  initialServiceAgreements,
  normalizeServiceAgreement,
  type ServiceAgreementRecord,
} from "@/lib/service-agreement";
import type { PortalSession } from "@/lib/portal/session.server";
import {
  portalServiceRequestDedupeKey,
  type PortalServiceRequestRecord,
  type PortalServiceRequestStatus,
  type PortalServiceRequestSubmit,
} from "@/lib/portal/service-request";
import { loadPortalClientSummary, resolveValidPortalSession } from "@/lib/portal/server";
import { createTask, logTaskUpdate, type TaskRecord } from "@/lib/task";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchTasks,
  saveServiceAgreement,
  saveTask,
} from "@/lib/supabase/data-api";
import {
  portalServiceRequestFromRow,
  portalServiceRequestToRow,
  type PortalServiceRequestRow,
} from "@/lib/supabase/mappers";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  // eslint-disable-next-line no-var
  var __portalServiceRequests: PortalServiceRequestRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __portalServiceRequestTasks: TaskRecord[] | undefined;
}

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function localRequests(): PortalServiceRequestRecord[] {
  if (!globalThis.__portalServiceRequests) globalThis.__portalServiceRequests = [];
  return globalThis.__portalServiceRequests;
}

function localTasks(): TaskRecord[] {
  if (!globalThis.__portalServiceRequestTasks) globalThis.__portalServiceRequestTasks = [];
  return globalThis.__portalServiceRequestTasks;
}

function newRequestId(): string {
  return `psr-${Date.now()}`;
}

function formatDueDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function buildTaskDescription(request: PortalServiceRequestRecord, clientLabel: string): string {
  return [
    `Participant service request from ${clientLabel}.`,
    "",
    `Service: ${request.serviceCategory}`,
    `Support budget: ${request.supportBudget}`,
    `Preferred schedule: ${request.preferredSchedule || "Not specified"}`,
    "",
    request.description.trim(),
    "",
    `Request ID: ${request.id}`,
  ].join("\n");
}

async function loadAgreementsForClient(clientId: string): Promise<ServiceAgreementRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: rows } = await supabase.from("service_agreement").select("*").eq("client_id", clientId);
    if (!rows?.length) return initialServiceAgreements.filter((a) => a.clientId === clientId);
    const { data: lineRows } = await supabase
      .from("service_agreement_line")
      .select("*")
      .in(
        "service_agreement_id",
        rows.map((r) => r.id)
      );
    const linesByAgreement = new Map<string, ServiceAgreementRecord["lines"]>();
    for (const line of lineRows ?? []) {
      const list = linesByAgreement.get(line.service_agreement_id) ?? [];
      list.push({
        id: line.id,
        lineNo: line.line_no,
        productId: line.product_id ?? "",
        name: line.name ?? "",
        description: line.description ?? "",
        plannedPrice: String(line.planned_price ?? ""),
        registrationGroup: line.registration_group ?? "",
        fundingType: line.funding_type ?? "",
        fundingBody: line.funding_body ?? "",
        fundingManagementType: line.funding_management_type ?? "",
        budgetRules: line.budget_rules ?? "",
      });
      linesByAgreement.set(line.service_agreement_id, list);
    }
    return rows.map((row) =>
      normalizeServiceAgreement({
        id: row.id,
        searchKey: row.search_key ?? row.id,
        name: row.name ?? "",
        description: row.description ?? "",
        clientId: row.client_id ?? "",
        priceListId: row.price_list_id ?? "",
        term: row.term ?? "",
        status: row.status ?? "Draft",
        executionDate: row.execution_date?.slice(0, 10) ?? "",
        contractDate: row.contract_date?.slice(0, 10) ?? "",
        finishDate: row.finish_date?.slice(0, 10) ?? "",
        reviewDate: row.review_date?.slice(0, 10) ?? "",
        totalPlannedAmount: String(row.total_planned_amount ?? ""),
        sentAt: row.sent_at ?? "",
        signedAt: row.signed_at ?? "",
        activatedAt: row.activated_at ?? "",
        signerName: row.signer_name ?? "",
        signerRole: row.signer_role ?? "",
        signatureImage: row.signature_image ?? "",
        signatureCapturedAt: row.signature_captured_at ?? "",
        lines: linesByAgreement.get(row.id) ?? [],
        createdBy: row.created_by ?? "",
        updatedBy: row.updated_by ?? "",
      })
    );
  }
  return initialServiceAgreements.filter((a) => a.clientId === clientId);
}

async function persistRequest(record: PortalServiceRequestRecord): Promise<PortalServiceRequestRecord> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { error } = await supabase.from("portal_service_request").upsert(portalServiceRequestToRow(record));
    if (error) throw error;
    return record;
  }
  const list = localRequests();
  const index = list.findIndex((r) => r.id === record.id);
  if (index >= 0) list[index] = record;
  else list.unshift(record);
  return record;
}

async function loadRequestById(id: string): Promise<PortalServiceRequestRecord | null> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase.from("portal_service_request").select("*").eq("id", id).maybeSingle();
    if (!data) return localRequests().find((r) => r.id === id) ?? null;
    return portalServiceRequestFromRow(data as PortalServiceRequestRow);
  }
  return localRequests().find((r) => r.id === id) ?? null;
}

export async function loadPortalServiceRequests(clientId: string): Promise<PortalServiceRequestRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("portal_service_request")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((row) => portalServiceRequestFromRow(row as PortalServiceRequestRow));
  }
  return localRequests()
    .filter((r) => r.clientId === clientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const OPEN_REQUEST_STATUSES: PortalServiceRequestStatus[] = ["Submitted", "Under review"];

async function transitionPortalServiceRequest(
  requestId: string,
  nextStatus: PortalServiceRequestStatus,
  patch: Partial<PortalServiceRequestRecord>,
  allowedFrom: PortalServiceRequestStatus[] = OPEN_REQUEST_STATUSES
): Promise<PortalServiceRequestRecord> {
  const current = await loadRequestById(requestId);
  if (!current) throw new Error("Service request not found.");
  if (!allowedFrom.includes(current.status)) {
    throw new Error("This request was already processed.");
  }

  const updated: PortalServiceRequestRecord = {
    ...current,
    ...patch,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const row = portalServiceRequestToRow(updated);
    const { data, error } = await supabase
      .from("portal_service_request")
      .update({
        status: row.status,
        variation_agreement_id: row.variation_agreement_id,
        decline_reason: row.decline_reason,
        task_id: row.task_id,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      })
      .eq("id", requestId)
      .in("status", allowedFrom)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("This request was already processed.");
    return portalServiceRequestFromRow(data as PortalServiceRequestRow);
  }

  const list = localRequests();
  const index = list.findIndex((r) => r.id === requestId);
  if (index < 0 || !allowedFrom.includes(list[index]!.status)) {
    throw new Error("This request was already processed.");
  }
  list[index] = updated;
  return updated;
}

export async function submitPortalServiceRequest(
  session: PortalSession,
  payload: PortalServiceRequestSubmit
): Promise<PortalServiceRequestRecord> {
  const serviceCategory = payload.serviceCategory.trim();
  const description = payload.description.trim();
  if (!serviceCategory) throw new Error("Choose a service type.");
  if (!description) throw new Error("Describe the support you are looking for.");

  const client = await loadPortalClientSummary(session.clientId);
  if (!client) throw new Error("Participant record not found.");

  const now = new Date().toISOString();
  const requestId = newRequestId();
  let record: PortalServiceRequestRecord = {
    id: requestId,
    clientId: session.clientId,
    status: "Submitted",
    serviceCategory,
    supportBudget: payload.supportBudget.trim() || "Core",
    description,
    preferredSchedule: payload.preferredSchedule.trim(),
    taskId: "",
    variationAgreementId: "",
    submittedByEmail: session.email,
    declineReason: "",
    createdAt: now,
    updatedAt: now,
    createdBy: session.displayName,
    updatedBy: session.displayName,
  };

  const clientLabel = `${client.name}${client.preferredName ? ` (${client.preferredName})` : ""}`;

  await persistRequest(record);

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const existingTasks = await fetchTasks(supabase);
    const base = createTask(
      {
        title: "Review portal service request",
        description: buildTaskDescription(record, clientLabel),
        status: "Open",
        taskTypeId: "tt-review",
        priority: "Normal",
        dueDate: formatDueDate(5),
        assignmentType: "role",
        assigneeUserId: "",
        assigneeRoleId: "role-coordinator",
        entityType: "client",
        entityId: session.clientId,
        entityLabel: clientLabel,
        createdByUserId: "",
        createdBy: "Participant portal",
        updatedBy: "Participant portal",
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
        automationDedupeKey: portalServiceRequestDedupeKey(requestId),
        updates: [],
      },
      existingTasks
    );
    const task = logTaskUpdate(base, {
      byUserId: "",
      byName: "Participant portal",
      action: "created",
      summary: "Created from participant portal service request",
      detail: `Assigned to Support Coordinator. Request ${requestId}.`,
    });
    await saveTask(supabase, task);
    record = {
      ...record,
      status: "Under review",
      taskId: task.id,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const existingTasks = localTasks();
    const base = createTask(
      {
        title: "Review portal service request",
        description: buildTaskDescription(record, clientLabel),
        status: "Open",
        taskTypeId: "tt-review",
        priority: "Normal",
        dueDate: formatDueDate(5),
        assignmentType: "role",
        assigneeUserId: "",
        assigneeRoleId: "role-coordinator",
        entityType: "client",
        entityId: session.clientId,
        entityLabel: clientLabel,
        createdByUserId: "",
        createdBy: "Participant portal",
        updatedBy: "Participant portal",
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
        automationDedupeKey: portalServiceRequestDedupeKey(requestId),
        updates: [],
      },
      existingTasks
    );
    const task = logTaskUpdate(base, {
      byUserId: "",
      byName: "Participant portal",
      action: "created",
      summary: "Created from participant portal service request",
      detail: `Assigned to Support Coordinator. Request ${requestId}.`,
    });
    localTasks().push(task);
    record = {
      ...record,
      status: "Under review",
      taskId: task.id,
      updatedAt: new Date().toISOString(),
    };
  }

  return persistRequest(record);
}

export async function createAgreementVariationStub(
  request: PortalServiceRequestRecord,
  staffName: string
): Promise<ServiceAgreementRecord> {
  const agreements = await loadAgreementsForClient(request.clientId);
  const parent =
    agreements.find((a) => a.status === "Active") ??
    agreements.find((a) => a.status === "Signed") ??
    agreements[0];
  if (!parent) throw new Error("No service agreement found for this participant.");

  const variation = createServiceAgreement(
    {
      id: `sa-var-${request.id}`,
      searchKey: `VAR-${request.id.replace(/^psr-/, "").slice(-6)}`,
      name: `Variation — ${request.serviceCategory}`,
      description: [
        "Draft agreement variation from participant portal service request.",
        "",
        request.description,
        request.preferredSchedule ? `Preferred schedule: ${request.preferredSchedule}` : "",
        "",
        `Source request: ${request.id}`,
        `Parent agreement: ${parent.searchKey}`,
      ]
        .filter(Boolean)
        .join("\n"),
      clientId: request.clientId,
      priceListId: parent.priceListId,
      term: parent.term,
      status: "Draft",
      executionDate: "",
      contractDate: "",
      finishDate: parent.finishDate,
      reviewDate: parent.reviewDate,
      totalPlannedAmount: "0",
      sentAt: "",
      signedAt: "",
      activatedAt: "",
      signerName: "",
      signerRole: "",
      signatureImage: "",
      signatureCapturedAt: "",
      lines: [],
      createdBy: staffName,
      updatedBy: staffName,
    },
    agreements
  );

  if (isSupabaseConfigured()) {
    await saveServiceAgreement(serviceClient(), variation);
  }

  return variation;
}

async function updateLinkedTask(
  taskId: string,
  mutator: (task: TaskRecord) => TaskRecord,
  staffName: string
): Promise<void> {
  if (!taskId) return;

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const tasks = await fetchTasks(supabase);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = mutator(task);
    next.updatedBy = staffName;
    await saveTask(supabase, next);
    return;
  }

  const tasks = localTasks();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index < 0) return;
  tasks[index] = { ...mutator(tasks[index]!), updatedBy: staffName };
}

export async function approvePortalServiceRequest(
  requestId: string,
  staff: { userId: string; displayName: string }
): Promise<{ request: PortalServiceRequestRecord; variation: ServiceAgreementRecord }> {
  const request = await loadRequestById(requestId);
  if (!request) throw new Error("Service request not found.");
  if (!OPEN_REQUEST_STATUSES.includes(request.status)) {
    throw new Error("This request was already processed.");
  }

  const variation = await createAgreementVariationStub(request, staff.displayName);
  const now = new Date().toISOString();
  const updated = await transitionPortalServiceRequest(requestId, "Approved", {
    variationAgreementId: variation.id,
    updatedBy: staff.displayName,
  });

  await updateLinkedTask(
    request.taskId,
    (task) =>
      logTaskUpdate(
        {
          ...task,
          status: "Completed",
          completedBy: staff.displayName,
          completedAt: now,
          resolutionNotes: `Approved — draft agreement variation ${variation.searchKey} created.`,
        },
        {
          byUserId: staff.userId,
          byName: staff.displayName,
          action: "closed",
          summary: "Portal service request approved",
          detail: `Draft variation ${variation.searchKey} created.`,
        }
      ),
    staff.displayName
  );

  return { request: updated, variation };
}

export async function declinePortalServiceRequest(
  requestId: string,
  staff: { userId: string; displayName: string },
  reason: string
): Promise<PortalServiceRequestRecord> {
  const request = await loadRequestById(requestId);
  if (!request) throw new Error("Service request not found.");
  if (!OPEN_REQUEST_STATUSES.includes(request.status)) {
    throw new Error("This request was already processed.");
  }

  const now = new Date().toISOString();
  const updated = await transitionPortalServiceRequest(requestId, "Declined", {
    declineReason: reason.trim(),
    updatedBy: staff.displayName,
  });

  await updateLinkedTask(
    request.taskId,
    (task) =>
      logTaskUpdate(
        {
          ...task,
          status: "Completed",
          completedBy: staff.displayName,
          completedAt: now,
          resolutionNotes: reason.trim() || "Declined.",
        },
        {
          byUserId: staff.userId,
          byName: staff.displayName,
          action: "closed",
          summary: "Portal service request declined",
          detail: reason.trim() || "No reason provided.",
        }
      ),
    staff.displayName
  );

  return updated;
}

export async function loadPortalServiceRequestForStaff(requestId: string): Promise<PortalServiceRequestRecord | null> {
  return loadRequestById(requestId);
}

export async function requirePortalSessionForApi(request: Request): Promise<PortalSession | null> {
  const { getPortalSessionFromRequest } = await import("@/lib/portal/session.server");
  return resolveValidPortalSession(await getPortalSessionFromRequest(request));
}
