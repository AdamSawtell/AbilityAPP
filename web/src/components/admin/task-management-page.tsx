"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SystemShell } from "@/components/system/system-shell";
import { useAuth } from "@/lib/auth-store";
import type { AppRoleRecord, TaskTypePermission } from "@/lib/access/types";
import {
  activeTaskTypes,
  mergeTaskTypePermissions,
  newTaskTypeId,
  normalizeTaskType,
  sortTaskTypes,
  fullTaskTypePermissions,
  type TaskTypeRecord,
} from "@/lib/task-type";
import { useTaskTypes } from "@/lib/task-type-store";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function PermissionToggle({
  label,
  ariaLabel,
  checked,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label ? <span>{label}</span> : <span className="sr-only">{ariaLabel}</span>}
    </label>
  );
}

export function TaskManagementAdminView({ variant = "workspace" }: { variant?: "workspace" | "system" }) {
  const { roles, upsertRole, canWindow } = useAuth();
  const { taskTypes, upsertTaskType, resetTaskTypes } = useTaskTypes();
  const hasAccess = canWindow("admin-task-management");

  const [typeDraft, setTypeDraft] = useState<TaskTypeRecord | null>(null);
  const [activeTypeId, setActiveTypeId] = useState<string | null>(taskTypes[0]?.id ?? null);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const [roleDraft, setRoleDraft] = useState<AppRoleRecord | null>(null);
  const [typeSaveState, setTypeSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [roleSaveState, setRoleSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const sortedTypes = useMemo(() => sortTaskTypes(taskTypes), [taskTypes]);
  const activeTypes = useMemo(() => activeTaskTypes(taskTypes), [taskTypes]);
  const typeRecord = typeDraft ?? sortedTypes.find((t) => t.id === activeTypeId) ?? null;
  const roleRecord = roleDraft ?? roles.find((r) => r.id === activeRoleId) ?? null;

  const rolePermissions = useMemo(() => {
    if (!roleRecord) return [];
    return mergeTaskTypePermissions(roleRecord.taskTypePermissions, sortedTypes.map((t) => t.id));
  }, [roleRecord, sortedTypes]);
  const persistedType = sortedTypes.find((t) => t.id === activeTypeId) ?? null;
  const persistedRole = roles.find((r) => r.id === activeRoleId) ?? null;
  const typeDirty = Boolean(typeDraft && persistedType && JSON.stringify(typeDraft) !== JSON.stringify(persistedType));
  const roleDirty = Boolean(roleDraft && persistedRole && JSON.stringify(roleDraft) !== JSON.stringify(persistedRole));

  const Shell = variant === "system" ? SystemShell : AppShell;

  if (!hasAccess) {
    return (
      <Shell title="Task management" audit={{ moduleLabel: "Task type administration" }}>
        <p className="text-sm text-slate-600">
          You do not have access to task administration. Ask an administrator to grant the Task management window for your role.
        </p>
      </Shell>
    );
  }

  function openType(id: string) {
    if (typeDirty && !window.confirm("You have unsaved task type changes. Discard them?")) return;
    const type = sortedTypes.find((t) => t.id === id);
    if (!type) return;
    setActiveTypeId(id);
    setTypeDraft({ ...type });
    setTypeSaveState("idle");
  }

  function addType() {
    if (typeDirty && !window.confirm("You have unsaved task type changes. Discard them?")) return;
    const next: TaskTypeRecord = {
      id: newTaskTypeId(),
      name: "",
      description: "",
      active: true,
      sortOrder: (sortedTypes.at(-1)?.sortOrder ?? 0) + 10,
    };
    setActiveTypeId(next.id);
    setTypeDraft(next);
    setTypeSaveState("idle");
  }

  async function saveType() {
    if (!typeRecord?.name.trim()) return;
    setTypeSaveState("saving");
    upsertTaskType(normalizeTaskType({ ...typeRecord, name: typeRecord.name.trim() }));
    setTypeDraft(null);

    const adminRole = roles.find((r) => r.id === "role-admin");
    if (adminRole) {
      const allTypeIds = [...new Set([...sortedTypes.map((t) => t.id), typeRecord.id])];
      await upsertRole({
        ...adminRole,
        taskTypePermissions: fullTaskTypePermissions(allTypeIds),
      });
    }
    setTypeSaveState("saved");
  }

  function openRole(id: string) {
    if (roleDirty && !window.confirm("You have unsaved role access changes. Discard them?")) return;
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    setActiveRoleId(id);
    setRoleDraft({
      ...role,
      windowKeys: [...role.windowKeys],
      processIds: [...role.processIds],
      reportIds: [...(role.reportIds ?? [])],
      taskTypePermissions: mergeTaskTypePermissions(role.taskTypePermissions, sortedTypes.map((t) => t.id)),
    });
    setRoleSaveState("idle");
  }

  function setPermission(taskTypeId: string, patch: Partial<Pick<TaskTypePermission, "canSee" | "canSelect" | "canCreate">>) {
    if (!roleRecord) return;
    const next = rolePermissions.map((p) => (p.taskTypeId === taskTypeId ? { ...p, ...patch } : p));
    setRoleDraft({ ...roleRecord, taskTypePermissions: next });
    setRoleSaveState("idle");
  }

  async function saveRolePermissions() {
    if (!roleRecord) return;
    setRoleSaveState("saving");
    await upsertRole(roleRecord);
    setRoleDraft(null);
    setRoleSaveState("saved");
  }

  return (
    <Shell
      title="Task management"
      subtitle="Configure task types and which roles can see, select, and create each type."
      breadcrumbs={
        variant === "system"
          ? [
              { label: "System", href: "/system" },
              { label: "Admin", href: "/system/admin/roles" },
              { label: "Task management" },
            ]
          : [
              { label: "Home", href: "/" },
              { label: "Admin", href: "/system/admin/task-management" },
              { label: "Task management" },
            ]
      }
      audit={{ moduleLabel: "Task type administration" }}
      actions={
        <button
          type="button"
          onClick={resetTaskTypes}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Reset types to defaults
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Task types</h2>
              <p className="text-sm text-slate-500">Used when creating tasks — Review, Approve, Check, and others.</p>
            </div>
            <button
              type="button"
              onClick={addType}
              className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Add type
            </button>
          </div>

          <ul className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {sortedTypes.map((type) => (
              <li key={type.id}>
                <button
                  type="button"
                  onClick={() => openType(type.id)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm ${
                    activeTypeId === type.id ? "bg-[#fdf2f8] text-[#b51266]" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="font-medium">{type.name}</span>
                  <span className="text-xs text-slate-400">{type.active ? "Active" : "Inactive"}</span>
                </button>
              </li>
            ))}
          </ul>

          {typeRecord ? (
            <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
                <input
                  className={inputClass}
                  value={typeRecord.name}
                  onChange={(e) => {
                    setTypeDraft({ ...typeRecord, name: e.target.value });
                    setTypeSaveState("idle");
                  }}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
                <textarea
                  className={`${inputClass} min-h-[72px] resize-y`}
                  value={typeRecord.description}
                  onChange={(e) => {
                    setTypeDraft({ ...typeRecord, description: e.target.value });
                    setTypeSaveState("idle");
                  }}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-600">Sort order</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={typeRecord.sortOrder}
                    onChange={(e) => {
                      setTypeDraft({ ...typeRecord, sortOrder: Number(e.target.value) || 0 });
                      setTypeSaveState("idle");
                    }}
                  />
                </label>
                <label className="flex items-end pb-2">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={typeRecord.active}
                      onChange={(e) => {
                        setTypeDraft({ ...typeRecord, active: e.target.checked });
                        setTypeSaveState("idle");
                      }}
                    />
                    Active
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => void saveType()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={!typeDirty || typeSaveState === "saving"}
              >
                {typeSaveState === "saving" ? "Saving..." : "Save type"}
              </button>
              <p className="text-xs text-slate-500">
                {typeSaveState === "saved" ? "Saved." : typeDirty ? "Unsaved changes." : "No changes."}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Role access</h2>
            <p className="text-sm text-slate-500">
              See — view tasks of this type. Select — choose in forms. Create — assign new tasks with this type.
            </p>
          </div>

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Role</span>
            <select
              className={inputClass}
              value={activeRoleId ?? ""}
              onChange={(e) => openRole(e.target.value)}
            >
              {roles.filter((r) => r.active).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Task type</th>
                  <th className="px-3 py-2">See</th>
                  <th className="px-3 py-2">Select</th>
                  <th className="px-3 py-2">Create</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTypes.map((type) => {
                  const perm = rolePermissions.find((p) => p.taskTypeId === type.id);
                  if (!perm) return null;
                  return (
                    <tr key={type.id}>
                      <td className="px-3 py-2 font-medium text-slate-800">{type.name}</td>
                      <td className="px-3 py-2">
                        <PermissionToggle
                          label=""
                          ariaLabel={`See ${type.name}`}
                          checked={perm.canSee}
                          onChange={(canSee) => setPermission(type.id, { canSee })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PermissionToggle
                          label=""
                          ariaLabel={`Select ${type.name}`}
                          checked={perm.canSelect}
                          onChange={(canSelect) => setPermission(type.id, { canSelect })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PermissionToggle
                          label=""
                          ariaLabel={`Create ${type.name}`}
                          checked={perm.canCreate}
                          onChange={(canCreate) => setPermission(type.id, { canCreate })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => void saveRolePermissions()}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={!roleDirty || roleSaveState === "saving"}
          >
            {roleSaveState === "saving" ? "Saving..." : "Save role access"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            {roleSaveState === "saved" ? "Saved." : roleDirty ? "Unsaved changes." : "No changes."}
          </p>
        </section>
      </div>
    </Shell>
  );
}
