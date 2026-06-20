import type { ClientRecord } from "@/lib/client";
import type { EmployeeCredentialRow, EmployeeLeaveRequestRow, EmployeeRecord } from "@/lib/employee";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { IncidentRecord } from "@/lib/incident";
import { formatDisplayDateTime } from "@/lib/incident";
import type { LocationRecord } from "@/lib/location";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import type { TaskRecord } from "@/lib/task";
import {
  automationDedupeKey,
  indexAutomationsByTrigger,
  isModuleEngineLive,
  normalizeTaskAutomation,
  TASK_AUTOMATION_SCHEDULED_BATCH_LIMIT,
  type TaskAutomationConditions,
  type TaskAutomationRecord,
} from "@/lib/task-automation";
import {
  buildAutomationDedupeIndex,
  registerAutomationDedupeKey,
  shouldSkipAutomationTask,
  type AutomationDedupeIndex,
} from "@/lib/task-automation/dedupe-index";
import type { AutomationEvent } from "@/lib/task-automation/events";
import { automationTriggerForEvent } from "@/lib/task-automation/events";
import {
  CREDENTIAL_EXPIRY_WARNING_DAYS,
  scheduledEmployeeCredentialCandidates,
} from "@/lib/task-automation/employee-triggers";
import {
  scheduledServiceAgreementExpiryCandidates,
} from "@/lib/task-automation/service-agreement-triggers";
import {
  incidentDaysOpen,
  incidentFieldChanges,
  scheduledIncidentCandidates,
  type IncidentAutomationEvent,
} from "@/lib/task-automation/incident-triggers";
import { getOrgAutomationContext, type OrgAutomationContext } from "@/lib/org-automation-context";
import { resolveAutomationAssignee } from "@/lib/task-automation/org-assignee";

export type AutomationTemplateContext = {
  incident?: IncidentRecord;
  enquiry?: EnquiryRecord;
  employee?: EmployeeRecord;
  credential?: EmployeeCredentialRow;
  leaveRequest?: EmployeeLeaveRequestRow;
  client?: ClientRecord;
  location?: LocationRecord;
  agreement?: ServiceAgreementRecord;
  agreementDaysUntilFinish?: number;
  alertTitle?: string;
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

function buildTemplateContextFromEvent(
  event: AutomationEvent,
  investigationSlaDays: number
): AutomationTemplateContext {
  const org = { investigationSlaDays };

  switch (event.type) {
    case "incident.created":
    case "incident.updated":
    case "incident.reportable_set":
    case "incident.status_changed":
    case "incident.ndis_overdue":
    case "incident.investigation_overdue":
      return { incident: event.incident, org };
    case "enquiry.created":
    case "enquiry.status_changed":
      return { enquiry: event.enquiry, org };
    case "employee.created":
    case "employee.credential_expiring":
    case "employee.credential_pending_review":
      return {
        employee: event.employee,
        credential:
          event.type === "employee.credential_expiring" || event.type === "employee.credential_pending_review"
            ? event.credential
            : undefined,
        org,
      };
    case "employee.leave_requested":
      return { employee: event.employee, leaveRequest: event.leaveRequest, org };
    case "client.created":
    case "client.updated":
    case "client.alert_added":
      return {
        client: event.client,
        alertTitle: event.type === "client.alert_added" ? event.alertTitle : undefined,
        org,
      };
    case "location.created":
    case "location.alert_added":
      return {
        location: event.location,
        alertTitle: event.type === "location.alert_added" ? event.alertTitle : undefined,
        org,
      };
    case "service-agreement.expiring":
      return {
        agreement: event.agreement,
        client: event.client ?? undefined,
        agreementDaysUntilFinish: event.daysUntilFinish,
        org,
      };
    default:
      return { org };
  }
}

const TEMPLATE_VARS: Record<string, (ctx: AutomationTemplateContext) => string> = {
  "incident.documentNo": (ctx) => ctx.incident?.documentNo || "—",
  "incident.title": (ctx) => ctx.incident?.title?.trim() || "Untitled",
  "incident.status": (ctx) => ctx.incident?.status ?? "—",
  "incident.severity": (ctx) => ctx.incident?.severity ?? "—",
  "incident.reportDeadlineAt": (ctx) => formatDateField(ctx.incident?.reportDeadlineAt ?? ""),
  "incident.daysOpen": (ctx) => String(ctx.incident ? incidentDaysOpen(ctx.incident) : 0),
  "enquiry.documentNo": (ctx) => ctx.enquiry?.documentNo || "—",
  "enquiry.status": (ctx) => ctx.enquiry?.status ?? "—",
  "enquiry.participantName": (ctx) =>
    ctx.enquiry ? `${ctx.enquiry.firstName} ${ctx.enquiry.lastName}`.trim() : "—",
  "employee.name": (ctx) => ctx.employee?.name ?? "—",
  "employee.searchKey": (ctx) => ctx.employee?.searchKey ?? "—",
  "employee.jobTitle": (ctx) => ctx.employee?.jobTitle ?? "—",
  "credential.type": (ctx) => ctx.credential?.credentialType ?? "—",
  "credential.expiryDate": (ctx) => formatDateField(ctx.credential?.expiryDate ?? ""),
  "leave.type": (ctx) => ctx.leaveRequest?.leaveType ?? "—",
  "leave.startDate": (ctx) => formatDateField(ctx.leaveRequest?.startDate ?? ""),
  "leave.endDate": (ctx) => formatDateField(ctx.leaveRequest?.endDate ?? ""),
  "leave.daysRequested": (ctx) => String(ctx.leaveRequest?.daysRequested ?? "—"),
  "client.name": (ctx) => ctx.client?.name ?? "—",
  "client.searchKey": (ctx) => ctx.client?.searchKey ?? "—",
  "alert.title": (ctx) => ctx.alertTitle ?? "—",
  "location.name": (ctx) => ctx.location?.name ?? "—",
  "location.searchKey": (ctx) => ctx.location?.searchKey ?? "—",
  "agreement.searchKey": (ctx) => ctx.agreement?.searchKey ?? "—",
  "agreement.name": (ctx) => ctx.agreement?.name ?? "—",
  "agreement.finishDate": (ctx) => formatDateField(ctx.agreement?.finishDate ?? ""),
  "agreement.daysUntilFinish": (ctx) => String(ctx.agreementDaysUntilFinish ?? "—"),
  "agreement.status": (ctx) => ctx.agreement?.status ?? "—",
  "org.investigationSlaDays": (ctx) => String(ctx.org.investigationSlaDays),
};

export function renderAutomationTemplate(template: string, ctx: AutomationTemplateContext): string {
  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, key: string) => {
    const resolver = TEMPLATE_VARS[key];
    return resolver ? resolver(ctx) : match;
  });
}

