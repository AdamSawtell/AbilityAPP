"use client";

import { useMemo, useState } from "react";
import type { AppUserRecord } from "@/lib/access/types";
import { displayName } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import { useAuth } from "@/lib/auth-store";

function newUserId() {
  return `user-${Date.now()}`;
}

function defaultUsername(employee: EmployeeRecord) {
  return `${employee.firstName}${employee.lastName}`.replace(/\s/g, "");
}

function userFromEmployee(employee: EmployeeRecord): AppUserRecord {
  return {
    id: newUserId(),
    username: defaultUsername(employee),
    email: employee.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    phone: employee.mobile || employee.phone,
    active: true,
    employeeBpId: employee.id,
    notes: "",
    roleIds: [],
  };
}

function syncFromEmployee(user: AppUserRecord, employee: EmployeeRecord): AppUserRecord {
  return {
    ...user,
    email: employee.email || user.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    phone: employee.mobile || employee.phone || user.phone,
    employeeBpId: employee.id,
  };
}

export function EmployeeSystemAccessPanel({
  employee,
  linkedUser,
}: {
  employee: EmployeeRecord;
  linkedUser?: AppUserRecord;
}) {
  const { roles, upsertUser } = useAuth();
  const [draft, setDraft] = useState<AppUserRecord | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(draft || linkedUser);
  const record = draft ?? (linkedUser ? { ...linkedUser, roleIds: [...linkedUser.roleIds] } : null);
  const isNew = !linkedUser;
  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);
  const activeRoles = useMemo(() => roles.filter((r) => r.active), [roles]);

  function startSetup() {
    setDraft(userFromEmployee(employee));
    setPassword("");
    setConfirmPassword("");
    setSaved(false);
    setError("");
  }

  function toggleRole(roleId: string) {
    if (!record) return;
    const has = record.roleIds.includes(roleId);
    setDraft({
      ...record,
      roleIds: has ? record.roleIds.filter((id) => id !== roleId) : [...record.roleIds, roleId],
    });
    setSaved(false);
  }

  async function save() {
    if (!record?.username.trim()) {
      setError("Username is required.");
      return;
    }
    if (isNew && !password.trim()) {
      setError("Set a password when enabling login for the first time.");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const next = syncFromEmployee({ ...record, username: record.username.trim() }, employee);
      await upsertUser(next, password.trim() ? { password: password.trim() } : undefined);
      setDraft(null);
      setPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch {
      setError("Could not save system access.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">System access</h3>
      <p className="mt-1 text-sm text-slate-500">
        Login and roles for {employee.name}. Microsoft SSO will replace password sign-in later.
      </p>

      {!editing ? (
        <div className="mt-4">
          <p className="text-sm text-slate-600">No login is set up for this employee yet.</p>
          <button
            type="button"
            onClick={startSetup}
            className="mt-3 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Set up login
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Username"
              value={record!.username}
              onChange={(username) => {
                setDraft({ ...record!, username });
                setSaved(false);
              }}
            />
            <div>
              <p className="mb-1 block text-sm font-medium text-slate-700">Display name</p>
              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {displayName(record!)}
              </p>
            </div>
            <div>
              <p className="mb-1 block text-sm font-medium text-slate-700">Email</p>
              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {employee.email || "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Synced from the employee Contact tab.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={record!.active}
              onChange={(e) => {
                setDraft({ ...record!, active: e.target.checked });
                setSaved(false);
              }}
            />
            Login active
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={isNew ? "Password" : "New password"}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={isNew ? "Required" : "Leave blank to keep current"}
            />
            <Field
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder={isNew ? "Repeat password" : "Repeat new password"}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Assigned roles</p>
            <div className="flex flex-wrap gap-2">
              {activeRoles.map((r) => (
                <label
                  key={r.id}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    record!.roleIds.includes(r.id)
                      ? "border-[#d4147a] bg-[#fdf2f8] text-[#b51266]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={record!.roleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
            {record!.roleIds.length === 0 ? (
              <p className="mt-2 text-xs text-amber-600">Assign at least one role so this user can sign in.</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                {record!.roleIds.map((id) => roleNameById.get(id)).filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <textarea
            className="min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Notes (optional)"
            value={record!.notes}
            onChange={(e) => {
              setDraft({ ...record!, notes: e.target.value });
              setSaved(false);
            }}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {saved ? <p className="text-sm text-emerald-700">System access saved.</p> : null}

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save system access"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a]"
      />
    </div>
  );
}
