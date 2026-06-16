import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, TaskDraft } from "@/lib/ai/types";
import { canCreateTaskType } from "@/lib/task-type-access";

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

export function runTaskDraftCreate(
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
): { draft: TaskDraft; threadState: ChatThreadState; message: string } {
  const draft = normalizeDraft(args);
  if (!draft.title) {
    return { draft, threadState, message: "Title is required for a task draft." };
  }
  if (!canCreateTaskType(session, draft.taskTypeId)) {
    return {
      draft,
      threadState,
      message: `Your role cannot create tasks of type ${draft.taskTypeId}. Choose another task type.`,
    };
  }
  if (draft.assignmentType === "user" && !draft.assigneeUserId) {
    return { draft, threadState, message: "Assignee user id is required when assignment type is user." };
  }
  if (draft.assignmentType === "role" && !draft.assigneeRoleId) {
    return { draft, threadState, message: "Assignee role id is required when assignment type is role." };
  }

  const nextState: ChatThreadState = { ...threadState, pendingTaskDraft: draft };
  return {
    draft,
    threadState: nextState,
    message: "Task draft prepared. Ask the user to confirm before creating.",
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
