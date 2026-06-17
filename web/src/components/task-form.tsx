"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { TaskEntitySearchPicker } from "@/components/task-entity-search";
import { useAuth } from "@/lib/auth-store";
import { displayName } from "@/lib/access/types";
import { entityTypeLabel, useTaskEntityIndex, type TaskEntityOption } from "@/lib/task-entities";
import { useReferenceData } from "@/lib/config-store";
import { creatableTaskTypes } from "@/lib/task-type-access";
import { useTaskTypes } from "@/lib/task-type-store";
import { type TaskEntityType, type TaskRecord } from "@/lib/task";

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
  const { getOptions } = useReferenceData();
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
  const [assigneeUserId, setAssigneeUserId] = useState(() => session?.userId ?? "");
  const [assigneeRoleId, setAssigneeRoleId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [highlightedUserIndex, setHighlightedUserIndex] = useState(0);
  const [highlightedRoleIndex, setHighlightedRoleIndex] = useState(0);
  const [linkedEntity, setLinkedEntity] = useState<TaskEntityOption | null>(fixedEntity ?? null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<TaskEntityType | "">("");
  const effectiveTaskTypeId = taskTypeId || availableTypes[0]?.id || "";
  const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
  const activeRoles = useMemo(() => roles.filter((r) => r.active), [roles]);
  const selectedUser = useMemo(
    () => activeUsers.find((u) => u.id === assigneeUserId),
    [activeUsers, assigneeUserId]
  );
  const selectedRole = useMemo(
    () => activeRoles.find((r) => r.id === assigneeRoleId),
    [activeRoles, assigneeRoleId]
  );
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return [];
    return activeUsers
      .filter((u) => {
        const name = displayName(u).toLowerCase();
        return name.includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [activeUsers, userQuery]);
  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return [];
    return activeRoles.filter((r) => r.name.toLowerCase().includes(q) || r.roleKey.toLowerCase().includes(q)).slice(0, 8);
  }, [activeRoles, roleQuery]);

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

  function assignToMe() {
    if (!session) return;
    setAssignmentType("user");
    setAssigneeUserId(session.userId);
    setAssigneeRoleId("");
    setUserQuery("");
  }

  function selectAssigneeMode(mode: "me" | "user" | "role") {
    if (mode === "me") {
      assignToMe();
      return;
    }
    setAssignmentType(mode);
    if (mode === "user" && !assigneeUserId && session?.userId) {
      setAssigneeUserId(session.userId);
    }
    if (mode === "role") {
      setAssigneeUserId("");
      setUserQuery("");
      setHighlightedRoleIndex(0);
    }
  }

  function onUserSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!filteredUsers.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedUserIndex((prev) => (prev + 1) % filteredUsers.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedUserIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = filteredUsers[Math.max(0, highlightedUserIndex)];
      if (!picked) return;
      setAssigneeUserId(picked.id);
      setUserQuery("");
      setHighlightedUserIndex(0);
    }
  }

  function onRoleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!filteredRoles.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedRoleIndex((prev) => (prev + 1) % filteredRoles.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedRoleIndex((prev) => (prev - 1 + filteredRoles.length) % filteredRoles.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = filteredRoles[Math.max(0, highlightedRoleIndex)];
      if (!picked) return;
      setAssigneeRoleId(picked.id);
      setRoleQuery("");
      setHighlightedRoleIndex(0);
    }
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
            {getOptions("taskPriority").map((o) => (
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
        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <span className="mb-2 block text-xs font-medium text-slate-600">Assign to</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => selectAssigneeMode("me")}
              className={`h-10 rounded-lg border text-sm font-medium transition ${
                assignmentType === "user" && session?.userId && assigneeUserId === session.userId
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Me
            </button>
            <button
              type="button"
              onClick={() => selectAssigneeMode("user")}
              className={`h-10 rounded-lg border text-sm font-medium transition ${
                assignmentType === "user" && (!session?.userId || assigneeUserId !== session.userId)
                  ? "border-[#f9a8d4] bg-[#fdf2f8] text-[#9d174d]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => selectAssigneeMode("role")}
              className={`h-10 rounded-lg border text-sm font-medium transition ${
                assignmentType === "role"
                  ? "border-violet-300 bg-violet-50 text-violet-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Role
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Me and User create personal tasks. Role shares the task across everyone in that role.
          </p>
        </div>
        {assignmentType === "user" ? (
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="block text-xs font-medium text-slate-600">User</span>
              {selectedUser ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  Selected
                </span>
              ) : null}
            </div>
            {selectedUser ? (
              <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Selected user</p>
                <p className="font-medium">{displayName(selectedUser)}</p>
                <p className="text-xs text-emerald-700/90">{selectedUser.username}</p>
              </div>
            ) : null}
            <input
              type="search"
              className={inputClass}
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value);
                setHighlightedUserIndex(0);
              }}
              onKeyDown={onUserSearchKeyDown}
              placeholder="Search user by name, username or email"
            />
            {userQuery.trim() ? (
              <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200">
                {filteredUsers.length ? (
                  filteredUsers.map((u, idx) => {
                    const active = assigneeUserId === u.id;
                    const highlighted = idx === highlightedUserIndex;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssigneeUserId(u.id);
                          setUserQuery("");
                          setHighlightedUserIndex(0);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                          active
                            ? "bg-[#fdf2f8] text-[#9d174d]"
                            : highlighted
                              ? "bg-slate-100 text-slate-900"
                              : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {active ? <span className="text-emerald-700">✓</span> : null}
                          <span>{displayName(u)}</span>
                        </span>
                        <span className="text-xs text-slate-500">{u.username}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No users found.</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Type to search users.</p>
            )}
          </div>
        ) : (
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="block text-xs font-medium text-slate-600">Role</span>
              {selectedRole ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800">
                  Selected
                </span>
              ) : null}
            </div>
            {selectedRole ? (
              <div className="mb-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">Selected role</p>
                <p className="font-medium">{selectedRole.name}</p>
                <p className="text-xs text-violet-700/90">{selectedRole.roleKey}</p>
              </div>
            ) : null}
            <input
              type="search"
              className={inputClass}
              value={roleQuery}
              onChange={(e) => {
                setRoleQuery(e.target.value);
                setHighlightedRoleIndex(0);
              }}
              onKeyDown={onRoleSearchKeyDown}
              placeholder="Search role"
            />
            {roleQuery.trim() ? (
              <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200">
                {filteredRoles.length ? (
                  filteredRoles.map((r, idx) => {
                    const active = assigneeRoleId === r.id;
                    const highlighted = idx === highlightedRoleIndex;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setAssigneeRoleId(r.id);
                          setRoleQuery("");
                          setHighlightedRoleIndex(0);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                          active
                            ? "bg-violet-50 text-violet-900"
                            : highlighted
                              ? "bg-slate-100 text-slate-900"
                              : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {active ? <span className="text-violet-700">✓</span> : null}
                          <span>{r.name}</span>
                        </span>
                        <span className="text-xs text-slate-500">{r.roleKey}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No roles found.</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Type to search roles.</p>
            )}
          </div>
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
