"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TaskActivityTimeline } from "@/components/task-activity-timeline";
import { TaskForm, type TaskFormValues } from "@/components/task-form";
import { TaskHubView } from "@/components/task-hub-view";
import { useAuth } from "@/lib/auth-store";
import { displayName } from "@/lib/access/types";
import { useData } from "@/lib/data-store";
import { auditMetaFromTask, taskUpdatesToAuditEvents } from "@/lib/audit";
import { taskAssignedToRole, taskAssignedToUser, type TaskListView } from "@/lib/task-access";
import { useTaskTypes } from "@/lib/task-type-store";
import { canSeeTaskType } from "@/lib/task-type-access";
import {
  entityHref,
  isActiveTask,
  logTaskUpdate,
  taskEntityTypeLabels,
  taskStatusOptions,
  type TaskRecord,
  type TaskStatus,
} from "@/lib/task";

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
  const router = useRouter();
  const { addTask } = useData();
  const { session, canProcess, users, roles } = useAuth();

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
    router.push(`/tasks/${task.id}`);
  }

  return (
    <AppShell
      title="New task"
      subtitle="Assign work to any user or role, optionally linked to a record."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tasks", href: "/tasks" },
        { label: "New task" },
      ]}
      audit={{ moduleLabel: "New task" }}
    >
      <TaskForm onSubmit={handleCreate} onCancel={() => router.push("/tasks")} />
    </AppShell>
  );
}

export function TaskDetailView({ id }: { id: string }) {
  const { getTaskById, mutateTask } = useData();
  const { session, canProcess, users, roles } = useAuth();
  const { getTaskTypeName } = useTaskTypes();
  const task = getTaskById(id);

  const [noteText, setNoteText] = useState("");
  const [reassignType, setReassignType] = useState<"user" | "role">("user");
  const [reassignUserId, setReassignUserId] = useState("");
  const [reassignRoleId, setReassignRoleId] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

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
          summary: `Status changed from ${t.status} to ${status}`,
          detail: "",
        }
      )
    );
  }

  function addNote() {
    if (!noteText.trim()) return;
    apply((t) =>
      logTaskUpdate(t, {
        byUserId: currentSession.userId,
        byName: currentSession.displayName,
        action: "note_added",
        summary: "Note added",
        detail: noteText.trim(),
      })
    );
    setNoteText("");
  }

  function reassign() {
    if (reassignType === "user" && !reassignUserId) return;
    if (reassignType === "role" && !reassignRoleId) return;

    const newName =
      reassignType === "user"
        ? displayName(users.find((u) => u.id === reassignUserId) ?? { firstName: "", lastName: "", username: reassignUserId })
        : roles.find((r) => r.id === reassignRoleId)?.name ?? reassignRoleId;

    apply((t) =>
      logTaskUpdate(
        {
          ...t,
          assignmentType: reassignType,
          assigneeUserId: reassignType === "user" ? reassignUserId : "",
          assigneeRoleId: reassignType === "role" ? reassignRoleId : "",
          status: t.status === "Open" ? t.status : "Open",
        },
        {
          byUserId: currentSession.userId,
          byName: currentSession.displayName,
          action: "reassigned",
          summary: `Reassigned to ${reassignType} ${newName}`,
          detail: `Previously assigned to ${t.assignmentType === "user" ? "user" : "role"} ${assigneeLabel}.`,
        }
      )
    );
    setReassignUserId("");
    setReassignRoleId("");
  }

  function closeTask(outcome: "Completed" | "Cancelled") {
    apply((t) =>
      logTaskUpdate(
        {
          ...t,
          status: outcome,
          completedBy: currentSession.displayName,
          completedAt: new Date().toISOString().slice(0, 10),
          resolutionNotes: closeNotes.trim() || t.resolutionNotes,
        },
        {
          byUserId: currentSession.userId,
          byName: currentSession.displayName,
          action: "closed",
          summary: outcome === "Completed" ? "Task completed" : "Task cancelled",
          detail: closeNotes.trim() || t.resolutionNotes || "",
        }
      )
    );
    setCloseNotes("");
  }

  const liveTask = getTaskById(id) ?? task;

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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {statusPill(liveTask.status)}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {liveTask.priority} priority
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{liveTask.description || "No description."}</p>
            {liveTask.resolutionNotes && !isActiveTask(liveTask) ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Resolution:</span> {liveTask.resolutionNotes}
              </p>
            ) : null}
          </section>

          {canManage && isActiveTask(liveTask) ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Update task</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
                  <select
                    className={inputClass}
                    value={liveTask.status}
                    onChange={(e) => changeStatus(e.target.value as TaskStatus)}
                  >
                    {taskStatusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {canProcess("assign-task") ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Reassign</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className={inputClass}
                      value={reassignType}
                      onChange={(e) => setReassignType(e.target.value as "user" | "role")}
                    >
                      <option value="user">User</option>
                      <option value="role">Role</option>
                    </select>
                    {reassignType === "user" ? (
                      <select className={inputClass} value={reassignUserId} onChange={(e) => setReassignUserId(e.target.value)}>
                        <option value="">Select user…</option>
                        {users.filter((u) => u.active).map((u) => (
                          <option key={u.id} value={u.id}>
                            {displayName(u)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select className={inputClass} value={reassignRoleId} onChange={(e) => setReassignRoleId(e.target.value)}>
                        <option value="">Select role…</option>
                        {roles.filter((r) => r.active).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={reassign}
                    className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Reassign
                  </button>
                </div>
              ) : null}

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Add note</h3>
                <textarea
                  className={`${inputClass} min-h-[72px] resize-y`}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record an update…"
                />
                <button
                  type="button"
                  onClick={addNote}
                  className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900"
                >
                  Add note
                </button>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Close task</h3>
                <textarea
                  className={`${inputClass} min-h-[72px] resize-y`}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Resolution notes (optional)"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => closeTask("Completed")}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => closeTask("Cancelled")}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Activity</h2>
            <TaskActivityTimeline updates={liveTask.updates} />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Assignment</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Assigned to</dt>
                <dd className="mt-0.5 text-slate-800">
                  {liveTask.assignmentType === "user" ? "User" : "Role"}: {assigneeLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Task type</dt>
                <dd className="mt-0.5 text-slate-800">{getTaskTypeName(liveTask.taskTypeId)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Due</dt>
                <dd className="mt-0.5 text-slate-800">{liveTask.dueDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Created by</dt>
                <dd className="mt-0.5 text-slate-800">{liveTask.createdBy}</dd>
              </div>
            </dl>
          </section>

          {liveTask.entityId && liveTask.entityType ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Related record</h2>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {taskEntityTypeLabels[liveTask.entityType]}
              </p>
              <Link
                href={entityHref(liveTask.entityType, liveTask.entityId)}
                className="mt-1 block text-sm font-medium text-[#b51266] hover:underline"
              >
                {liveTask.entityLabel || liveTask.entityId}
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
