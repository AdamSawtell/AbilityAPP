"use client";

import { useMemo, useState } from "react";
import { TaskEntitySearchPicker } from "@/components/task-entity-search";
import { useAuth } from "@/lib/auth-store";
import { displayName } from "@/lib/access/types";
import { entityTypeLabel, useTaskEntityIndex, type TaskEntityOption } from "@/lib/task-entities";
import { creatableTaskTypes } from "@/lib/task-type-access";
import { useTaskTypes } from "@/lib/task-type-store";
import { taskPriorityOptions, type TaskEntityType, type TaskRecord } from "@/lib/task";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export type TaskFormValues = {
  title: string;
  description: string;
  taskTypeId: string;
  priority: TaskRecord["priority"];
  dueDate: string;
  assignmentType: "user" | "role";
  assigneeUserId: string;
  assigneeRoleId: string;
  entityType: TaskEntityType | "";
  entityId: string;
  entityLabel: string;
};

type TaskFormProps = {
  fixedEntity?: TaskEntityOption;
  showEntityPicker?: boolean;
  submitLabel?: string;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
};

export function TaskForm({
  fixedEntity,
  showEntityPicker = true,
  submitLabel = "Create task",
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const { session, users, roles } = useAuth();
  const { taskTypes } = useTaskTypes();
  const entityIndex = useTaskEntityIndex();

  const availableTypes = useMemo(() => {
    if (!session) return [];
    return creatableTaskTypes(session, taskTypes);
  }, [session, taskTypes]);

  const [title, setTitle] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskRecord["priority"]>("Normal");
  const [dueDate, setDueDate] = useState("");
  const [assignmentType, setAssignmentType] = useState<"user" | "role">("user");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [assigneeRoleId, setAssigneeRoleId] = useState("");
  const [linkedEntity, setLinkedEntity] = useState<TaskEntityOption | null>(fixedEntity ?? null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<TaskEntityType | "">("");
  const effectiveTaskTypeId = taskTypeId || availableTypes[0]?.id || "";

  function resolveEntity(): Pick<TaskFormValues, "entityType" | "entityId" | "entityLabel"> {
    if (fixedEntity) {
      return {
        entityType: fixedEntity.entityType,
        entityId: fixedEntity.entityId,
        entityLabel: fixedEntity.label,
      };
    }
    if (!linkedEntity) {
      return { entityType: "", entityId: "", entityLabel: "" };
    }
    return {
      entityType: linkedEntity.entityType,
      entityId: linkedEntity.entityId,
      entityLabel: linkedEntity.label,
    };
  }

  function handleSubmit() {
    if (!title.trim() || !effectiveTaskTypeId) return;
    if (assignmentType === "user" && !assigneeUserId) return;
    if (assignmentType === "role" && !assigneeRoleId) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      taskTypeId: effectiveTaskTypeId,
      priority,
      dueDate,
      assignmentType,
      assigneeUserId: assignmentType === "user" ? assigneeUserId : "",
      assigneeRoleId: assignmentType === "role" ? assigneeRoleId : "",
      ...resolveEntity(),
    });
  }

  return (
    <div className="rounded-xl border border-[#f9a8d4]/40 bg-[#fdf2f8]/30 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Title</span>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review this agreement…"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Task type</span>
          {availableTypes.length ? (
            <select className={inputClass} value={effectiveTaskTypeId} onChange={(e) => setTaskTypeId(e.target.value)}>
              {availableTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No task types available for your role. Ask an administrator to grant create access in Task management.
            </p>
          )}
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Description</span>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to happen?"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Priority</span>
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskRecord["priority"])}
          >
            {taskPriorityOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Due date</span>
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">Optional — you can set or change this anytime on the task.</p>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Assign to</span>
          <select
            className={inputClass}
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value as "user" | "role")}
          >
            <option value="user">User (only they see it)</option>
            <option value="role">Role (everyone with role sees it)</option>
          </select>
        </label>
        {assignmentType === "user" ? (
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">User</span>
            <select className={inputClass} value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)}>
              <option value="">Select user…</option>
              {users.filter((u) => u.active).map((u) => (
                <option key={u.id} value={u.id}>
                  {displayName(u)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Role</span>
            <select className={inputClass} value={assigneeRoleId} onChange={(e) => setAssigneeRoleId(e.target.value)}>
              <option value="">Select role…</option>
              {roles.filter((r) => r.active).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {showEntityPicker && !fixedEntity ? (
          <TaskEntitySearchPicker
            index={entityIndex}
            value={linkedEntity}
            onChange={setLinkedEntity}
            entityTypeFilter={entityTypeFilter}
            onEntityTypeFilterChange={setEntityTypeFilter}
          />
        ) : fixedEntity ? (
          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Linked record</span>
            <p className="mt-1">
              {entityTypeLabel(fixedEntity.entityType)}: {fixedEntity.label}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!availableTypes.length}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
