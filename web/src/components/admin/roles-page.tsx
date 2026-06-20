"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SystemShell } from "@/components/system/system-shell";
import { ACCESS_PROCESSES, appChildWindows, appRoleWindows } from "@/lib/access/catalog";
import { HOME_PANEL_KEYS, homePanelsForRoleEditor } from "@/lib/access/home-panels";
import { ensureAdminRoleAccess, isAdminRole } from "@/lib/access/role-access-templates";
import { ALL_TASK_TYPE_IDS } from "@/lib/access/seed";
import type { AppRoleRecord } from "@/lib/access/types";
import type { WindowAccessLevel } from "@/lib/access/window-access";
import {
  normalizeRoleWindowAccess,
  setWindowAccessLevel,
  windowAccessLevel,
  windowKeysFromAccess,
} from "@/lib/access/window-access";
import { ACCESS_REPORTS } from "@/lib/reports/catalog";
import { useAuth } from "@/lib/auth-store";

function newRoleId() {
  return `role-${Date.now()}`;
}

function AccessLevelTiles({
  level,
  disabled,
  size = "md",
  ariaLabel,
  onChange,
}: {
  level: WindowAccessLevel | null;
  disabled?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
  onChange: (level: WindowAccessLevel | null) => void;
}) {
  const value = level ?? "none";
  const btn =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      : "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide";

  function tile(active: boolean, tone: "off" | "read" | "write") {
    const tones = {
      off: active ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700",
      read: active ? "bg-indigo-600 text-white shadow-sm" : "text-indigo-600 hover:bg-indigo-50",
      write: active ? "bg-[#d4147a] text-white shadow-sm" : "text-[#b51266] hover:bg-[#fdf2f8]",
    };
    return `${btn} rounded-md transition ${tones[tone]} ${disabled ? "pointer-events-none opacity-40" : ""}`;
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 ${disabled ? "opacity-60" : ""}`}
    >
      <button type="button" disabled={disabled} className={tile(value === "none", "off")} onClick={() => onChange(null)}>
        Off
      </button>
      <button
        type="button"
        disabled={disabled}
        className={tile(value === "read", "read")}
        onClick={() => onChange("read")}
      >
        Read
      </button>
      <button
        type="button"
        disabled={disabled}
        className={tile(value === "write", "write")}
        onClick={() => onChange("write")}
      >
        Write
      </button>
    </div>
  );
}

function moduleCardTone(level: WindowAccessLevel | null) {
  if (level === "write") return "border-[#f9a8d4] bg-gradient-to-br from-[#fdf2f8] to-white shadow-sm";
  if (level === "read") return "border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white shadow-sm";
  return "border-slate-200 bg-white";
}

function ModuleAccessCard({
  label,
  level,
  disabled,
  children,
  onChange,
}: {
  label: string;
  level: WindowAccessLevel | null;
  disabled?: boolean;
  children?: React.ReactNode;
  onChange: (level: WindowAccessLevel | null) => void;
}) {
  const active = Boolean(level);
  return (
    <article
      className={`overflow-hidden rounded-xl border transition ${moduleCardTone(level)} ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">{label}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {level === "write" ? "Can view and edit" : level === "read" ? "View only" : "Hidden for this role"}
          </p>
        </div>
        <AccessLevelTiles ariaLabel={`${label} access`} level={level} disabled={disabled} onChange={onChange} />
      </div>
      {active && children ? (
        <div className="border-t border-slate-200/80 bg-white/60 px-3 py-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tabs & sub-functions</p>
          <div className="flex flex-wrap gap-2">{children}</div>
        </div>
      ) : null}
    </article>
  );
}

