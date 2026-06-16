"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import { useTaskTypes } from "@/lib/task-type-store";
import { incidentStatusOptions, incidentSeverityOptions } from "@/lib/incident";
import {
  newTaskAutomationId,
  normalizeTaskAutomation,
  sortTaskAutomations,
  TASK_AUTOMATION_DEDUPE_OPTIONS,
  TASK_AUTOMATION_TEMPLATE_PLACEHOLDERS,
  TASK_AUTOMATION_TRIGGER_OPTIONS,
  type TaskAutomationRecord,
  type TaskAutomationTriggerEvent,
} from "@/lib/task-automation";
import {
  buildAutomationTemplateContext,
  evaluateIncidentAutomations,
  renderAutomationTemplate,
} from "@/lib/task-automation/engine";
import { incidentEventsFromSave } from "@/lib/task-automation/incident-triggers";
import { taskPriorityOptions } from "@/lib/task";

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

export function TaskAutomationsAdminView() {
  const { roles, canWindow } = useAuth();
  const { taskAutomations, upsertTaskAutomation, deleteTaskAutomation, incidents, tasks } = useData();
  const { organization } = useOrganization();
  const { taskTypes, getTaskTypeName } = useTaskTypes();
  const hasAccess = canWindow("admin-task-automations") || canWindow("admin-task-management");

  const sorted = useMemo(() => sortTaskAutomations(taskAutomations), [taskAutomations]);
  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [draft, setDraft] = useState<TaskAutomationRecord | null>(null);
  const [previewIncidentId, setPreviewIncidentId] = useState("inc-1000003");
  const [statusFilter, setStatusFilter] = useState("");

  const record = draft ?? sorted.find((r) => r.id === activeId) ?? null;

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
    }).drafts;
  }, [record, previewIncident, tasks, organization.incidentInvestigationSlaDays]);

  if (!hasAccess) {
    return (
      <AppShell title="Task automations" audit={{ moduleLabel: "Task automation administration" }}>
        <p className="text-sm text-slate-600">
          You do not have access to task automation administration. Ask an administrator to grant the Task automations window for your role.
        </p>
      </AppShell>
    );
  }

  function openRule(id: string) {
    const rule = sorted.find((r) => r.id === id);
    if (!rule) return;
    setActiveId(id);
    setDraft({ ...rule, conditions: { ...rule.conditions } });
  }

  function addRule() {
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
      assigneeRoleId: roles[0]?.id ?? "role-admin",
      dedupePolicy: "one_open_per_entity",
      sortOrder: (sorted.at(-1)?.sortOrder ?? 0) + 10,
    });
    setActiveId(next.id);
    setDraft(next);
  }

  function saveRule() {
    if (!record?.name.trim()) return;
    upsertTaskAutomation(
      normalizeTaskAutomation({
        ...record,
        name: record.name.trim(),
        titleTemplate: record.titleTemplate.trim(),
        descriptionTemplate: record.descriptionTemplate.trim(),
      })
    );
    setDraft(null);
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
  }

  function patchConditions(patch: Partial<TaskAutomationRecord["conditions"]>) {
    if (!record) return;
    setDraft({ ...record, conditions: { ...record.conditions, ...patch } });
  }

  const statusIn = record?.conditions.statusIn ?? [];
  const severityIn = record?.conditions.severityIn ?? [];

  return (
    <AppShell
      title="Task automations"
      subtitle="When something happens in the system, create a task for a role — your in-app alert channel."
      audit={{ moduleLabel: "Task automation administration" }}
    >
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
          <ul className="space-y-1">
            {sorted.map((rule) => (
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
                    {rule.active ? "Active" : "Inactive"} · {rule.triggerEvent.replace("incident.", "")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {record ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Rule configuration</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
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
                    className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
                  >
                    Save rule
                  </button>
                </div>
              </div>

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
                <Field label="Trigger">
                  <select
                    className={inputClass}
                    value={record.triggerEvent}
                    onChange={(e) => patch({ triggerEvent: e.target.value as TaskAutomationTriggerEvent })}
                  >
                    {TASK_AUTOMATION_TRIGGER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {TASK_AUTOMATION_TRIGGER_OPTIONS.find((o) => o.value === record.triggerEvent)?.hint}
                  </p>
                </Field>
                <Field label="Assign to role">
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
                    {taskPriorityOptions.map((p) => (
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
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Select a rule or add a new one.
          </div>
        )}
      </div>
    </AppShell>
  );
}
