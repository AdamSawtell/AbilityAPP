import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { ChatThreadState, TaskUpdateDraft } from "@/lib/ai/types";
import { aiCanAccessWindow } from "@/lib/ai/access";
import { persistAiTaskUpdate } from "@/lib/ai/persist";
import {
  assigneeLabel,
  loadAssigneeDirectory,
  resolveRoleId,
  resolveUserId,
} from "@/lib/ai/tools/assignee-resolve";
import { fetchTasks } from "@/lib/supabase/data-api";

async function resolveTask(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<{ id: string; title: string; documentNo: string } | null> {
  const taskId = String(args.taskId ?? "").trim();
  const documentNo = String(args.documentNo ?? "").trim();
  const title = String(args.title ?? "").trim();

  if (taskId) {
    const tasks = await fetchTasks(supabase);
    const task = tasks.find((t) => t.id === taskId);
    return task ? { id: task.id, title: task.title, documentNo: task.documentNo } : null;
  }

  const tasks = await fetchTasks(supabase);
  if (documentNo) {
    const task = tasks.find((t) => t.documentNo.toLowerCase() === documentNo.toLowerCase());
    return task ? { id: task.id, title: task.title, documentNo: task.documentNo } : null;
  }
  if (title) {
    const q = title.toLowerCase();
    const task = tasks.find((t) => t.title.toLowerCase().includes(q));
    return task ? { id: task.id, title: task.title, documentNo: task.documentNo } : null;
  }
  return null;
}

export async function runTaskUpdateDraftCreate(
  supabase: SupabaseClient | null,
  session: AuthSession,
  args: Record<string, unknown>,
  threadState: ChatThreadState
) {
  if (!aiCanAccessWindow(session, "tasks")) {
    return { threadState, message: "Your role cannot update tasks." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const task = await resolveTask(supabase, args);
  if (!task) {
    return { threadState, message: "Which task? Provide document number, title, or task id." };
  }

  const action = String(args.action ?? "").trim() as TaskUpdateDraft["action"];
  const validActions: TaskUpdateDraft["action"][] = ["complete", "reassign", "add_note", "change_status"];
  if (!validActions.includes(action)) {
    return {
      threadState,
      message: "What should happen? complete, reassign, add_note, or change_status.",
    };
  }

  const draft: TaskUpdateDraft = {
    taskId: task.id,
    taskTitle: task.title,
    documentNo: task.documentNo,
    action,
  };

  if (action === "change_status") {
    draft.status = String(args.status ?? "In progress").trim() as TaskUpdateDraft["status"];
  }
  if (action === "complete") {
    draft.resolutionNotes = String(args.resolutionNotes ?? args.note ?? "").trim();
  }
  if (action === "add_note") {
    draft.note = String(args.note ?? args.description ?? "").trim();
    if (!draft.note) return { threadState, message: "What note should be added?" };
  }
  if (action === "reassign") {
    draft.assignmentType = args.assignmentType === "role" ? "role" : "user";
    const { users, roles } = await loadAssigneeDirectory(supabase);
    if (draft.assignmentType === "user") {
      const hint = String(args.assigneeUserName ?? "").trim();
      draft.assigneeUserId = String(args.assigneeUserId ?? "").trim() || resolveUserId(users, hint);
      if (!draft.assigneeUserId) {
        return { threadState, message: "Who should the task be reassigned to?" };
      }
    } else {
      const hint = String(args.assigneeRoleName ?? "").trim();
      draft.assigneeRoleId = String(args.assigneeRoleId ?? "").trim() || resolveRoleId(roles, hint);
      if (!draft.assigneeRoleId) {
        return { threadState, message: "Which role should the task be assigned to?" };
      }
    }
  }

  const { users, roles } = await loadAssigneeDirectory(supabase);
  let summary = `${task.documentNo}: ${action}`;
  if (action === "reassign" && draft.assignmentType) {
    summary += ` → ${assigneeLabel(users, roles, draft.assignmentType, draft.assigneeUserId ?? "", draft.assigneeRoleId ?? "")}`;
  }

  return {
    threadState: { ...threadState, pendingTaskUpdate: draft },
    message: "Task update draft ready. Ask the user to confirm.",
    summary,
    draft,
  };
}

export async function runTaskUpdateDraftConfirm(
  supabase: SupabaseClient | null,
  session: AuthSession,
  threadState: ChatThreadState
) {
  const draft = threadState.pendingTaskUpdate;
  if (!draft) {
    return { threadState, message: "No pending task update. Use task_update_draft_create first." };
  }
  if (!supabase) return { threadState, message: "Database not configured." };

  const result = await persistAiTaskUpdate(supabase, session, draft);
  if (!result.ok) return { threadState, message: result.error };

  return {
    threadState: { ...threadState, pendingTaskUpdate: null },
    message: "Task updated in the database.",
    task: result.record,
    href: result.href,
  };
}
