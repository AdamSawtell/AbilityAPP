"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { AppUserRecord } from "@/lib/access/types";
import { displayName } from "@/lib/access/types";
import { useAuth } from "@/lib/auth-store";

function newUserId() {
  return `user-${Date.now()}`;
}

export function UsersAdminView() {
  const { users, roles, upsertUser } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(users[0]?.id ?? null);
  const [draft, setDraft] = useState<AppUserRecord | null>(null);

  const record = draft ?? users.find((u) => u.id === activeId) ?? null;
  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);

  function openUser(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setActiveId(id);
    setDraft({ ...user, roleIds: [...user.roleIds] });
  }

  function addUser() {
    const user: AppUserRecord = {
      id: newUserId(),
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      active: true,
      employeeBpId: "",
      notes: "",
      roleIds: [],
    };
    setActiveId(user.id);
    setDraft(user);
  }

  function toggleRole(roleId: string) {
    if (!record) return;
    const has = record.roleIds.includes(roleId);
    setDraft({
      ...record,
      roleIds: has ? record.roleIds.filter((id) => id !== roleId) : [...record.roleIds, roleId],
    });
  }

  async function save() {
    if (!record?.username.trim()) return;
    await upsertUser(record);
    setDraft(null);
  }

  return (
    <AppShell
      title="Users"
      subtitle="Application users. Each user can have one or more roles. Employee records will link here later."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin/users" },
        { label: "Users" },
      ]}
      actions={
        <button
          type="button"
          onClick={addUser}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
        >
          Add user
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => openUser(u.id)}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left ${
                activeId === u.id
                  ? "border-[#f9a8d4] bg-[#fdf2f8]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="font-medium text-slate-900">{displayName(u)}</span>
              <span className="text-xs text-slate-500">{u.username}</span>
              <span className="mt-1 text-xs text-slate-400">
                {u.roleIds.map((id) => roleNameById.get(id)).filter(Boolean).join(", ") || "No roles"}
              </span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {record ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Username" value={record.username} onChange={(v) => setDraft({ ...record, username: v })} />
                <Field label="Email" value={record.email} onChange={(v) => setDraft({ ...record, email: v })} />
                <Field label="First name" value={record.firstName} onChange={(v) => setDraft({ ...record, firstName: v })} />
                <Field label="Last name" value={record.lastName} onChange={(v) => setDraft({ ...record, lastName: v })} />
                <Field label="Phone" value={record.phone} onChange={(v) => setDraft({ ...record, phone: v })} />
                <Field
                  label="Employee BP id (future)"
                  value={record.employeeBpId}
                  onChange={(v) => setDraft({ ...record, employeeBpId: v })}
                />
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={record.active}
                  onChange={(e) => setDraft({ ...record, active: e.target.checked })}
                />
                Active
              </label>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Assigned roles</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <label
                      key={r.id}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                        record.roleIds.includes(r.id)
                          ? "border-[#d4147a] bg-[#fdf2f8] text-[#b51266]"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={record.roleIds.includes(r.id)}
                        onChange={() => toggleRole(r.id)}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                className="mt-4 min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes"
                value={record.notes}
                onChange={(e) => setDraft({ ...record, notes: e.target.value })}
              />
              <button
                type="button"
                onClick={() => void save()}
                className="mt-4 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                Save user
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a user or add a new one.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a]"
      />
    </div>
  );
}
