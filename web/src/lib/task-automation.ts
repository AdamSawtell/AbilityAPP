/**
 * Task automation — configurable rules that create tasks on system events.
 * Phase 1: incidents module; role assignment; seeded rules (no admin UI yet).
 */

export type TaskAutomationModule = "incidents";

export type TaskAutomationTriggerEvent =
  | "incident.created"
  | "incident.updated"
  | "incident.reportable_set"
  | "incident.status_changed"
  | "incident.ndis_overdue"
  | "incident.investigation_overdue";

export type TaskAutomationDedupePolicy = "one_open_per_entity" | "once_ever" | "none";

export type TaskAutomationConditions = {
  isReportable?: boolean;
  statusIn?: string[];
  severityIn?: string[];
  /** When set on update events, rule fires only if one of these fields changed. */
  changedFields?: string[];
};

export type TaskAutomationRecord = {
  id: string;
  name: string;
  active: boolean;
  module: TaskAutomationModule;
  triggerEvent: TaskAutomationTriggerEvent;
  conditions: TaskAutomationConditions;
  taskTypeId: string;
  titleTemplate: string;
  descriptionTemplate: string;
  priority: "Low" | "Normal" | "High";
  dueOffsetHours: number | null;
  dueOffsetDays: number | null;
  dueFromField: string | null;
  assigneeRoleId: string;
  dedupePolicy: TaskAutomationDedupePolicy;
  sortOrder: number;
};

export const TASK_AUTOMATION_SCHEDULED_THROTTLE_MS = 24 * 60 * 60 * 1000;
export const TASK_AUTOMATION_SCHEDULED_BATCH_LIMIT = 50;
export const TASK_AUTOMATION_SCHEDULED_STORAGE_KEY = "abilityapp-task-automation-scheduled-at";

export function normalizeTaskAutomation(raw: TaskAutomationRecord): TaskAutomationRecord {
  return {
    ...raw,
    conditions: raw.conditions ?? {},
    priority: raw.priority ?? "Normal",
    dedupePolicy: raw.dedupePolicy ?? "one_open_per_entity",
    dueOffsetHours: raw.dueOffsetHours ?? null,
    dueOffsetDays: raw.dueOffsetDays ?? null,
    dueFromField: raw.dueFromField?.trim() || null,
  };
}

export const initialTaskAutomations: TaskAutomationRecord[] = [
  {
    id: "tar-incident-reportable-review",
    name: "Reportable incident — manager review",
    active: true,
    module: "incidents",
    triggerEvent: "incident.reportable_set",
    conditions: { isReportable: true },
    taskTypeId: "tt-review",
    titleTemplate: "Review reportable incident {{incident.documentNo}}",
    descriptionTemplate:
      "A reportable NDIS incident requires manager review. {{incident.title}} — severity {{incident.severity}}, status {{incident.status}}. NDIS deadline: {{incident.reportDeadlineAt}}.",
    priority: "High",
    dueOffsetHours: 24,
    dueOffsetDays: null,
    dueFromField: null,
    assigneeRoleId: "role-admin",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 10,
  },
  {
    id: "tar-incident-ndis-overdue",
    name: "NDIS Commission notification overdue",
    active: true,
    module: "incidents",
    triggerEvent: "incident.ndis_overdue",
    conditions: {},
    taskTypeId: "tt-check",
    titleTemplate: "NDIS notification overdue — {{incident.documentNo}}",
    descriptionTemplate:
      "Reportable incident {{incident.documentNo}} ({{incident.title}}) is past the NDIS Commission notification deadline ({{incident.reportDeadlineAt}}). Complete notification and record the reference on the incident.",
    priority: "High",
    dueOffsetHours: null,
    dueOffsetDays: 0,
    dueFromField: null,
    assigneeRoleId: "role-admin",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 20,
  },
  {
    id: "tar-incident-investigation-sla",
    name: "Investigation SLA breached",
    active: true,
    module: "incidents",
    triggerEvent: "incident.investigation_overdue",
    conditions: {},
    taskTypeId: "tt-review",
    titleTemplate: "Investigation overdue — {{incident.documentNo}}",
    descriptionTemplate:
      "Incident {{incident.documentNo}} ({{incident.title}}) has been open {{incident.daysOpen}} days, exceeding the organisation investigation SLA of {{org.investigationSlaDays}} days. Review investigation progress and update the incident record.",
    priority: "Normal",
    dueOffsetHours: null,
    dueOffsetDays: 3,
    dueFromField: null,
    assigneeRoleId: "role-coordinator",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 30,
  },
];

export function indexAutomationsByTrigger(
  rules: TaskAutomationRecord[]
): Map<TaskAutomationTriggerEvent, TaskAutomationRecord[]> {
  const map = new Map<TaskAutomationTriggerEvent, TaskAutomationRecord[]>();
  for (const rule of rules) {
    if (!rule.active) continue;
    const list = map.get(rule.triggerEvent) ?? [];
    list.push(rule);
    map.set(rule.triggerEvent, list);
  }
  for (const [key, list] of map) {
    map.set(
      key,
      [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    );
  }
  return map;
}

export function automationDedupeKey(ruleId: string, entityType: string, entityId: string): string {
  return `rule:${ruleId}:${entityType}:${entityId}`;
}

let automationSeq = 100;

export function newTaskAutomationId(): string {
  automationSeq += 1;
  return `tar-${Date.now()}-${automationSeq}`;
}

export const TASK_AUTOMATION_TRIGGER_OPTIONS: { value: TaskAutomationTriggerEvent; label: string; hint: string }[] = [
  { value: "incident.created", label: "Incident created", hint: "When a new incident is saved" },
  { value: "incident.updated", label: "Incident updated", hint: "Any incident save (use conditions to narrow)" },
  { value: "incident.reportable_set", label: "Marked reportable", hint: "When isReportable becomes true" },
  { value: "incident.status_changed", label: "Status changed", hint: "When incident status changes" },
  { value: "incident.ndis_overdue", label: "NDIS notification overdue", hint: "Scheduled — reportable, not notified, past deadline" },
  {
    value: "incident.investigation_overdue",
    label: "Investigation SLA breached",
    hint: "Scheduled — open past organisation investigation SLA",
  },
];

export const TASK_AUTOMATION_DEDUPE_OPTIONS: { value: TaskAutomationDedupePolicy; label: string }[] = [
  { value: "one_open_per_entity", label: "One open task per record" },
  { value: "once_ever", label: "Once ever per record" },
  { value: "none", label: "No deduplication" },
];

export const TASK_AUTOMATION_TEMPLATE_PLACEHOLDERS = [
  "{{incident.documentNo}}",
  "{{incident.title}}",
  "{{incident.status}}",
  "{{incident.severity}}",
  "{{incident.reportDeadlineAt}}",
  "{{incident.daysOpen}}",
  "{{org.investigationSlaDays}}",
];

export function sortTaskAutomations(rules: TaskAutomationRecord[]): TaskAutomationRecord[] {
  return [...rules].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
