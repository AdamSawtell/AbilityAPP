"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskActivityTimeline } from "@/components/task-activity-timeline";
import { TaskForm, type TaskFormValues } from "@/components/task-form";
import { TaskHubView } from "@/components/task-hub-view";
import { TaskUpdatePanel, type TaskUpdatePayload } from "@/components/task-update-panel";
import { PortalServiceRequestPanel } from "@/components/portal/portal-service-request-panel";
import { useAuth } from "@/lib/auth-store";
import { displayName } from "@/lib/access/types";
import { useData } from "@/lib/data-store";
import { auditMetaFromTask, taskUpdatesToAuditEvents } from "@/lib/audit";
import { taskAssignedToRole, taskAssignedToUser, type TaskListView } from "@/lib/task-access";
import { useTaskTypes } from "@/lib/task-type-store";
import { useAiDraftLoader } from "@/lib/ai/use-ai-draft";
import { draftHighlightKeys } from "@/lib/ai/draft-field-highlight";
import { trackAiPrepareSaved } from "@/lib/ai/prepare-audit.client";
import { trackProcessExecution } from "@/lib/process-audit/track.client";
import { canSeeTaskType } from "@/lib/task-type-access";
import {
  isActiveTask,
  logTaskUpdate,
  taskRelatedLinks,
  type TaskRecord,
  type TaskStatus,
} from "@/lib/task";
import { taskUrgency } from "@/lib/task-hub";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function statusPill(status: TaskRecord["status"]) {
  const styles =
    status === "Open"
      ? "bg-sky-50 text-sky-800 ring-sky-200"
      : status === "In progress"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : status === "Completed"
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>{status}</span>
  );
}

function dueDateLabel(task: TaskRecord): string {
  if (!task.dueDate) return "Not set";
  const urgency = taskUrgency(task);
  if (urgency === "overdue") return `${task.dueDate} (overdue)`;
  if (urgency === "today") return `${task.dueDate} (due today)`;
  return task.dueDate;
}

function dueDateStyles(task: TaskRecord): string {
  const urgency = taskUrgency(task);
  if (urgency === "overdue") return "text-red-700";
  if (urgency === "today") return "text-amber-800";
  if (urgency === "soon") return "text-orange-800";
  return "text-slate-800";
}

function canManageTask(
  task: TaskRecord,
  session: { userId: string; activeRoleId: string },
  canProcess: (id: string) => boolean
) {
  if (canProcess("assign-task")) return true;
  if (!canProcess("action-task")) return false;
  return (
    task.createdByUserId === session.userId ||
    taskAssignedToUser(task, session.userId) ||
    taskAssignedToRole(task, session.activeRoleId)
  );
}

export function TaskListView({ view }: { view: TaskListView }) {
  return <TaskHubView initialScope={view} />;
}

export function TaskCreateView() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading…</p>}>
      <TaskCreateViewInner />
    </Suspense>
  );
}

function TaskCreateViewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiDraftId = searchParams.get("aiDraft");
  const draftLoad = useAiDraftLoader(aiDraftId);
  const { addTask } = useData();
  const { session, canProcess, users, roles } = useAuth();

  const initialValues = useMemo((): Partial<TaskFormValues> | undefined => {
    const p = draftLoad.payload;
    if (!p) return undefined;
    return {
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      taskTypeId: String(p.taskTypeId ?? "tt-other"),
      priority: (String(p.priority ?? "Normal") as TaskFormValues["priority"]),
      dueDate: String(p.dueDate ?? ""),
      assignmentType: p.assignmentType === "role" ? "role" : "user",
      assigneeUserId: String(p.assigneeUserId ?? ""),
      assigneeRoleId: String(p.assigneeRoleId ?? ""),
      entityType: (String(p.entityType ?? "") as TaskFormValues["entityType"]),
      entityId: String(p.entityId ?? ""),
      entityLabel: String(p.entityLabel ?? ""),
    };
  }, [draftLoad.payload]);

  const highlightFields = useMemo(
    () => (draftLoad.payload ? draftHighlightKeys(draftLoad.payload, "task") : undefined),
    [draftLoad.payload]
  );

  if (!session) return null;
  const userSession = session;

  if (!canProcess("assign-task")) {
    return (
      <AppShell title="New task">
        <p className="text-sm text-slate-600">You do not have permission to create tasks.</p>
      </AppShell>
    );
  }

  function handleCreate(values: TaskFormValues) {
    const assigneeDisplayName =
      values.assignmentType === "user"
        ? displayName(users.find((u) => u.id === values.assigneeUserId) ?? { firstName: "", lastName: "", username: values.assigneeUserId })
        : roles.find((r) => r.id === values.assigneeRoleId)?.name ?? values.assigneeRoleId;

    const task = addTask(
      {
        title: values.title,
        description: values.description,
        status: "Open",
        taskTypeId: values.taskTypeId,
        priority: values.priority,
        dueDate: values.dueDate,
        assignmentType: values.assignmentType,
        assigneeUserId: values.assigneeUserId,
        assigneeRoleId: values.assigneeRoleId,
        entityType: values.entityType,
        entityId: values.entityId,
        entityLabel: values.entityLabel,
        createdByUserId: userSession.userId,
        createdBy: userSession.displayName,
        updatedBy: userSession.displayName,
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
      },
      { assigneeDisplayName }
    );
    trackAiPrepareSaved({
      userId: userSession.userId,
      roleId: userSession.activeRoleId,
      draftId: aiDraftId ?? undefined,
      entityType: "task",
      entityId: task.id,
      entityLabel: `${task.documentNo} — ${task.title}`,
      chatMessage: aiDraftId
        ? `Created task ${task.documentNo}. You can continue in chat.`
        : undefined,
    });
    router.push(`/tasks/${task.id}`);
  }

  if (draftLoad.error) {
    return (
      <AppShell title="New task" audit={{ moduleLabel: "Tasks" }}>
        <p className="text-sm text-red-700">{draftLoad.error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="New task"
      subtitle={aiDraftId ? "Review the task your assistant prepared, then create it." : "Assign work to any user or role, optionally linked to a record."}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tasks", href: "/tasks" },
        { label: "New task" },
      ]}
      audit={{ moduleLabel: "Tasks" }}
    >
      {aiDraftId ? (
        <p className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Prepared by your AI assistant. Check every field, then create the task.
        </p>
      ) : null}
      {draftLoad.loading ? <p className="mb-4 text-sm text-slate-500">Loading draft…</p> : null}
      <TaskForm
        initialValues={initialValues}
        highlightFields={highlightFields}
        onSubmit={handleCreate}
        onCancel={() => router.push("/tasks")}
      />
    </AppShell>
  );
}

export function TaskDetailView({ id }: { id: string }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading…</p>}>
      <TaskDetailViewInner id={id} />
    </Suspense>
  );
}

function TaskDetailViewInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const aiDraftId = searchParams.get("aiDraft");
  const draftLoad = useAiDraftLoader(aiDraftId);
  const { getTaskById, mutateTask } = useData();
  const { session, canProcess, users, roles } = useAuth();
  const { getTaskTypeName } = useTaskTypes();
  const task = getTaskById(id);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [draftApplied, setDraftApplied] = useState(false);

  useEffect(() => {
    const p = draftLoad.payload;
    if (!p || draftApplied || p.prepareKind !== "update") return;
    const action = String(p.action ?? "");
    const note = String(p.note ?? p.resolutionNotes ?? "").trim();
    if (note) setResolutionNotes(note);
    if (action === "complete") setCompleteOpen(true);
    else if (action === "add_note" || action === "reassign" || action === "change_status") setUpdateOpen(true);
    setDraftApplied(true);
  }, [draftLoad.payload, draftApplied]);

  if (!task || !session || !canSeeTaskType(session, task.taskTypeId)) {
    return (
      <AppShell title="Task not found">
        <Link href="/tasks" className="text-[#b51266] hover:underline">
          Back to tasks
        </Link>
      </AppShell>
    );
  }

  const currentSession = session;
  const currentTask = task;
  const canManage = canManageTask(currentTask, currentSession, canProcess);
  const canReassign = canProcess("assign-task");
  const assigneeLabel =
    currentTask.assignmentType === "user"
      ? displayName(users.find((u) => u.id === currentTask.assigneeUserId) ?? { firstName: "", lastName: "", username: currentTask.assigneeUserId })
      : roles.find((r) => r.id === currentTask.assigneeRoleId)?.name ?? currentTask.assigneeRoleId;

  function apply(mutator: (t: TaskRecord) => TaskRecord) {
    mutateTask(currentTask.id, mutator);
  }

  function changeStatus(status: TaskStatus) {
    if (currentTask.status === status) return;
    apply((t) =>
      logTaskUpdate(
        { ...t, status },
        {
          byUserId: currentSession.userId,
          byName: currentSession.displayName,
          action: "status_changed",
          summary: `Status changed to ${status}`,
          detail: "",
        }
      )
    );
    trackProcessExecution({
      processId: "action-task",
      entityType: "task",
      entityId: currentTask.id,
      entityLabel: currentTask.documentNo,
      detail: `Status → ${status}`,
    });
  }

  function saveDueDate(nextDueDate: string) {
    const previous = currentTask.dueDate;
    if (previous === nextDueDate) return;
    apply((t) =>
      logTaskUpdate(
        { ...t, dueDate: nextDueDate },
        {
          byUserId: currentSession.userId,
          byName: currentSession.displayName,
          action: "updated",
          summary: nextDueDate ? `Due date set to ${nextDueDate}` : "Due date cleared",
          detail: previous ? `Previously ${previous}.` : "",
        }
      )
    );
  }

  function submitUpdate(payload: TaskUpdatePayload) {
    apply((t) => {
      let next = t;
      if (payload.reassign) {
        const { assignmentType, assigneeUserId, assigneeRoleId } = payload.reassign;
        const newName =
          assignmentType === "user"
            ? displayName(users.find((u) => u.id === assigneeUserId) ?? { firstName: "", lastName: "", username: assigneeUserId })
            : roles.find((r) => r.id === assigneeRoleId)?.name ?? assigneeRoleId;

        next = logTaskUpdate(
          {
            ...next,
            assignmentType,
            assigneeUserId: assignmentType === "user" ? assigneeUserId : "",
            assigneeRoleId: assignmentType === "role" ? assigneeRoleId : "",
          },
          {
            byUserId: currentSession.userId,
            byName: currentSession.displayName,
            action: "reassigned",
            summary: `Reassigned to ${assignmentType} ${newName}`,
            detail: payload.note.trim() || `Previously ${assigneeLabel}.`,
          }
        );
      } else if (payload.note.trim()) {
        next = logTaskUpdate(next, {
          byUserId: currentSession.userId,
          byName: currentSession.displayName,
          action: "note_added",
          summary: "Update added",
          detail: payload.note.trim(),
        });
      }
      return next;
    });
    setUpdateOpen(false);
  }

  function closeTask(outcome: "Completed" | "Cancelled") {
    apply((t) =>
      logTaskUpdate(
        {
          ...t,
          status: outcome,
          completedBy: currentSession.displayName,
          completedAt: new Date().toISOString().slice(0, 10),
          resolutionNotes: resolutionNotes.trim() || t.resolutionNotes,
        },
        {
          byUserId: currentSession.userId,
          byName: currentSession.displayName,
          action: "closed",
          summary: outcome === "Completed" ? "Task completed" : "Task cancelled",
          detail: resolutionNotes.trim() || t.resolutionNotes || "",
        }
      )
    );
    setResolutionNotes("");
    setCompleteOpen(false);
    setCancelOpen(false);
  }

  const liveTask = getTaskById(id) ?? task;
  const active = isActiveTask(liveTask);

  return (
    <AppShell
      title={liveTask.title}
      subtitle={`${liveTask.documentNo} · ${getTaskTypeName(liveTask.taskTypeId)}`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tasks", href: "/tasks" },
        { label: liveTask.documentNo },
      ]}
      audit={{
        entityType: "task",
        entityId: liveTask.id,
        meta: auditMetaFromTask(liveTask),
        extraEvents: taskUpdatesToAuditEvents(liveTask.updates),
      }}
    >
      {aiDraftId && draftLoad.payload ? (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Your assistant prepared a task update. Review the suggested change below, then save on this record.
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {statusPill(liveTask.status)}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {liveTask.priority} priority
              </span>
              {liveTask.dueDate ? (
                <span className={`text-xs font-medium ${dueDateStyles(liveTask)}`}>Due {dueDateLabel(liveTask)}</span>
              ) : (
                <span className="text-xs text-slate-400">No due date</span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{liveTask.description || "No description."}</p>
            {liveTask.resolutionNotes && !active ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Resolution:</span> {liveTask.resolutionNotes}
              </p>
            ) : null}
          </section>

          <PortalServiceRequestPanel task={liveTask} canManage={canManage && active} />

          {canManage && active ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {!updateOpen ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUpdateOpen(true)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompleteOpen(true)}
                    className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                  >
                    Task completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Cancel task
                  </button>
                </div>
              ) : (
                <TaskUpdatePanel
                  task={liveTask}
                  users={users}
                  roles={roles}
                  canReassign={canReassign}
                  assigneeLabel={assigneeLabel}
                  initialNote={resolutionNotes}
                  onSubmit={(payload) => {
                    submitUpdate(payload);
                    if (aiDraftId && session) {
                      void trackAiPrepareSaved({
                        userId: session.userId,
                        roleId: session.activeRoleId,
                        draftId: aiDraftId,
                        entityType: "task",
                        entityId: liveTask.id,
                        entityLabel: liveTask.documentNo,
                        chatMessage: "Task update saved. You can continue in chat.",
                      });
                    }
                  }}
                  onCancel={() => setUpdateOpen(false)}
                />
              )}
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Activity</h2>
            <TaskActivityTimeline updates={liveTask.updates} />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Assigned to</dt>
                <dd className="mt-0.5 text-slate-800">
                  {liveTask.assignmentType === "user" ? "User" : "Role"}: {assigneeLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</dt>
                <dd className="mt-1">
                  {canManage ? (
                    <div className="space-y-1">
                      <input
                        type="date"
                        className={inputClass}
                        value={liveTask.dueDate}
                        onChange={(e) => saveDueDate(e.target.value)}
                      />
                      <p className="text-xs text-slate-500">Set or change anytime.</p>
                    </div>
                  ) : (
                    <span className={dueDateStyles(liveTask)}>{dueDateLabel(liveTask)}</span>
                  )}
                </dd>
              </div>
              {canManage && active ? (
                <div>
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                  <dd className="flex flex-wrap gap-2">
                    {liveTask.status === "Open" ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200 ring-inset">
                        Open
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeStatus("Open")}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Mark open
                      </button>
                    )}
                    {liveTask.status === "In progress" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ring-inset">
                        In progress
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeStatus("In progress")}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        In progress
                      </button>
                    )}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                  <dd className="mt-0.5">{statusPill(liveTask.status)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Task type</dt>
                <dd className="mt-0.5 text-slate-800">{getTaskTypeName(liveTask.taskTypeId)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Created by</dt>
                <dd className="mt-0.5 text-slate-800">{liveTask.createdBy}</dd>
              </div>
            </dl>
          </section>

          {(() => {
            const links = taskRelatedLinks(liveTask);
            if (!links.length) return null;
            return (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Related record</h2>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm font-medium text-[#b51266] hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}
        </aside>
      </div>

      <ConfirmDialog
        open={completeOpen}
        title="Task completed"
        description="Confirm this task is finished. You can add optional notes below."
        confirmLabel="Task completed"
        confirmTone="success"
        onCancel={() => {
          setCompleteOpen(false);
          setResolutionNotes("");
        }}
        onConfirm={() => closeTask("Completed")}
      >
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Resolution notes (optional)"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel task"
        description="This task will be marked cancelled. Add a note if helpful."
        confirmLabel="Cancel task"
        confirmTone="danger"
        onCancel={() => {
          setCancelOpen(false);
          setResolutionNotes("");
        }}
        onConfirm={() => closeTask("Cancelled")}
      >
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Reason (optional)"
        />
      </ConfirmDialog>
    </AppShell>
  );
}
