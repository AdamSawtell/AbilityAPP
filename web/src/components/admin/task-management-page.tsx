"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
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
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function TaskManagementAdminView() {
  const { roles, upsertRole, canWindow } = useAuth();
  const { taskTypes, upsertTaskType, resetTaskTypes } = useTaskTypes();
  const hasAccess = canWindow("admin-task-management");

  const [typeDraft, setTypeDraft] = useState<TaskTypeRecord | null>(null);
  const [activeTypeId, setActiveTypeId] = useState<string | null>(taskTypes[0]?.id ?? null);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const [roleDraft, setRoleDraft] = useState<AppRoleRecord | null>(null);

  const sortedTypes = useMemo(() => sortTaskTypes(taskTypes), [taskTypes]);
  const activeTypes = useMemo(() => activeTaskTypes(taskTypes), [taskTypes]);
  const typeRecord = typeDraft ?? sortedTypes.find((t) => t.id === activeTypeId) ?? null;
  const roleRecord = roleDraft ?? roles.find((r) => r.id === activeRoleId) ?? null;

  const rolePermissions = useMemo(() => {
    if (!roleRecord) return [];
    return mergeTaskTypePermissions(roleRecord.taskTypePermissions, sortedTypes.map((t) => t.id));
  }, [roleRecord, sortedTypes]);

  if (!hasAccess) {
    return (
      <AppShell title="Task management" audit={{ moduleLabel: "Task type administration" }}>
        <p className="text-sm text-slate-600">
          You do not have access to task administration. Ask an administrator to grant the Task management window for your role.
        </p>
      </AppShell>
    );
  }

  function openType(id: string) {
    const type = sortedTypes.find((t) => t.id === id);
    if (!type) return;
    setActiveTypeId(id);
    setTypeDraft({ ...type });
  }

  function addType() {
    const next: TaskTypeRecord = {
      id: newTaskTypeId(),
      name: "",
      description: "",
      active: true,
      sortOrder: (sortedTypes.at(-1)?.sortOrder ?? 0) + 10,
    };
    setActiveTypeId(next.id);
    setTypeDraft(next);
  }

  async function saveType() {
    if (!typeRecord?.name.trim()) return;
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
  }

  function openRole(id: string) {
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
  }

  function setPermission(taskTypeId: string, patch: Partial<Pick<TaskTypePermission, "canSee" | "canSelect" | "canCreate">>) {
    if (!roleRecord) return;
    const next = rolePermissions.map((p) => (p.taskTypeId === taskTypeId ? { ...p, ...patch } : p));
    setRoleDraft({ ...roleRecord, taskTypePermissions: next });
  }

  async function saveRolePermissions() {
    if (!roleRecord) return;
    await upsertRole(roleRecord);
    setRoleDraft(null);
  }

  return (
    <AppShell
      title="Task management"
      subtitle="Configure task types and which roles can see, select, and create each type."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin/task-management" },
        { label: "Task management" },
      ]}
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
                  onChange={(e) => setTypeDraft({ ...typeRecord, name: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
                <textarea
                  className={`${inputClass} min-h-[72px] resize-y`}
                  value={typeRecord.description}
                  onChange={(e) => setTypeDraft({ ...typeRecord, description: e.target.value })}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-600">Sort order</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={typeRecord.sortOrder}
                    onChange={(e) => setTypeDraft({ ...typeRecord, sortOrder: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="flex items-end pb-2">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={typeRecord.active}
                      onChange={(e) => setTypeDraft({ ...typeRecord, active: e.target.checked })}
                    />
                    Active
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => void saveType()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Save type
              </button>
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
                          checked={perm.canSee}
                          onChange={(canSee) => setPermission(type.id, { canSee })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PermissionToggle
                          label=""
                          checked={perm.canSelect}
                          onChange={(canSelect) => setPermission(type.id, { canSelect })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PermissionToggle
                          label=""
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
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Save role access
          </button>
        </section>
      </div>
    </AppShell>
  );
}
