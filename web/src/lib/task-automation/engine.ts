import type { IncidentRecord } from "@/lib/incident";
import { formatDisplayDateTime } from "@/lib/incident";
import type { TaskRecord } from "@/lib/task";
import {
  automationDedupeKey,
  indexAutomationsByTrigger,
  normalizeTaskAutomation,
  TASK_AUTOMATION_SCHEDULED_BATCH_LIMIT,
  type TaskAutomationConditions,
  type TaskAutomationRecord,
  type TaskAutomationTriggerEvent,
} from "@/lib/task-automation";
import {
  buildAutomationDedupeIndex,
  registerAutomationDedupeKey,
  shouldSkipAutomationTask,
  type AutomationDedupeIndex,
} from "@/lib/task-automation/dedupe-index";
import {
  incidentDaysOpen,
  incidentFieldChanges,
  scheduledIncidentCandidates,
  type IncidentAutomationEvent,
} from "@/lib/task-automation/incident-triggers";

export type AutomationTemplateContext = {
  incident: IncidentRecord;
  org: { investigationSlaDays: number };
};

function formatDateField(value: string): string {
  if (!value?.trim()) return "—";
  return formatDisplayDateTime(value) || value.slice(0, 10);
}

export function buildAutomationTemplateContext(
  incident: IncidentRecord,
  investigationSlaDays: number
): AutomationTemplateContext {
  return {
    incident,
    org: { investigationSlaDays },
  };
}

const TEMPLATE_VARS: Record<string, (ctx: AutomationTemplateContext) => string> = {
  "incident.documentNo": (ctx) => ctx.incident.documentNo || "—",
  "incident.title": (ctx) => ctx.incident.title?.trim() || "Untitled",
  "incident.status": (ctx) => ctx.incident.status,
  "incident.severity": (ctx) => ctx.incident.severity,
  "incident.reportDeadlineAt": (ctx) => formatDateField(ctx.incident.reportDeadlineAt),
  "incident.daysOpen": (ctx) => String(incidentDaysOpen(ctx.incident)),
  "org.investigationSlaDays": (ctx) => String(ctx.org.investigationSlaDays),
};

export function renderAutomationTemplate(template: string, ctx: AutomationTemplateContext): string {
  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, key: string) => {
    const resolver = TEMPLATE_VARS[key];
    return resolver ? resolver(ctx) : match;
  });
}

function matchesConditions(
  conditions: TaskAutomationConditions,
  incident: IncidentRecord,
  changedFields?: string[]
): boolean {
  if (conditions.isReportable !== undefined && incident.isReportable !== conditions.isReportable) {
    return false;
  }
  if (conditions.statusIn?.length && !conditions.statusIn.includes(incident.status)) {
    return false;
  }
  if (conditions.severityIn?.length && !conditions.severityIn.includes(incident.severity)) {
    return false;
  }
  if (conditions.changedFields?.length) {
    if (!changedFields?.length) return false;
    if (!conditions.changedFields.some((f) => changedFields.includes(f))) return false;
  }
  return true;
}

function resolveDueDate(
  rule: TaskAutomationRecord,
  ctx: AutomationTemplateContext,
  now = new Date()
): string {
  if (rule.dueFromField === "reportDeadlineAt" && ctx.incident.reportDeadlineAt) {
    return ctx.incident.reportDeadlineAt.slice(0, 10);
  }

  const due = new Date(now);
  if (rule.dueOffsetHours != null && rule.dueOffsetHours > 0) {
    due.setHours(due.getHours() + rule.dueOffsetHours);
  } else if (rule.dueOffsetDays != null) {
    due.setDate(due.getDate() + rule.dueOffsetDays);
  }

  return due.toISOString().slice(0, 10);
}

export type AutomationTaskDraft = Omit<TaskRecord, "id" | "documentNo" | "updates"> & {
  automationRuleId: string;
  automationDedupeKey: string;
};

