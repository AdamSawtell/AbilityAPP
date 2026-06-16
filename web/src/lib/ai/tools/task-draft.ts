import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, TaskDraft } from "@/lib/ai/types";
import { canCreateTaskType } from "@/lib/task-type-access";
import {
  assigneeLabel,
  loadAssigneeDirectory,
  resolveRoleId,
  resolveUserId,
} from "@/lib/ai/tools/assignee-resolve";

function normalizeDraft(raw: Record<string, unknown>): TaskDraft {
  return {
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    taskTypeId: String(raw.taskTypeId ?? "tt-other").trim(),
    priority: (["Low", "Normal", "High"].includes(String(raw.priority)) ? raw.priority : "Normal") as TaskDraft["priority"],
    dueDate: String(raw.dueDate ?? "").trim(),
    assignmentType: raw.assignmentType === "role" ? "role" : "user",
    assigneeUserId: String(raw.assigneeUserId ?? "").trim(),
    assigneeRoleId: String(raw.assigneeRoleId ?? "").trim(),
    entityType: String(raw.entityType ?? "").trim(),
    entityId: String(raw.entityId ?? "").trim(),
    entityLabel: String(raw.entityLabel ?? "").trim(),
  };
}

export async function runTaskDraftCreate(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
): Promise<{ draft: TaskDraft; threadState: ChatThreadState; message: string; summary?: string }> {
  const draft = normalizeDraft(args);
  const { users, roles } = await loadAssigneeDirectory(supabase);

  if (draft.assignmentType === "user") {
    const nameHint = String(args.assigneeUserName ?? "").trim();
    if (!draft.assigneeUserId && nameHint) {
      draft.assigneeUserId = resolveUserId(users, nameHint);
    }
    if (!draft.assigneeUserId && nameHint) {
      return {
        draft,
        threadState,
        message: `Could not find a user matching "${nameHint}". Ask for their username or full name.`,
      };
    }
    if (!draft.assigneeUserId) {
      return { draft, threadState, message: "Who should this task be assigned to? Provide a user name." };
    }
  } else {
    const nameHint = String(args.assigneeRoleName ?? "").trim();
    if (!draft.assigneeRoleId && nameHint) {
      draft.assigneeRoleId = resolveRoleId(roles, nameHint);
    }
    if (!draft.assigneeRoleId && nameHint) {
      return {
        draft,
        threadState,
        message: `Could not find a role matching "${nameHint}". Ask for the role name.`,
      };
    }
    if (!draft.assigneeRoleId) {
      return { draft, threadState, message: "Which role should this task be assigned to?" };
    }
  }

  if (!draft.title) {
    return { draft, threadState, message: "What should the task be called?" };
  }
  if (!canCreateTaskType(session, draft.taskTypeId)) {
    draft.taskTypeId = "tt-other";
  }

  const assignee = assigneeLabel(
    users,
    roles,
    draft.assignmentType,
    draft.assigneeUserId,
    draft.assigneeRoleId
  );
  const nextState: ChatThreadState = { ...threadState, pendingTaskDraft: draft };
  return {
    draft,
    threadState: nextState,
    message: "Task draft ready. Ask the user to confirm before creating.",
    summary: `"${draft.title}" → ${draft.assignmentType === "user" ? "user" : "role"} ${assignee}`,
  };
}

export function runTaskDraftConfirm(
  session: AuthSession,
  threadState: ChatThreadState
): { task: TaskDraft | null; threadState: ChatThreadState; message: string } {
  const draft = threadState.pendingTaskDraft;
  if (!draft) {
    return { task: null, threadState, message: "No pending task draft. Use task_draft_create first." };
  }
  if (!canCreateTaskType(session, draft.taskTypeId)) {
    return { task: null, threadState, message: "Your role cannot create this task type." };
  }
  return {
    task: draft,
    threadState: { ...threadState, pendingTaskDraft: null },
    message: "Task draft confirmed. Return this payload to the client for creation.",
  };
}
