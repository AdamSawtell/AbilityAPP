"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TaskForm, type TaskFormValues } from "@/components/task-form";
import { useAuth } from "@/lib/auth-store";
import { displayName } from "@/lib/access/types";
import { useData } from "@/lib/data-store";
import { useTaskTypes } from "@/lib/task-type-store";
import { filterTasksByTypeAccess } from "@/lib/task-type-access";
import { entityHref, isActiveTask, type TaskEntityType, type TaskRecord } from "@/lib/task";

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

export function RecordTasksPanel({
  entityType,
  entityId,
  entityLabel,
}: {
  entityType: TaskEntityType;
  entityId: string;
  entityLabel: string;
}) {
  const { getTasksByEntity, addTask } = useData();
  const { session, canProcess, users, roles } = useAuth();
  const { getTaskTypeName } = useTaskTypes();
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(() => {
    const entityTasks = getTasksByEntity(entityType, entityId);
    return session ? filterTasksByTypeAccess(entityTasks, session) : entityTasks;
  }, [getTasksByEntity, entityType, entityId, session]);
  const canAssign = canProcess("assign-task") && Boolean(session);

  function handleCreate(values: TaskFormValues) {
    if (!session) return;
    const assigneeDisplayName =
      values.assignmentType === "user"
        ? displayName(users.find((u) => u.id === values.assigneeUserId) ?? { firstName: "", lastName: "", username: values.assigneeUserId })
        : roles.find((r) => r.id === values.assigneeRoleId)?.name ?? values.assigneeRoleId;

    addTask(
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
        entityType,
        entityId,
        entityLabel,
        createdByUserId: session.userId,
        createdBy: session.displayName,
        updatedBy: session.displayName,
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
      },
      { assigneeDisplayName }
    );
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Tasks</h3>
          <p className="text-sm text-slate-500">Assign work to a user or role — AbilityERP requests.</p>
        </div>
        {canAssign ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            {showForm ? "Cancel" : "Assign task"}
          </button>
        ) : null}
      </div>

      {showForm ? (
        <TaskForm
          fixedEntity={{ entityType, entityId, label: entityLabel }}
          showEntityPicker={false}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {rows.length ? (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {rows.map((task) => (
            <div key={task.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/tasks/${task.id}`} className="font-medium text-slate-900 hover:text-[#b51266]">
                  {task.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {task.documentNo} · {getTaskTypeName(task.taskTypeId)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusPill(task.status)}
                {isActiveTask(task) ? (
                  <Link href={`/tasks/${task.id}`} className="text-xs font-medium text-[#b51266] hover:underline">
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          No tasks on this record yet.
        </div>
      )}

      <p className="text-xs text-slate-400">
        Linked record:{" "}
        <Link href={entityHref(entityType, entityId)} className="text-[#b51266] hover:underline">
          {entityLabel}
        </Link>
      </p>
    </div>
  );
}
