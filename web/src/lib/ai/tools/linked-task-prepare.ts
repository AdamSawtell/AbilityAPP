import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState } from "@/lib/ai/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { createAiDraft } from "@/lib/ai/draft-server";
import {
  loadAssigneeDirectory,
  resolveRoleId,
  resolveUserId,
} from "@/lib/ai/tools/assignee-resolve";
import { runTaskCreatePrepare } from "@/lib/ai/tools/task-create-prepare";
import type { TaskEntityType } from "@/lib/task";

type EntityRef = { id: string; label: string; entityType: TaskEntityType };

async function resolveIncident(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<EntityRef | null> {
  const incidentId = String(args.incidentId ?? "").trim();
  const documentNo = String(args.documentNo ?? args.incidentDocumentNo ?? "").trim();
  const title = String(args.incidentTitle ?? "").trim();

  let query = supabase.from("incident").select("id, document_no, title");
  if (incidentId) query = query.eq("id", incidentId);
  else if (documentNo) query = query.eq("document_no", documentNo);
  else if (title) query = query.ilike("title", `%${title}%`);
  else return null;

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    label: `${data.document_no} — ${data.title}`,
    entityType: "incident",
  };
}

async function resolveEnquiry(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<EntityRef | null> {
  const enquiryId = String(args.enquiryId ?? "").trim();
  const documentNo = String(args.documentNo ?? "").trim();
  const name = String(args.enquiryName ?? args.name ?? "").trim();

  let query = supabase.from("enquiry").select("id, document_no, first_name, last_name");
  if (enquiryId) query = query.eq("id", enquiryId);
  else if (documentNo) query = query.eq("document_no", documentNo);
  else if (name) query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
  else return null;

  const { data } = await query.limit(1).maybeSingle();
  if (!data) return null;
  const person = `${data.first_name} ${data.last_name}`.trim();
  return {
    id: data.id,
    label: `${data.document_no} — ${person}`,
    entityType: "enquiry",
  };
}

export async function runLinkedTaskPrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState,
  resolveEntity: (db: SupabaseClient) => Promise<EntityRef | null>,
  entityLabel: string
) {
  if (!aiCanAccessWindow(session, "tasks")) {
    return { threadState, message: "Your role cannot create tasks." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const entity = await resolveEntity(supabase);
  if (!entity) {
    return { threadState, message: `Which ${entityLabel} should the task link to?` };
  }

  const title = String(args.taskTitle ?? args.title ?? "").trim();
  if (!title) {
    return { threadState, message: "What should the follow-up task be called?" };
  }

  return runTaskCreatePrepare(
    supabase,
    session,
    {
      ...args,
      title,
      entityType: entity.entityType,
      entityId: entity.id,
      entityLabel: entity.label,
    },
    threadState
  );
}

export async function runClientTaskPrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  const { resolveClient } = await import("@/lib/ai/tools/client-resolve");
  if (!supabase) return { threadState, message: "Database not configured." };
  if (!aiCanAccessWindow(session, "clients")) {
    return { threadState, message: "Your role cannot access clients." };
  }

  const client = await resolveClient(supabase, args);
  if (!client) {
    return { threadState, message: "Which client should the task link to?" };
  }

  const title = String(args.taskTitle ?? args.title ?? "").trim();
  if (!title) {
    return { threadState, message: "What should the follow-up task be called?" };
  }

  return runTaskCreatePrepare(
    supabase,
    session,
    {
      ...args,
      title,
      entityType: "client",
      entityId: client.id,
      entityLabel: client.name,
    },
    threadState
  );
}

export async function runIncidentTaskPrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "incidents")) {
    return { threadState, message: "Your role cannot access incidents." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };
  return runLinkedTaskPrepare(supabase, session, args, threadState, (db) => resolveIncident(db, args), "incident");
}

export async function runEnquiryTaskPrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "enquiries")) {
    return { threadState, message: "Your role cannot access enquiries." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };
  return runLinkedTaskPrepare(supabase, session, args, threadState, (db) => resolveEnquiry(db, args), "enquiry");
}

export async function runTaskUpdatePrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "tasks")) {
    return { threadState, message: "Your role cannot update tasks." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const taskId = String(args.taskId ?? "").trim();
  const documentNo = String(args.documentNo ?? "").trim();
  const title = String(args.title ?? "").trim();

  let query = supabase.from("app_task").select("id, document_no, title, status");
  if (taskId) query = query.eq("id", taskId);
  else if (documentNo) query = query.eq("document_no", documentNo);
  else if (title) query = query.ilike("title", `%${title}%`);
  else return { threadState, message: "Which task? Provide document number, title, or task id." };

  const { data: task } = await query.limit(1).maybeSingle();
  if (!task) return { threadState, message: "Task not found." };

  const action = String(args.action ?? "add_note").trim();
  const validActions = ["complete", "reassign", "add_note", "change_status"];
  if (!validActions.includes(action)) {
    return { threadState, message: "Action must be complete, reassign, add_note, or change_status." };
  }

  const payload: Record<string, unknown> = {
    prepareKind: "update",
    taskId: task.id,
    documentNo: task.document_no,
    taskTitle: task.title,
    action,
    note: String(args.note ?? args.resolutionNotes ?? "").trim(),
    status: String(args.status ?? "").trim(),
    assignmentType: args.assignmentType,
    assigneeUserId: args.assigneeUserId,
    assigneeRoleId: args.assigneeRoleId,
    assigneeUserName: args.assigneeUserName,
    assigneeRoleName: args.assigneeRoleName,
  };

  if (action === "reassign") {
    const { users, roles } = await loadAssigneeDirectory(supabase);
    if (payload.assignmentType !== "role") payload.assignmentType = "user";
    if (!payload.assigneeUserId && payload.assigneeUserName) {
      payload.assigneeUserId = resolveUserId(users, String(payload.assigneeUserName));
    }
    if (!payload.assigneeRoleId && payload.assigneeRoleName) {
      payload.assigneeRoleId = resolveRoleId(roles, String(payload.assigneeRoleName));
    }
  }

  const summary = `${task.document_no}: ${action}`;
  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "task_update",
    targetRoute: `/tasks/${task.id}`,
    payload,
    summary,
  });

  return {
    threadState: { ...threadState, pendingTaskUpdate: null },
    message: "Task update prepared for review. Send the user the link — they must apply the change on the task.",
    summary,
    href,
    draftId: id,
  };
}
