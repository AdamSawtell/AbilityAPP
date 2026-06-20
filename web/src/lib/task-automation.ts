/**
 * Task automation — configurable rules that create tasks on system events.
 */

export type TaskAutomationModule =
  | "enquiries"
  | "clients"
  | "locations"
  | "employees"
  | "incidents"
  | "services";

export type TaskAutomationTriggerEvent =
  | "incident.created"
  | "incident.updated"
  | "incident.reportable_set"
  | "incident.status_changed"
  | "incident.ndis_overdue"
  | "incident.investigation_overdue"
  | "enquiry.created"
  | "enquiry.status_changed"
  | "client.created"
  | "client.updated"
  | "client.alert_added"
  | "location.created"
  | "location.alert_added"
  | "employee.created"
  | "employee.credential_expiring"
  | "employee.credential_pending_review"
  | "employee.leave_requested"
  | "service-agreement.expiring";

export type TaskAutomationDedupePolicy = "one_open_per_entity" | "once_ever" | "none";

export type TaskAutomationAssigneeMode =
  | "role"
  | "org_position"
  | "org_incident_manager"
  | "org_reports_to_manager";

export const TASK_AUTOMATION_ASSIGNEE_MODES: {
  value: TaskAutomationAssigneeMode;
  label: string;
  hint: string;
}[] = [
  { value: "role", label: "Security role", hint: "Task queue for everyone with that role" },
  {
    value: "org_position",
    label: "Org position holder",
    hint: "Resolve the primary or acting holder of a position; falls back to role if no login user",
  },
  {
    value: "org_incident_manager",
    label: "Incident accountable manager",
    hint: "Manager one level up from the employee party on the incident",
  },
  {
    value: "org_reports_to_manager",
    label: "Employee reports-to manager",
    hint: "Resolve the login user for the employee's reports-to manager; falls back to role if none",
  },
];

export type TaskAutomationModuleMeta = {
  value: TaskAutomationModule;
  label: string;
  description: string;
  /** When false, triggers are shown in admin but the engine does not run them yet. */
  engineLive: boolean;
};

export const TASK_AUTOMATION_MODULES: TaskAutomationModuleMeta[] = [
  {
    value: "enquiries",
    label: "Enquiry",
    description: "Intake and enquiry workflow",
    engineLive: true,
  },
  {
    value: "clients",
    label: "Client",
    description: "Support receiver records, alerts, and plans",
    engineLive: true,
  },
  {
    value: "locations",
    label: "Location",
    description: "Support locations and site alerts",
    engineLive: true,
  },
  {
    value: "employees",
    label: "Employee",
    description: "Staff records and compliance",
    engineLive: true,
  },
  {
    value: "incidents",
    label: "Incident",
    description: "Incident reports, NDIS deadlines, and investigation SLA",
    engineLive: true,
  },
  {
    value: "services",
    label: "Services",
    description: "Service agreements, bookings, and delivery documents",
    engineLive: true,
  },
];

const MODULE_ORDER = new Map<TaskAutomationModule, number>(
  TASK_AUTOMATION_MODULES.map((m, i) => [m.value, i])
);

export function taskAutomationModuleLabel(module: TaskAutomationModule): string {
  return TASK_AUTOMATION_MODULES.find((m) => m.value === module)?.label ?? module;
}

export function normalizeAutomationModule(value: string | undefined | null): TaskAutomationModule {
  const v = (value ?? "").trim() as TaskAutomationModule;
  if (TASK_AUTOMATION_MODULES.some((m) => m.value === v)) return v;
  return "incidents";
}

export function moduleForTrigger(trigger: TaskAutomationTriggerEvent): TaskAutomationModule {
  if (trigger.startsWith("enquiry.")) return "enquiries";
  if (trigger.startsWith("client.")) return "clients";
  if (trigger.startsWith("location.")) return "locations";
  if (trigger.startsWith("employee.")) return "employees";
  if (trigger.startsWith("service-agreement.")) return "services";
  return "incidents";
}

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
  assigneeMode: TaskAutomationAssigneeMode;
  assigneePositionId: string;
  assigneeRoleId: string;
  dedupePolicy: TaskAutomationDedupePolicy;
  sortOrder: number;
};