function TabAccessChip({
  label,
  level,
  disabled,
  onChange,
}: {
  label: string;
  level: WindowAccessLevel | null;
  disabled?: boolean;
  onChange: (level: WindowAccessLevel | null) => void;
}) {
  return (
    <div
      className={`min-w-[7.5rem] rounded-lg border px-2 py-1.5 ${
        level === "write"
          ? "border-[#f9a8d4] bg-[#fdf2f8]"
          : level === "read"
            ? "border-indigo-200 bg-indigo-50/60"
            : "border-slate-200 bg-slate-50"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <p className="mb-1 truncate text-xs font-medium text-slate-800">{label}</p>
      <AccessLevelTiles
        size="sm"
        ariaLabel={`${label} tab access`}
        level={level}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

function HomePanelTile({
  label,
  description,
  enabled,
  disabled,
  moduleMissing,
  requiresWindowKey,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  moduleMissing?: boolean;
  requiresWindowKey?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`flex flex-col rounded-xl border px-3 py-2.5 text-left transition ${
        enabled ? "border-[#f9a8d4] bg-[#fdf2f8] shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      } ${moduleMissing ? "opacity-50" : ""}`}
    >
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <span className="mt-1 line-clamp-2 text-xs text-slate-500">{description}</span>
      <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {enabled ? "Shown on Home" : "Hidden"}
      </span>
      {moduleMissing && requiresWindowKey ? (
        <span className="mt-1 text-[11px] text-amber-700">Needs {requiresWindowKey}</span>
      ) : null}
    </button>
  );
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

  function applyWindowAccess(access: AppRoleRecord["windowAccess"]) {
    if (!record) return;
    const normalized = normalizeRoleWindowAccess({ ...record, windowAccess: access, windowKeys: windowKeysFromAccess(access) });
    setDraft(normalized);
  }

  function openRole(id: string) {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    setActiveId(id);
    setDraft(
      ensureAdminRoleAccess(
        normalizeRoleWindowAccess({
          ...role,
          processIds: [...role.processIds],
          reportIds: [...(role.reportIds ?? [])],
          taskTypePermissions: [...(role.taskTypePermissions ?? [])],
        }),
        ALL_TASK_TYPE_IDS
      )
    );
  }

  function addRole() {
    const role: AppRoleRecord = {
      id: newRoleId(),
      roleKey: "",
      name: "",
      description: "",
      active: true,
      windowKeys: [],
      windowAccess: {},
      processIds: [],
      reportIds: [],
      taskTypePermissions: [],
    };
    setActiveId(role.id);
    setDraft(role);
  }

  function setWindowLevel(key: string, level: WindowAccessLevel | null) {
    if (!record) return;
    applyWindowAccess(setWindowAccessLevel(record.windowAccess, key, level));
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
    await upsertRole(normalizeRoleWindowAccess(record));
    setDraft(null);
  }

  const Shell = variant === "system" ? SystemShell : AppShell;

  return (
    <Shell
      title="Roles"
      subtitle="Roles control which windows and processes a user can see when signed in with that role. Set Read or Write per window or tab."
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

              {record && isAdminRole(record) ? (
                <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                  AbilityAPP Admin always receives Write on every window, process, and report in the catalog — including
                  modules added in app updates. Saving this role refreshes the full access list.
                </p>
              ) : null}

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-slate-900">Windows / functions</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Pick access per module tile. Tabs appear inside the card when the module is on. Read is view-only;
                  Write allows saves and edits.
                </p>
                <div className="mb-4 flex flex-wrap gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300" /> Off — hidden
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" /> Read — view only
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#d4147a]" /> Write — can edit
                  </span>
                </div>
                {[...windowsByGroup.entries()].map(([group, items]) => {
                  const topLevel = items.filter((w) => !w.parentWindowKey);
                  return (
                    <div key={group} className="mb-6 last:mb-0">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {topLevel.map((w) => {
                          const childWindows = appChildWindows(w.key).filter(
                            (child) => !HOME_PANEL_KEYS.includes(child.key)
                          );
                          const parentLevel = windowAccessLevel(record.windowAccess, w.key);
                          return (
                            <ModuleAccessCard
                              key={w.key}
                              label={w.label}
                              level={parentLevel}
                              onChange={(level) => setWindowLevel(w.key, level)}
                            >
                              {childWindows.map((child) => (
                                <TabAccessChip
                                  key={child.key}
                                  label={child.label}
                                  disabled={!record.windowAccess[w.key]}
                                  level={windowAccessLevel(record.windowAccess, child.key)}
                                  onChange={(level) => setWindowLevel(child.key, level)}
                                />
                              ))}
                            </ModuleAccessCard>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>

              {record.windowAccess.home ? (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Home dashboard panels</h2>
                  <p className="mb-4 text-xs text-slate-500">
                    Home panels are read-only. Turn a panel off to hide it from Home for this role.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {homePanelsForRoleEditor(record.windowKeys).map((panel) => {
                      const moduleMissing = Boolean(
                        panel.requiresWindowKey && !record.windowAccess[panel.requiresWindowKey]
                      );
                      const enabled = Boolean(record.windowAccess[panel.key]);
                      return (
                        <HomePanelTile
                          key={panel.key}
                          label={panel.label}
                          description={panel.description}
                          enabled={enabled}
                          disabled={moduleMissing}
                          moduleMissing={moduleMissing}
                          requiresWindowKey={panel.requiresWindowKey}
                          onToggle={() => setWindowLevel(panel.key, enabled ? null : "read")}
                        />
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Processes</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Assigned processes are available as actions (e.g. Convert to client) for this role only. Requires
                  write access on the related module.
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