function buildTaskDraft(
  rule: TaskAutomationRecord,
  ctx: AutomationTemplateContext
): AutomationTaskDraft {
  const entityLabel = `${ctx.incident.documentNo} — ${ctx.incident.title?.trim() || "Incident"}`;
  const dedupeKey = automationDedupeKey(rule.id, "incident", ctx.incident.id);

  return {
    title: renderAutomationTemplate(rule.titleTemplate, ctx),
    description: renderAutomationTemplate(rule.descriptionTemplate, ctx),
    status: "Open",
    taskTypeId: rule.taskTypeId,
    priority: rule.priority,
    dueDate: resolveDueDate(rule, ctx),
    assignmentType: "role",
    assigneeUserId: "",
    assigneeRoleId: rule.assigneeRoleId,
    entityType: "incident",
    entityId: ctx.incident.id,
    entityLabel,
    createdByUserId: "",
    createdBy: `System (${rule.name})`,
    updatedBy: `System (${rule.name})`,
    completedBy: "",
    completedAt: "",
    resolutionNotes: "",
    automationRuleId: rule.id,
    automationDedupeKey: dedupeKey,
  };
}

export type EvaluateAutomationsResult = {
  drafts: AutomationTaskDraft[];
  skipped: number;
};

function evaluateRulesForEvent(
  rules: TaskAutomationRecord[],
  event: IncidentAutomationEvent,
  ctx: AutomationTemplateContext,
  dedupeIndex: AutomationDedupeIndex,
  changedFields?: string[]
): { drafts: AutomationTaskDraft[]; skipped: number } {
  const drafts: AutomationTaskDraft[] = [];
  let skipped = 0;

  for (const raw of rules) {
    const rule = normalizeTaskAutomation(raw);
    if (!matchesConditions(rule.conditions, event.incident, changedFields)) continue;

    const draft = buildTaskDraft(rule, ctx);
    if (shouldSkipAutomationTask(dedupeIndex, draft.automationDedupeKey, rule.dedupePolicy)) {
      skipped += 1;
      continue;
    }

    drafts.push(draft);
    registerAutomationDedupeKey(dedupeIndex, draft.automationDedupeKey);
  }

  return { drafts, skipped };
}

export function evaluateIncidentAutomations(input: {
  events: IncidentAutomationEvent[];
  rules: TaskAutomationRecord[];
  tasks: TaskRecord[];
  investigationSlaDays: number;
}): EvaluateAutomationsResult {
  const triggerIndex = indexAutomationsByTrigger(input.rules);
  const dedupeIndex = buildAutomationDedupeIndex(input.tasks);
  const drafts: AutomationTaskDraft[] = [];
  let skipped = 0;

  for (const event of input.events) {
    const trigger = event.type as TaskAutomationTriggerEvent;
    const rules = triggerIndex.get(trigger) ?? [];
    if (!rules.length) continue;

    const ctx = buildAutomationTemplateContext(event.incident, input.investigationSlaDays);
    const changedFields =
      event.type === "incident.updated" && event.before
        ? incidentFieldChanges(event.before, event.incident)
        : undefined;

    const result = evaluateRulesForEvent(rules, event, ctx, dedupeIndex, changedFields);
    drafts.push(...result.drafts);
    skipped += result.skipped;
  }

  return { drafts, skipped };
}

export function evaluateScheduledIncidentAutomations(input: {
  incidents: IncidentRecord[];
  rules: TaskAutomationRecord[];
  tasks: TaskRecord[];
  investigationSlaDays: number;
  batchLimit?: number;
}): EvaluateAutomationsResult {
  const events = scheduledIncidentCandidates(input.incidents, input.investigationSlaDays);
  const limit = input.batchLimit ?? TASK_AUTOMATION_SCHEDULED_BATCH_LIMIT;
  const limited = events.length > limit ? events.slice(0, limit) : events;

  return evaluateIncidentAutomations({
    events: limited,
    rules: input.rules,
    tasks: input.tasks,
    investigationSlaDays: input.investigationSlaDays,
  });
}