function matchesEventConditions(
  event: AutomationEvent,
  conditions: TaskAutomationConditions,
  changedFields?: string[]
): boolean {
  if (event.type.startsWith("incident.")) {
    const incident = (event as import("@/lib/task-automation/incident-triggers").IncidentAutomationEvent).incident;
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

  if (event.type.startsWith("enquiry.") && conditions.statusIn?.length) {
    const enquiry = (event as import("@/lib/task-automation/enquiry-triggers").EnquiryAutomationEvent).enquiry;
    return conditions.statusIn.includes(enquiry.status);
  }

  if (event.type.startsWith("client.") && conditions.statusIn?.length) {
    const client = (event as import("@/lib/task-automation/client-triggers").ClientAutomationEvent).client;
    return conditions.statusIn.includes(client.status);
  }

  return true;
}

function resolveDueDate(
  rule: TaskAutomationRecord,
  ctx: AutomationTemplateContext,
  now = new Date()
): string {
  if (rule.dueFromField === "reportDeadlineAt" && ctx.incident?.reportDeadlineAt) {
    return ctx.incident.reportDeadlineAt.slice(0, 10);
  }
  if (rule.dueFromField === "credentialExpiryDate" && ctx.credential?.expiryDate) {
    return ctx.credential.expiryDate.slice(0, 10);
  }

  const due = new Date(now);
  if (rule.dueOffsetHours != null && rule.dueOffsetHours > 0) {
    due.setHours(due.getHours() + rule.dueOffsetHours);
  } else if (rule.dueOffsetDays != null) {
    due.setDate(due.getDate() + rule.dueOffsetDays);
  }

  return due.toISOString().slice(0, 10);
}

type EntityLink = {
  entityType: TaskRecord["entityType"];
  entityId: string;
  entityLabel: string;
  dedupeEntityId: string;
};

function entityLinkFromEvent(event: AutomationEvent): EntityLink {
  switch (event.type) {
    case "incident.created":
    case "incident.updated":
    case "incident.reportable_set":
    case "incident.status_changed":
    case "incident.ndis_overdue":
    case "incident.investigation_overdue":
      return {
        entityType: "incident",
        entityId: event.incident.id,
        entityLabel: `${event.incident.documentNo} — ${event.incident.title?.trim() || "Incident"}`,
        dedupeEntityId: event.incident.id,
      };
    case "enquiry.created":
    case "enquiry.status_changed":
      return {
        entityType: "enquiry",
        entityId: event.enquiry.id,
        entityLabel: `${event.enquiry.documentNo} — ${event.enquiry.firstName} ${event.enquiry.lastName}`.trim(),
        dedupeEntityId: event.enquiry.id,
      };
    case "employee.created":
      return {
        entityType: "employee",
        entityId: event.employee.id,
        entityLabel: `${event.employee.searchKey} — ${event.employee.name}`,
        dedupeEntityId: event.employee.id,
      };
    case "employee.credential_expiring":
      return {
        entityType: "employee",
        entityId: event.employee.id,
        entityLabel: `${event.employee.searchKey} — ${event.credential.credentialType}`,
        dedupeEntityId: `${event.employee.id}:${event.credential.id}`,
      };
    case "employee.credential_pending_review":
      return {
        entityType: "employee",
        entityId: event.employee.id,
        entityLabel: `${event.employee.searchKey} — ${event.credential.credentialType}`,
        dedupeEntityId: `${event.employee.id}:${event.credential.id}`,
      };
    case "employee.leave_requested":
      return {
        entityType: "employee",
        entityId: event.employee.id,
        entityLabel: `${event.employee.searchKey} — ${event.leaveRequest.leaveType}`,
        dedupeEntityId: `${event.employee.id}:${event.leaveRequest.id}`,
      };
    case "client.created":
    case "client.updated":
    case "client.alert_added":
      return {
        entityType: "client",
        entityId: event.client.id,
        entityLabel: `${event.client.searchKey} — ${event.client.name}`,
        dedupeEntityId:
          event.type === "client.alert_added"
            ? `${event.client.id}:${event.alertTitle}`
            : event.client.id,
      };
    case "location.created":
      return {
        entityType: "location",
        entityId: event.location.id,
        entityLabel: `${event.location.searchKey} — ${event.location.name}`,
        dedupeEntityId: event.location.id,
      };
    case "location.alert_added":
      return {
        entityType: "location",
        entityId: event.location.id,
        entityLabel: `${event.location.searchKey} — ${event.alertTitle}`,
        dedupeEntityId: `${event.location.id}:${event.alertTitle}`,
      };
    case "service-agreement.expiring":
      return {
        entityType: "service-agreement",
        entityId: event.agreement.id,
        entityLabel: `${event.agreement.searchKey} — ${event.agreement.name}`,
        dedupeEntityId: event.agreement.id,
      };
    default:
      return { entityType: "", entityId: "", entityLabel: "", dedupeEntityId: "" };
  }
}

export type AutomationTaskDraft = Omit<TaskRecord, "id" | "documentNo" | "updates"> & {
  automationRuleId: string;
  automationDedupeKey: string;
};

function buildTaskDraft(
  rule: TaskAutomationRecord,
  event: AutomationEvent,
  ctx: AutomationTemplateContext,
  org: OrgAutomationContext | null
): AutomationTaskDraft {
  const link = entityLinkFromEvent(event);
  const dedupeKey = automationDedupeKey(rule.id, link.entityType || "record", link.dedupeEntityId);
  const assignee = resolveAutomationAssignee(rule, ctx, org);

  return {
    title: renderAutomationTemplate(rule.titleTemplate, ctx),
    description: renderAutomationTemplate(rule.descriptionTemplate, ctx),
    status: "Open",
    taskTypeId: rule.taskTypeId,
    priority: rule.priority,
    dueDate: resolveDueDate(rule, ctx),
    assignmentType: assignee.assignmentType,
    assigneeUserId: assignee.assigneeUserId,
    assigneeRoleId: assignee.assigneeRoleId,
    entityType: link.entityType,
    entityId: link.entityId,
    entityLabel: link.entityLabel,
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

function changedFieldsForEvent(event: AutomationEvent): string[] | undefined {
  if (event.type === "incident.updated" && event.before) {
    return incidentFieldChanges(event.before, event.incident);
  }
  return undefined;
}

function evaluateRulesForEvent(
  rules: TaskAutomationRecord[],
  event: AutomationEvent,
  ctx: AutomationTemplateContext,
  dedupeIndex: AutomationDedupeIndex,
  org: OrgAutomationContext | null,
  changedFields?: string[]
): { drafts: AutomationTaskDraft[]; skipped: number } {
  const drafts: AutomationTaskDraft[] = [];
  let skipped = 0;

  for (const raw of rules) {
    const rule = normalizeTaskAutomation(raw);
    if (!isModuleEngineLive(rule.module)) continue;
    if (!matchesEventConditions(event, rule.conditions, changedFields)) continue;

    const draft = buildTaskDraft(rule, event, ctx, org);
    if (shouldSkipAutomationTask(dedupeIndex, draft.automationDedupeKey, rule.dedupePolicy)) {
      skipped += 1;
      continue;
    }

    drafts.push(draft);
    registerAutomationDedupeKey(dedupeIndex, draft.automationDedupeKey);
  }

  return { drafts, skipped };
}

export function evaluateAutomationEvents(input: {
  events: AutomationEvent[];
  rules: TaskAutomationRecord[];
  tasks: TaskRecord[];
  investigationSlaDays: number;
  org?: OrgAutomationContext | null;
}): EvaluateAutomationsResult {
  const triggerIndex = indexAutomationsByTrigger(input.rules);
  const dedupeIndex = buildAutomationDedupeIndex(input.tasks);
  const org = input.org ?? getOrgAutomationContext();
  const drafts: AutomationTaskDraft[] = [];
  let skipped = 0;

  for (const event of input.events) {
    const trigger = automationTriggerForEvent(event);
    const rules = triggerIndex.get(trigger) ?? [];
    if (!rules.length) continue;

    const ctx = buildTemplateContextFromEvent(event, input.investigationSlaDays);
    const result = evaluateRulesForEvent(
      rules,
      event,
      ctx,
      dedupeIndex,
      org,
      changedFieldsForEvent(event)
    );
    drafts.push(...result.drafts);
    skipped += result.skipped;
  }

  return { drafts, skipped };
}

export function evaluateIncidentAutomations(input: {
  events: IncidentAutomationEvent[];
  rules: TaskAutomationRecord[];
  tasks: TaskRecord[];
  investigationSlaDays: number;
  org?: OrgAutomationContext | null;
}): EvaluateAutomationsResult {
  return evaluateAutomationEvents({
    events: input.events,
    rules: input.rules,
    tasks: input.tasks,
    investigationSlaDays: input.investigationSlaDays,
    org: input.org,
  });
}

export function evaluateScheduledAutomations(input: {
  incidents: IncidentRecord[];
  employees: EmployeeRecord[];
  serviceAgreements?: ServiceAgreementRecord[];
  clients?: ClientRecord[];
  rules: TaskAutomationRecord[];
  tasks: TaskRecord[];
  investigationSlaDays: number;
  batchLimit?: number;
  org?: OrgAutomationContext | null;
}): EvaluateAutomationsResult {
  const incidentEvents = scheduledIncidentCandidates(input.incidents, input.investigationSlaDays);
  const employeeEvents = scheduledEmployeeCredentialCandidates(
    input.employees,
    CREDENTIAL_EXPIRY_WARNING_DAYS
  );
  const agreementEvents = scheduledServiceAgreementExpiryCandidates(
    input.serviceAgreements ?? [],
    input.clients ?? []
  );
  const events: AutomationEvent[] = [...incidentEvents, ...employeeEvents, ...agreementEvents];
  const limit = input.batchLimit ?? TASK_AUTOMATION_SCHEDULED_BATCH_LIMIT;
  const limited = events.length > limit ? events.slice(0, limit) : events;

  return evaluateAutomationEvents({
    events: limited,
    rules: input.rules,
    tasks: input.tasks,
    investigationSlaDays: input.investigationSlaDays,
    org: input.org,
  });
}

/** @deprecated Use evaluateScheduledAutomations */
export function evaluateScheduledIncidentAutomations(input: {
  incidents: IncidentRecord[];
  rules: TaskAutomationRecord[];
  tasks: TaskRecord[];
  investigationSlaDays: number;
  batchLimit?: number;
  org?: OrgAutomationContext | null;
}): EvaluateAutomationsResult {
  return evaluateScheduledAutomations({
    ...input,
    employees: [],
  });
}

export type AutomationPreviewSamples = {
  incident?: IncidentRecord;
  enquiry?: EnquiryRecord;
  employee?: EmployeeRecord;
  credential?: EmployeeCredentialRow;
  leaveRequest?: EmployeeLeaveRequestRow;
  client?: ClientRecord;
  location?: LocationRecord;
  alertTitle?: string;
  agreement?: ServiceAgreementRecord;
  agreementDaysUntilFinish?: number;
};

export function buildAutomationPreviewContext(
  module: import("@/lib/task-automation").TaskAutomationModule,
  samples: AutomationPreviewSamples,
  investigationSlaDays: number
): AutomationTemplateContext {
  const org = { investigationSlaDays };
  switch (module) {
    case "incidents":
      return { incident: samples.incident, org };
    case "enquiries":
      return { enquiry: samples.enquiry, org };
    case "employees":
      return { employee: samples.employee, credential: samples.credential, leaveRequest: samples.leaveRequest, org };
    case "clients":
      return { client: samples.client, alertTitle: samples.alertTitle, org };
    case "locations":
      return { location: samples.location, alertTitle: samples.alertTitle, org };
    case "services":
      return { agreement: samples.agreement, client: samples.client, agreementDaysUntilFinish: samples.agreementDaysUntilFinish, org };
    default:
      return { org };
  }
}

export function previewEventForTrigger(
  trigger: import("@/lib/task-automation").TaskAutomationTriggerEvent,
  samples: AutomationPreviewSamples
): AutomationEvent | null {
  switch (trigger) {
    case "incident.created":
      return samples.incident ? { type: trigger, incident: samples.incident } : null;
    case "incident.updated":
      return samples.incident ? { type: trigger, incident: samples.incident } : null;
    case "incident.reportable_set":
      return samples.incident ? { type: trigger, incident: samples.incident } : null;
    case "incident.status_changed":
      return samples.incident
        ? { type: trigger, incident: samples.incident, beforeStatus: samples.incident.status }
        : null;
    case "incident.ndis_overdue":
      return samples.incident ? { type: trigger, incident: samples.incident } : null;
    case "incident.investigation_overdue":
      return samples.incident ? { type: trigger, incident: samples.incident } : null;
    case "enquiry.created":
      return samples.enquiry ? { type: trigger, enquiry: samples.enquiry } : null;
    case "enquiry.status_changed":
      return samples.enquiry
        ? { type: trigger, enquiry: samples.enquiry, beforeStatus: samples.enquiry.status }
        : null;
    case "client.created":
    case "client.updated":
      return samples.client ? { type: trigger, client: samples.client } : null;
    case "client.alert_added":
      return samples.client
        ? { type: trigger, client: samples.client, alertTitle: samples.alertTitle ?? "Sample alert" }
        : null;
    case "location.created":
      return samples.location ? { type: trigger, location: samples.location } : null;
    case "location.alert_added":
      return samples.location
        ? { type: trigger, location: samples.location, alertTitle: samples.alertTitle ?? "Sample alert" }
        : null;
    case "employee.created":
      return samples.employee ? { type: trigger, employee: samples.employee } : null;
    case "employee.credential_expiring":
      return samples.employee && samples.credential
        ? { type: trigger, employee: samples.employee, credential: samples.credential }
        : null;
    case "employee.credential_pending_review":
      return samples.employee && samples.credential
        ? { type: trigger, employee: samples.employee, credential: samples.credential }
        : null;
    case "employee.leave_requested":
      return samples.employee && samples.leaveRequest
        ? { type: trigger, employee: samples.employee, leaveRequest: samples.leaveRequest }
        : null;
    case "service-agreement.expiring":
      return samples.agreement
        ? {
            type: trigger,
            agreement: samples.agreement,
            client: samples.client ?? null,
            daysUntilFinish: samples.agreementDaysUntilFinish ?? 30,
          }
        : null;
    default:
      return null;
  }
}
