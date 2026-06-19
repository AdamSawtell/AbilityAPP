import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, TaskDraft } from "@/lib/ai/types";
import { defaultReferenceData } from "@/lib/reference-data";
import { canCreateTaskType } from "@/lib/task-type-access";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { createAiDraft } from "@/lib/ai/draft-server";
import {
  assigneeLabel,
  loadAssigneeDirectory,
  resolveRoleId,
  resolveUserId,
} from "@/lib/ai/tools/assignee-resolve";

function parseDueDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

function normalizeDraft(raw: Record<string, unknown>): TaskDraft {
  return {
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    taskTypeId: String(raw.taskTypeId ?? "tt-other").trim(),
    priority: (defaultReferenceData.taskPriority.includes(String(raw.priority))
      ? raw.priority
      : "Normal") as TaskDraft["priority"],
    dueDate: parseDueDate(String(raw.dueDate ?? "")),
    assignmentType: raw.assignmentType === "role" ? "role" : "user",
    assigneeUserId: String(raw.assigneeUserId ?? "").trim(),
    assigneeRoleId: String(raw.assigneeRoleId ?? "").trim(),
    entityType: String(raw.entityType ?? "").trim(),
    entityId: String(raw.entityId ?? "").trim(),
    entityLabel: String(raw.entityLabel ?? "").trim(),
  };
}

export async function runTaskCreatePrepare(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "tasks")) {
    return { threadState, message: "Your role cannot create tasks." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const draft = normalizeDraft(args);
  const { users, roles } = await loadAssigneeDirectory(supabase);

  if (!draft.title) {
    return { threadState, message: "A task title is required before preparing." };
  }

  if (draft.assignmentType === "user") {
    const nameHint = String(args.assigneeUserName ?? "").trim();
    if (!draft.assigneeUserId && nameHint) draft.assigneeUserId = resolveUserId(users, nameHint);
    if (!draft.assigneeUserId) {
      return { threadState, message: "Who should this task be assigned to? Provide a user name." };
    }
  } else {
    const nameHint = String(args.assigneeRoleName ?? "").trim();
    if (!draft.assigneeRoleId && nameHint) draft.assigneeRoleId = resolveRoleId(roles, nameHint);
    if (!draft.assigneeRoleId) {
      return { threadState, message: "Which role should this task be assigned to?" };
    }
  }

  if (!canCreateTaskType(session, draft.taskTypeId)) {
    draft.taskTypeId = "tt-other";
  }

  const summary = `${draft.title} → ${assigneeLabel(users, roles, draft.assignmentType, draft.assigneeUserId, draft.assigneeRoleId)}`;
  const { id, href } = await createAiDraft(supabase, session, {
    entityType: "task",
    targetRoute: "/tasks/new",
    payload: { ...draft, prepareKind: "create" },
    summary,
  });

  return {
    threadState: { ...threadState, pendingTaskDraft: null },
    message: "Task prepared for review. Send the user the link — they must open the form and save.",
    summary,
    href,
    draftId: id,
  };
}
