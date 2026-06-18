"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SystemShell } from "@/components/system/system-shell";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import { useTaskTypes } from "@/lib/task-type-store";
import { incidentStatusOptions, incidentSeverityOptions } from "@/lib/incident";
import {
  groupTaskAutomationsByModule,
  isModuleEngineLive,
  newTaskAutomationId,
  normalizeTaskAutomation,
  sortTaskAutomations,
  TASK_AUTOMATION_ASSIGNEE_MODES,
  TASK_AUTOMATION_DEDUPE_OPTIONS,
  TASK_AUTOMATION_MODULES,
  TASK_AUTOMATION_TEMPLATE_PLACEHOLDERS,
  taskAutomationModuleLabel,
  triggersForModule,
  type TaskAutomationAssigneeMode,
  type TaskAutomationModule,
  type TaskAutomationRecord,
  type TaskAutomationTriggerEvent,
} from "@/lib/task-automation";
import {
  buildAutomationTemplateContext,
  evaluateIncidentAutomations,
  renderAutomationTemplate,
} from "@/lib/task-automation/engine";
import { incidentEventsFromSave } from "@/lib/task-automation/incident-triggers";
import { useReferenceData } from "@/lib/config-store";
import { useOrgStructure } from "@/lib/org-structure-store";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function TaskAutomationsAdminView({ variant = "workspace" }: { variant?: "workspace" | "system" }) {
  const { roles, users, canWindow } = useAuth();
  const { taskAutomations, upsertTaskAutomation, deleteTaskAutomation, incidents, tasks, employees } = useData();
  const { organization } = useOrganization();
  const { taskTypes, getTaskTypeName } = useTaskTypes();
  const { getOptions } = useReferenceData();
  const { positions, assignments } = useOrgStructure();
  const hasAccess = canWindow("admin-task-automations") || canWindow("admin-task-management");

  const sorted = useMemo(() => sortTaskAutomations(taskAutomations), [taskAutomations]);
  const grouped = useMemo(() => groupTaskAutomationsByModule(taskAutomations), [taskAutomations]);
  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [draft, setDraft] = useState<TaskAutomationRecord | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");
  const [previewIncidentId, setPreviewIncidentId] = useState("inc-1000003");
  const [statusFilter, setStatusFilter] = useState("");

  const record = draft ?? sorted.find((r) => r.id === activeId) ?? null;
  const persistedRecord = sorted.find((r) => r.id === activeId) ?? null;
  const isDirty = Boolean(
    draft && (!persistedRecord || JSON.stringify(draft) !== JSON.stringify(persistedRecord))
  );

  const previewIncident = useMemo(
    () => incidents.find((i) => i.id === previewIncidentId) ?? incidents[0],
    [incidents, previewIncidentId]
  );

  const preview = useMemo(() => {
    if (!record || !previewIncident) return null;
    const ctx = buildAutomationTemplateContext(previewIncident, organization.incidentInvestigationSlaDays);
    return {
      title: renderAutomationTemplate(record.titleTemplate, ctx),
      description: renderAutomationTemplate(record.descriptionTemplate, ctx),
    };
  }, [record, previewIncident, organization.incidentInvestigationSlaDays]);

  const dryRun = useMemo(() => {
    if (!record || !previewIncident) return [];
    const events =
      record.triggerEvent === "incident.ndis_overdue"
        ? [{ type: "incident.ndis_overdue" as const, incident: previewIncident }]
        : record.triggerEvent === "incident.investigation_overdue"
          ? [{ type: "incident.investigation_overdue" as const, incident: previewIncident }]
          : incidentEventsFromSave(previewIncident);

    const matching = events.filter((e) => e.type === record.triggerEvent);
    if (!matching.length) return [];

    return evaluateIncidentAutomations({
      events: matching,
      rules: [record],
      tasks,
      investigationSlaDays: organization.incidentInvestigationSlaDays,
      org: {
        positions,
        assignments,
        employees,
        users: users.map((u) => ({ id: u.id, employeeBpId: u.employeeBpId })),
      },
    }).drafts;
  }, [record, previewIncident, tasks, organization.incidentInvestigationSlaDays, positions, assignments, employees, users]);

  const Shell = variant === "system" ? SystemShell : AppShell;
  const guideHref = variant === "system" ? "/system/guides/task-automations" : "/help/task-automations";

  if (!hasAccess) {
    return (
      <Shell title="Task automations" audit={{ moduleLabel: "Task automation administration" }}>
        <p className="text-sm text-slate-600">
          You do not have access to task automation administration. Ask an administrator to grant the Task automations window for your role.
        </p>
      </Shell>
    );
  }

  function canLeaveDraft() {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }

  function openRule(id: string) {
    if (!canLeaveDraft()) return;
    const rule = sorted.find((r) => r.id === id);
    if (!rule) return;
    setActiveId(id);
    setDraft({ ...rule, conditions: { ...rule.conditions } });
    setSaveState("idle");
  }

  function addRule() {
    if (!canLeaveDraft()) return;
    const next: TaskAutomationRecord = normalizeTaskAutomation({
      id: newTaskAutomationId(),
      name: "New automation rule",
      active: true,
      module: "incidents",
      triggerEvent: "incident.reportable_set",
      conditions: { isReportable: true },
      taskTypeId: taskTypes[0]?.id ?? "tt-review",
      titleTemplate: "Review incident {{incident.documentNo}}",
      descriptionTemplate: "{{incident.title}} — {{incident.status}}",
      priority: "Normal",
      dueOffsetHours: 24,
      dueOffsetDays: null,
      dueFromField: null,
      assigneeMode: "role",
      assigneePositionId: "",
      assigneeRoleId: roles[0]?.id ?? "role-admin",
      dedupePolicy: "one_open_per_entity",
      sortOrder: (sorted.at(-1)?.sortOrder ?? 0) + 10,
    });
    setActiveId(next.id);
    setDraft(next);
    setSaveState("idle");
  }

  async function saveRule() {
    if (!record?.name.trim()) return;
    setSaveState("saving");
    setSaveError("");
    try {
      await upsertTaskAutomation(
        normalizeTaskAutomation({
          ...record,
          name: record.name.trim(),
          titleTemplate: record.titleTemplate.trim(),
          descriptionTemplate: record.descriptionTemplate.trim(),
        })
      );
      setDraft(null);
      setSaveState("saved");
    } catch {
      setSaveState("idle");
      setSaveError("Could not save rule. Check your connection and try again.");
    }
  }

  function removeRule() {
    if (!record || !window.confirm(`Delete automation rule "${record.name}"?`)) return;
    deleteTaskAutomation(record.id);
    setDraft(null);
    setActiveId(sorted.find((r) => r.id !== record.id)?.id ?? null);
  }

  function patch(partial: Partial<TaskAutomationRecord>) {
    if (!record) return;
    setDraft({ ...record, ...partial });
    setSaveState("idle");
  }

  function patchConditions(patch: Partial<TaskAutomationRecord["conditions"]>) {
    if (!record) return;
    setDraft({ ...record, conditions: { ...record.conditions, ...patch } });
    setSaveState("idle");
  }

  const statusIn = record?.conditions.statusIn ?? [];
  const severityIn = record?.conditions.severityIn ?? [];

  function changeModule(module: TaskAutomationModule) {
    if (!record) return;
    const moduleTriggers = triggersForModule(module);
    const triggerEvent = moduleTriggers[0]?.value ?? record.triggerEvent;
    setDraft(
      normalizeTaskAutomation({
        ...record,
        module,
        triggerEvent,
        conditions: module === "incidents" ? record.conditions : {},
      })
    );
    setSaveState("idle");
  }

  const moduleTriggers = record ? triggersForModule(record.module) : [];
  const triggerHint = moduleTriggers.find((o) => o.value === record?.triggerEvent)?.hint;
  const engineLive = record ? isModuleEngineLive(record.module) : true;

  return (
    <Shell
      title="Task automations"
      subtitle="When something happens in the system, create a task for a role; your in-app alert channel."
      breadcrumbs={
        variant === "system"
          ? [
              { label: "System", href: "/system" },
              { label: "Admin", href: "/system/admin/roles" },
              { label: "Task automations" },
            ]
          : undefined
      }
      audit={{ moduleLabel: "Task automation administration" }}
    >
      <p className="mb-6 text-sm text-slate-600">
        Configure rules by record type (enquiry, client, location, employee, incident).{" "}
        <Link href={guideHref} className="font-medium text-[#b51266] hover:underline">
          Read the full how-to guide
        </Link>
      </p>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Rules</h2>
            <button
              type="button"
              onClick={addRule}
              className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b51266]"
            >
              Add rule
            </button>
          </div>
          <div className="mb-3 space-y-1">
            {grouped.map((group) => (
              <div key={group.module}>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                  {!group.engineLive ? (
                    <span className="ml-1 font-normal normal-case text-amber-600">(configure only)</span>
                  ) : null}
                </p>
                <ul className="mb-3 space-y-1">
                  {group.rules.map((rule) => (
                    <li key={rule.id}>
                      <button
                        type="button"
                        onClick={() => openRule(rule.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          rule.id === activeId
                            ? "bg-[#fdf2f8] font-medium text-[#b51266] ring-1 ring-[#f9a8d4]/60"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block truncate">{rule.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {rule.active ? "Active" : "Inactive"} · {rule.triggerEvent.split(".").slice(1).join(" ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {record ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Rule configuration</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canLeaveDraft()) return;
                      setDraft(null);
                      setSaveState("idle");
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={removeRule}
                    className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={saveRule}
                    className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
                    disabled={!isDirty || saveState === "saving"}
                  >
                    {saveState === "saving" ? "Saving..." : "Save rule"}
                  </button>
                </div>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                {saveState === "saved" ? "Saved." : isDirty ? "Unsaved changes." : "No changes."}
              </p>
              {saveError ? (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {saveError}
                </p>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input
                    className={inputClass}
                    value={record.name}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </Field>
                <Field label="Status">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={record.active}
                      onChange={(e) => patch({ active: e.target.checked })}
                    />
                    Active
                  </label>
                </Field>
                <Field label="Rule type">
                  <select
                    className={inputClass}
                    value={record.module}
                    onChange={(e) => changeModule(e.target.value as TaskAutomationModule)}
                  >
                    {TASK_AUTOMATION_MODULES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {TASK_AUTOMATION_MODULES.find((m) => m.value === record.module)?.description}
                    {!engineLive ? " Rules for this type can be saved now; automatic task creation is not live yet." : null}
                  </p>
                </Field>
                <Field label="Trigger">
                  <select
                    className={inputClass}
                    value={record.triggerEvent}
                    onChange={(e) => patch({ triggerEvent: e.target.value as TaskAutomationTriggerEvent })}
                  >
                    {moduleTriggers.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {triggerHint ? <p className="mt-1 text-xs text-slate-500">{triggerHint}</p> : null}
                </Field>
                <Field label="Assign to">
                  <select
                    className={inputClass}
                    value={record.assigneeMode}
                    onChange={(e) =>
                      patch({ assigneeMode: e.target.value as TaskAutomationAssigneeMode })
                    }
                  >
                    {TASK_AUTOMATION_ASSIGNEE_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {TASK_AUTOMATION_ASSIGNEE_MODES.find((m) => m.value === record.assigneeMode)?.hint}
                  </p>
                </Field>
                {record.assigneeMode === "org_position" ? (
                  <Field label="Org position">
                    <select
                      className={inputClass}
                      value={record.assigneePositionId}
                      onChange={(e) => patch({ assigneePositionId: e.target.value })}
                    >
                      <option value="">— Select position —</option>
                      {positions
                        .filter((p) => p.id !== "pos-org-root")
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                            {p.businessArea ? ` · ${p.businessArea}` : ""}
                          </option>
                        ))}
                    </select>
                  </Field>
                ) : null}
                {record.assigneeMode !== "role" ? (
                  <Field
                    label="Fallback role"
                    hint="Used when no login user is linked to the resolved org holder."
                  >
                    <select
                      className={inputClass}
                      value={record.assigneeRoleId}
                      onChange={(e) => patch({ assigneeRoleId: e.target.value })}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="Security role">
                    <select
                      className={inputClass}
                      value={record.assigneeRoleId}
                      onChange={(e) => patch({ assigneeRoleId: e.target.value })}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Task type">
                  <select
                    className={inputClass}
                    value={record.taskTypeId}
                    onChange={(e) => patch({ taskTypeId: e.target.value })}
                  >
                    {taskTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className={inputClass}
                    value={record.priority}
                    onChange={(e) => patch({ priority: e.target.value as TaskAutomationRecord["priority"] })}
                  >
                    {getOptions("taskPriority").map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Due in (hours)" hint="Leave empty to use days offset instead.">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={record.dueOffsetHours ?? ""}
                    onChange={(e) =>
                      patch({
                        dueOffsetHours: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Due in (days)" hint="Used when hours is empty.">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={record.dueOffsetDays ?? ""}
                    onChange={(e) =>
                      patch({
                        dueOffsetDays: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Dedupe policy">
                  <select
                    className={inputClass}
                    value={record.dedupePolicy}
                    onChange={(e) =>
                      patch({ dedupePolicy: e.target.value as TaskAutomationRecord["dedupePolicy"] })
                    }
                  >
                    {TASK_AUTOMATION_DEDUPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sort order">
                  <input
                    type="number"
                    className={inputClass}
                    value={record.sortOrder}
                    onChange={(e) => patch({ sortOrder: Number(e.target.value) || 0 })}
                  />
                </Field>
              </div>

              {record.module === "incidents" ? (
              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2">
                <Field label="Conditions — reportable only">
                  <select
                    className={inputClass}
                    value={
                      record.conditions.isReportable === undefined
                        ? ""
                        : record.conditions.isReportable
                          ? "yes"
                          : "no"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      patchConditions({
                        isReportable: v === "" ? undefined : v === "yes",
                      });
                    }}
                  >
                    <option value="">Any</option>
                    <option value="yes">Reportable only</option>
                    <option value="no">Not reportable</option>
                  </select>
                </Field>
                <Field label="Conditions — status filter" hint="Comma-separated or pick one below.">
                  <input
                    className={inputClass}
                    value={statusIn.join(", ")}
                    onChange={(e) =>
                      patchConditions({
                        statusIn: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <select
                    className={`${inputClass} mt-2`}
                    value={statusFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStatusFilter(v);
                      if (v) patchConditions({ statusIn: [v] });
                    }}
                  >
                    <option value="">Quick pick status…</option>
                    {incidentStatusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Conditions — severity">
                    <div className="flex flex-wrap gap-3">
                      {incidentSeverityOptions.map((sev) => (
                        <label key={sev} className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={severityIn.includes(sev)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...severityIn, sev]
                                : severityIn.filter((s) => s !== sev);
                              patchConditions({ severityIn: next.length ? next : undefined });
                            }}
                          />
                          {sev}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
              ) : null}

              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6">
                <Field
                  label="Title template"
                  hint={`Placeholders: ${TASK_AUTOMATION_TEMPLATE_PLACEHOLDERS.join(", ")}`}
                >
                  <input
                    className={inputClass}
                    value={record.titleTemplate}
                    onChange={(e) => patch({ titleTemplate: e.target.value })}
                  />
                </Field>
                <Field label="Description template">
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={record.descriptionTemplate}
                    onChange={(e) => patch({ descriptionTemplate: e.target.value })}
                  />
                </Field>
              </div>
            </section>

            {record.module === "incidents" && engineLive ? (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Preview</h2>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <Field label="Sample incident">
                  <select
                    className={inputClass}
                    value={previewIncident?.id ?? ""}
                    onChange={(e) => setPreviewIncidentId(e.target.value)}
                  >
                    {incidents.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.documentNo} — {i.title || "Untitled"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Task type label">{getTaskTypeName(record.taskTypeId)}</Field>
              </div>

              {preview ? (
                <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-900">{preview.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{preview.description}</p>
                </div>
              ) : null}

              <p className="mt-4 text-sm text-slate-600">
                {dryRun.length
                  ? `Dry run: would create ${dryRun.length} task(s) for this incident with current trigger and conditions.`
                  : "Dry run: this rule would not fire for the selected incident (trigger or conditions not met, or dedupe would skip)."}
              </p>
            </section>
            ) : record.module !== "incidents" || !engineLive ? (
              <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-6 shadow-sm ring-1 ring-amber-200/60">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">Preview not available</h2>
                <p className="text-sm text-slate-600">
                  Live preview and dry run are available for <strong>Incident</strong> rules while that rule type is
                  active in the engine. You can still save {taskAutomationModuleLabel(record.module)} rules to prepare
                  for a future release.
                </p>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Select a rule or add a new one.
          </div>
        )}
      </div>
    </Shell>
  );
}