export const TASK_AUTOMATION_SCHEDULED_THROTTLE_MS = 24 * 60 * 60 * 1000;
export const TASK_AUTOMATION_SCHEDULED_BATCH_LIMIT = 50;
export const TASK_AUTOMATION_SCHEDULED_STORAGE_KEY = "abilityapp-task-automation-scheduled-at";

export function normalizeTaskAutomation(raw: TaskAutomationRecord): TaskAutomationRecord {
  const ruleModule = normalizeAutomationModule(raw.module);
  const triggers = triggersForModule(ruleModule);
  const triggerEvent = triggers.some((t) => t.value === raw.triggerEvent)
    ? raw.triggerEvent
    : (triggers[0]?.value ?? "incident.created");
  const assigneeMode = TASK_AUTOMATION_ASSIGNEE_MODES.some((m) => m.value === raw.assigneeMode)
    ? raw.assigneeMode
    : "role";
  return {
    ...raw,
    module: ruleModule,
    triggerEvent,
    conditions: raw.conditions ?? {},
    priority: raw.priority ?? "Normal",
    dedupePolicy: raw.dedupePolicy ?? "one_open_per_entity",
    dueOffsetHours: raw.dueOffsetHours ?? null,
    dueOffsetDays: raw.dueOffsetDays ?? null,
    dueFromField: raw.dueFromField?.trim() || null,
    assigneeMode,
    assigneePositionId: raw.assigneePositionId?.trim() ?? "",
    assigneeRoleId: raw.assigneeRoleId?.trim() || "role-admin",
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
    assigneeMode: "org_incident_manager",
    assigneePositionId: "",
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
    assigneeMode: "org_position",
    assigneePositionId: "pos-gm-ops",
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
    assigneeMode: "org_position",
    assigneePositionId: "pos-gm-ops",
    assigneeRoleId: "role-coordinator",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 30,
  },
  {
    id: "tar-enquiry-created",
    name: "New enquiry — intake review",
    active: true,
    module: "enquiries",
    triggerEvent: "enquiry.created",
    conditions: {},
    taskTypeId: "tt-review",
    titleTemplate: "Review new enquiry {{enquiry.documentNo}}",
    descriptionTemplate:
      "{{enquiry.participantName}} — status {{enquiry.status}}. Triage the enquiry and set the next action date.",
    priority: "Normal",
    dueOffsetHours: 24,
    dueOffsetDays: null,
    dueFromField: null,
    assigneeMode: "role",
    assigneePositionId: "",
    assigneeRoleId: "role-intake",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 40,
  },
  {
    id: "tar-employee-credential-expiring",
    name: "Employee credential expiring",
    active: true,
    module: "employees",
    triggerEvent: "employee.credential_expiring",
    conditions: {},
    taskTypeId: "tt-check",
    titleTemplate: "Credential expiring — {{employee.name}}",
    descriptionTemplate:
      "{{credential.type}} for {{employee.name}} ({{employee.searchKey}}) expires {{credential.expiryDate}}. Renew or update the employee record.",
    priority: "Normal",
    dueOffsetHours: null,
    dueOffsetDays: 7,
    dueFromField: "credentialExpiryDate",
    assigneeMode: "org_position",
    assigneePositionId: "pos-gm-ops",
    assigneeRoleId: "role-coordinator",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 50,
  },
  {
    id: "tar-employee-credential-pending-review",
    name: "Credential pending HR review",
    active: true,
    module: "employees",
    triggerEvent: "employee.credential_pending_review",
    conditions: {},
    taskTypeId: "tt-review",
    titleTemplate: "Review credential — {{employee.name}}",
    descriptionTemplate:
      "{{employee.name}} ({{employee.searchKey}}) submitted {{credential.type}} for HR sign-off. Review evidence and approve or reject in Workforce planning or the employee record.",
    priority: "Normal",
    dueOffsetHours: 24,
    dueOffsetDays: null,
    dueFromField: null,
    assigneeMode: "role",
    assigneePositionId: "",
    assigneeRoleId: "role-hr-officer",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 55,
  },
  {
    id: "tar-employee-leave-requested",
    name: "Leave request — manager approval",
    active: true,
    module: "employees",
    triggerEvent: "employee.leave_requested",
    conditions: {},
    taskTypeId: "tt-approve",
    titleTemplate: "Approve leave — {{employee.name}}",
    descriptionTemplate:
      "{{employee.name}} requested {{leave.type}} from {{leave.startDate}} to {{leave.endDate}} ({{leave.daysRequested}} day(s)). Approve or decline in Workforce planning.",
    priority: "Normal",
    dueOffsetHours: 48,
    dueOffsetDays: null,
    dueFromField: null,
    assigneeMode: "org_reports_to_manager",
    assigneePositionId: "",
    assigneeRoleId: "role-hr-manager",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 60,
  },
  {
    id: "tar-client-alert",
    name: "Client alert added",
    active: true,
    module: "clients",
    triggerEvent: "client.alert_added",
    conditions: {},
    taskTypeId: "tt-review",
    titleTemplate: "Review client alert — {{client.searchKey}}",
    descriptionTemplate:
      "New alert on {{client.name}}: {{alert.title}}. Review risk and update the support plan if needed.",
    priority: "High",
    dueOffsetHours: 48,
    dueOffsetDays: null,
    dueFromField: null,
    assigneeMode: "role",
    assigneePositionId: "",
    assigneeRoleId: "role-coordinator",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 60,
  },
  {
    id: "tar-location-alert",
    name: "Location alert added",
    active: true,
    module: "locations",
    triggerEvent: "location.alert_added",
    conditions: {},
    taskTypeId: "tt-check",
    titleTemplate: "Location alert — {{location.searchKey}}",
    descriptionTemplate:
      "New alert at {{location.name}}: {{alert.title}}. Confirm roster or site actions.",
    priority: "Normal",
    dueOffsetHours: 24,
    dueOffsetDays: null,
    dueFromField: null,
    assigneeMode: "org_position",
    assigneePositionId: "pos-gm-ops",
    assigneeRoleId: "role-coordinator",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 70,
  },
  {
    id: "tar-service-agreement-expiring",
    name: "Service agreement expiring",
    active: true,
    module: "services",
    triggerEvent: "service-agreement.expiring",
    conditions: {},
    taskTypeId: "tt-review",
    titleTemplate: "Renew agreement {{agreement.searchKey}} — {{agreement.daysUntilFinish}} days left",
    descriptionTemplate:
      "Service agreement {{agreement.searchKey}} for {{client.name}} finishes on {{agreement.finishDate}}. Review renewal, update lifecycle to Expiring, and arrange participant re-sign if required.",
    priority: "Normal",
    dueOffsetHours: null,
    dueOffsetDays: 14,
    dueFromField: null,
    assigneeMode: "role",
    assigneePositionId: "",
    assigneeRoleId: "role-coordinator",
    dedupePolicy: "one_open_per_entity",
    sortOrder: 80,
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

export const TASK_AUTOMATION_TRIGGER_OPTIONS: {
  value: TaskAutomationTriggerEvent;
  label: string;
  hint: string;
  module: TaskAutomationModule;
}[] = [
  { value: "enquiry.created", label: "Enquiry created", hint: "When a new enquiry is saved", module: "enquiries" },
  {
    value: "enquiry.status_changed",
    label: "Enquiry status changed",
    hint: "When enquiry status changes",
    module: "enquiries",
  },
  { value: "client.created", label: "Client created", hint: "When a client record is first saved", module: "clients" },
  { value: "client.updated", label: "Client updated", hint: "Any client save", module: "clients" },
  {
    value: "client.alert_added",
    label: "Client alert added",
    hint: "When a new alert line is added to a client",
    module: "clients",
  },
  {
    value: "location.created",
    label: "Location created",
    hint: "When a support location is created",
    module: "locations",
  },
  {
    value: "location.alert_added",
    label: "Location alert added",
    hint: "When a new alert line is added to a location",
    module: "locations",
  },
  {
    value: "employee.created",
    label: "Employee created",
    hint: "When a new employee record is saved",
    module: "employees",
  },
  {
    value: "employee.credential_expiring",
    label: "Credential expiring",
    hint: "Scheduled — credential or document nearing expiry",
    module: "employees",
  },
  {
    value: "employee.credential_pending_review",
    label: "Credential pending review",
    hint: "When staff submit a credential for HR sign-off",
    module: "employees",
  },
  {
    value: "employee.leave_requested",
    label: "Leave requested",
    hint: "When staff submit a leave request for manager approval",
    module: "employees",
  },
  { value: "incident.created", label: "Incident created", hint: "When a new incident is saved", module: "incidents" },
  { value: "incident.updated", label: "Incident updated", hint: "Any incident save (use conditions to narrow)", module: "incidents" },
  { value: "incident.reportable_set", label: "Marked reportable", hint: "When isReportable becomes true", module: "incidents" },
  { value: "incident.status_changed", label: "Status changed", hint: "When incident status changes", module: "incidents" },
  { value: "incident.ndis_overdue", label: "NDIS notification overdue", hint: "Scheduled — reportable, not notified, past deadline", module: "incidents" },
  {
    value: "incident.investigation_overdue",
    label: "Investigation SLA breached",
    hint: "Scheduled — open past organisation investigation SLA",
    module: "incidents",
  },
  {
    value: "service-agreement.expiring",
    label: "Service agreement expiring",
    hint: "Scheduled — finish date within 60 days for Active or Signed agreements",
    module: "services",
  },
];

export function triggersForModule(module: TaskAutomationModule) {
  return TASK_AUTOMATION_TRIGGER_OPTIONS.filter((t) => t.module === module);
}

export function isModuleEngineLive(module: TaskAutomationModule): boolean {
  return TASK_AUTOMATION_MODULES.find((m) => m.value === module)?.engineLive ?? false;
}

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
  "{{enquiry.documentNo}}",
  "{{enquiry.status}}",
  "{{enquiry.participantName}}",
  "{{employee.name}}",
  "{{employee.searchKey}}",
  "{{employee.jobTitle}}",
  "{{credential.type}}",
  "{{credential.expiryDate}}",
  "{{leave.type}}",
  "{{leave.startDate}}",
  "{{leave.endDate}}",
  "{{leave.daysRequested}}",
  "{{client.name}}",
  "{{client.searchKey}}",
  "{{location.name}}",
  "{{location.searchKey}}",
  "{{alert.title}}",
  "{{agreement.searchKey}}",
  "{{agreement.name}}",
  "{{agreement.finishDate}}",
  "{{agreement.daysUntilFinish}}",
  "{{agreement.status}}",
  "{{org.investigationSlaDays}}",
];

export function sortTaskAutomations(rules: TaskAutomationRecord[]): TaskAutomationRecord[] {
  return [...rules].sort((a, b) => {
    const ma = MODULE_ORDER.get(a.module) ?? 99;
    const mb = MODULE_ORDER.get(b.module) ?? 99;
    if (ma !== mb) return ma - mb;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

export type TaskAutomationModuleGroup = {
  module: TaskAutomationModule;
  label: string;
  engineLive: boolean;
  rules: TaskAutomationRecord[];
};

export function groupTaskAutomationsByModule(rules: TaskAutomationRecord[]): TaskAutomationModuleGroup[] {
  const sorted = sortTaskAutomations(rules);
  const groups: TaskAutomationModuleGroup[] = [];

  for (const meta of TASK_AUTOMATION_MODULES) {
    const moduleRules = sorted.filter((r) => r.module === meta.value);
    if (moduleRules.length) {
      groups.push({
        module: meta.value,
        label: meta.label,
        engineLive: meta.engineLive,
        rules: moduleRules,
      });
    }
  }

  const known = new Set(TASK_AUTOMATION_MODULES.map((m) => m.value));
  const orphan = sorted.filter((r) => !known.has(r.module));
  if (orphan.length) {
    groups.push({
      module: "incidents",
      label: "Other",
      engineLive: false,
      rules: orphan,
    });
  }

  return groups;
}
