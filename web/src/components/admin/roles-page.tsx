"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SystemShell } from "@/components/system/system-shell";
import { ACCESS_PROCESSES, ACCESS_WINDOWS, appChildWindows, appRoleWindows, sanitizeAppWindowKeys } from "@/lib/access/catalog";
import type { AppRoleRecord } from "@/lib/access/types";
import { ACCESS_REPORTS } from "@/lib/reports/catalog";
import { useAuth } from "@/lib/auth-store";

function newRoleId() {
  return `role-${Date.now()}`;
}

export function RolesAdminView({ variant = "workspace" }: { variant?: "workspace" | "system" }) {
  const { roles, upsertRole } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(roles[0]?.id ?? null);
  const [draft, setDraft] = useState<AppRoleRecord | null>(null);

  const record = draft ?? roles.find((r) => r.id === activeId) ?? null;
  const windowsByGroup = useMemo(() => {
    const map = new Map<string, ReturnType<typeof appRoleWindows>>();
    for (const w of appRoleWindows()) {
      const list = map.get(w.group) ?? [];
      list.push(w);
      map.set(w.group, list);
    }
    return map;
  }, []);

  function openRole(id: string) {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    setActiveId(id);
    setDraft({
      ...role,
      windowKeys: sanitizeAppWindowKeys([...role.windowKeys]),
      processIds: [...role.processIds],
      reportIds: [...(role.reportIds ?? [])],
      taskTypePermissions: [...(role.taskTypePermissions ?? [])],
    });
  }

  function addRole() {
    const role: AppRoleRecord = {
      id: newRoleId(),
      roleKey: "",
      name: "",
      description: "",
      active: true,
      windowKeys: [],
      processIds: [],
      reportIds: [],
      taskTypePermissions: [],
    };
    setActiveId(role.id);
    setDraft(role);
  }

  function toggleWindow(key: string) {
    if (!record) return;
    const has = record.windowKeys.includes(key);
    const win = ACCESS_WINDOWS.find((w) => w.key === key);
    let nextKeys = has
      ? record.windowKeys.filter((k) => k !== key)
      : [...record.windowKeys, key];

    if (has && win && !win.parentWindowKey) {
      const dependents = appChildWindows(key).map((c) => c.key);
      nextKeys = nextKeys.filter((k) => !dependents.includes(k));
    }

    setDraft({ ...record, windowKeys: nextKeys });
  }

  function toggleProcess(id: string) {
    if (!record) return;
    const has = record.processIds.includes(id);
    setDraft({
      ...record,
      processIds: has ? record.processIds.filter((p) => p !== id) : [...record.processIds, id],
    });
  }

  function toggleReport(id: string) {
    if (!record) return;
    const current = record.reportIds ?? [];
    const has = current.includes(id);
    setDraft({
      ...record,
      reportIds: has ? current.filter((r) => r !== id) : [...current, id],
    });
  }

  async function save() {
    if (!record?.roleKey.trim() || !record.name.trim()) return;
    await upsertRole({
      ...record,
      windowKeys: sanitizeAppWindowKeys(record.windowKeys),
    });
    setDraft(null);
  }

  const Shell = variant === "system" ? SystemShell : AppShell;

  return (
    <Shell
      title="Roles"
      subtitle="Roles control which windows and processes a user can see when signed in with that role."
      breadcrumbs={
        variant === "system"
          ? [{ label: "System", href: "/system" }, { label: "Admin", href: "/system/admin/roles" }, { label: "Roles" }]
          : [
              { label: "Home", href: "/" },
              { label: "Admin", href: "/admin/roles" },
              { label: "Roles" },
            ]
      }
      audit={{ moduleLabel: "Role administration" }}
      actions={
        <button
          type="button"
          onClick={addRole}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
        >
          Add role
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openRole(r.id)}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left ${
                activeId === r.id
                  ? "border-[#f9a8d4] bg-[#fdf2f8]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="font-medium text-slate-900">{r.name}</span>
              <span className="text-xs text-slate-500">{r.roleKey}</span>
              <span className="mt-1 text-xs text-slate-400">
                {r.windowKeys.length} windows · {r.processIds.length} processes · {(r.reportIds ?? []).length} reports
              </span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {record ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Role key" value={record.roleKey} onChange={(v) => setDraft({ ...record, roleKey: v })} />
                  <Field label="Name" value={record.name} onChange={(v) => setDraft({ ...record, name: v })} />
                </div>
                <textarea
                  className="mt-4 min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Description"
                  value={record.description}
                  onChange={(e) => setDraft({ ...record, description: e.target.value })}
                />
                <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={record.active}
                    onChange={(e) => setDraft({ ...record, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Windows / functions</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Top-level windows appear in the workspace sidebar. Dependent windows (indented) are tabs or
                  sub-functions inside a parent — e.g. Overview under Clients, or Credentials Assigned under
                  Employees.                   System-only windows (task management, Reports Advance,
                  and similar) are available to every signed-in System operator and are not listed here.
                </p>
                {[...windowsByGroup.entries()].map(([group, items]) => {
                  const topLevel = items.filter((w) => !w.parentWindowKey);
                  return (
                  <div key={group} className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                    <div className="space-y-2">
                      {topLevel.map((w) => (
                        <div key={w.key}>
                          <label
                            title={w.abilityErpName}
                            className={`inline-flex cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                              record.windowKeys.includes(w.key)
                                ? "border-[#d4147a] bg-[#fdf2f8] text-[#b51266]"
                                : "border-slate-200 text-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={record.windowKeys.includes(w.key)}
                              onChange={() => toggleWindow(w.key)}
                            />
                            {w.label}
                          </label>
                          {appChildWindows(w.key).length > 0 ? (
                            <div className="ml-4 mt-2 flex flex-wrap gap-2 border-l border-slate-200 pl-3">
                              {appChildWindows(w.key).map((child) => (
                                <label
                                  key={child.key}
                                  title={child.abilityErpName}
                                  className={`inline-flex cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs ${
                                    record.windowKeys.includes(child.key)
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                      : "border-slate-200 text-slate-500"
                                  } ${!record.windowKeys.includes(w.key) ? "opacity-50" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    disabled={!record.windowKeys.includes(w.key)}
                                    checked={record.windowKeys.includes(child.key)}
                                    onChange={() => toggleWindow(child.key)}
                                  />
                                  {child.label}
                                </label>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
                })}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Processes</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Assigned processes are available as actions (e.g. Convert to client) for this role only.
                </p>
                <div className="space-y-2">
                  {ACCESS_PROCESSES.map((p) => (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 ${
                        record.processIds.includes(p.id)
                          ? "border-[#d4147a] bg-[#fdf2f8]"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={record.processIds.includes(p.id)}
                        onChange={() => toggleProcess(p.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{p.label}</span>
                        <span className="text-xs text-slate-500">{p.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Reports</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Assigned reports appear under Reports in the sidebar, grouped by module. The role also needs the
                  parent module window and the Reports menu.
                </p>
                <div className="space-y-2">
                  {ACCESS_REPORTS.map((r) => (
                    <label
                      key={r.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 ${
                        (record.reportIds ?? []).includes(r.id)
                          ? "border-[#d4147a] bg-[#fdf2f8]"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={(record.reportIds ?? []).includes(r.id)}
                        onChange={() => toggleReport(r.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">
                          {r.label}
                          <span className="ml-2 text-xs font-normal text-slate-400">{r.moduleGroup}</span>
                        </span>
                        <span className="text-xs text-slate-500">{r.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={() => void save()}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                Save role
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a role or add a new one.</p>
          )}
        </div>
      </div>
    </Shell>
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
