import type { AiToolName } from "@/lib/ai/types";
import {
  GUIDED_ACTIVITY_SKILL_HINT,
  GUIDED_PREPARE_SKILL_HINT,
} from "@/lib/ai/guided-prepare-policy";

/** Menu area — aligned with workspace sidebar modules. */
export type AiToolModule =
  | "help"
  | "cross-cutting"
  | "clients"
  | "enquiries"
  | "tasks"
  | "incidents"
  | "people"
  | "locations"
  | "delivery"
  | "reports";

export type AiToolKind = "read" | "prepare" | "write" | "workflow";

export type AiToolDefinition = {
  key: AiToolName;
  label: string;
  description: string;
  module: AiToolModule;
  kind: AiToolKind;
  /** Optional hint for the system prompt — shown in admin when assigning skills. */
  skillHint?: string;
  /** Legacy confirm/save tools superseded by *_prepare. Hidden in admin unless toggled. */
  deprecated?: boolean;
};

export const AI_TOOL_MODULE_ORDER: AiToolModule[] = [
  "help",
  "cross-cutting",
  "clients",
  "enquiries",
  "tasks",
  "incidents",
  "people",
  "locations",
  "delivery",
  "reports",
];

export const AI_TOOL_MODULE_LABELS: Record<AiToolModule, string> = {
  help: "Help",
  "cross-cutting": "Cross-cutting",
  clients: "Clients",
  enquiries: "Enquiries",
  tasks: "Tasks",
  incidents: "Incident reports",
  people: "People",
  locations: "Locations",
  delivery: "Delivery",
  reports: "Reports",
};

export const AI_TOOL_KIND_LABELS: Record<AiToolKind, string> = {
  read: "Read",
  prepare: "Prepare",
  write: "Write",
  workflow: "Workflow",
};

export const AI_TOOL_CATALOG: AiToolDefinition[] = [
  {
    key: "help_search",
    label: "How-to guide search",
    description: "Search in-app help articles and quick-task guides.",
    module: "help",
    kind: "read",
  },
  {
    key: "activity_search",
    label: "Activity search",
    description: "Find activity notes by text and time across clients, enquiries, employees, and locations.",
    module: "cross-cutting",
    kind: "read",
  },
  {
    key: "records_updated_since",
    label: "Recently updated records",
    description: "List records updated within the last N hours.",
    module: "cross-cutting",
    kind: "read",
  },
  {
    key: "client_search",
    label: "Client search",
    description: "Find client records by name or search key, sorted by name or last updated.",
    module: "clients",
    kind: "read",
  },
  {
    key: "client_get",
    label: "Client details",
    description: "Get one client with recent activity notes.",
    module: "clients",
    kind: "read",
  },
  {
    key: "client_activity_recent",
    label: "Last 5 activity notes (fetch)",
    description: "Load the client's most recent activity notes with full text.",
    skillHint:
      "Use purpose=summary for handover recaps; purpose=coach before helping write a new note.",
    module: "clients",
    kind: "read",
  },
  {
    key: "client_safety_profile",
    label: "Client safety profile",
    description: "Alerts, consents, risks, and service locations for a client.",
    skillHint: "Use before visits, rostering, or handover when safety context matters.",
    module: "clients",
    kind: "read",
  },
  {
    key: "client_tasks_open",
    label: "Client open tasks",
    description: "Open and in-progress tasks linked to a client.",
    module: "clients",
    kind: "read",
  },
  {
    key: "client_list_recent",
    label: "Recently updated clients",
    description: "List clients updated within the last N hours.",
    module: "clients",
    kind: "read",
  },
  {
    key: "client_create_prepare",
    label: "Prepare new client (review & save)",
    description: "Fill a new client form for the user to review and save — does not write to the database.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "clients",
    kind: "prepare",
  },
  {
    key: "client_patch_prepare",
    label: "Prepare client field update",
    description: "Open an existing client with suggested field changes for human review and save.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "clients",
    kind: "prepare",
  },
  {
    key: "client_activity_prepare",
    label: "Prepare client activity note",
    description: "Open a client Activity tab with a prepared note for human review and save.",
    skillHint: GUIDED_ACTIVITY_SKILL_HINT,
    module: "clients",
    kind: "prepare",
  },
  {
    key: "client_task_prepare",
    label: "Prepare client follow-up task",
    description: "Open a new task form linked to a client for human review and save.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "clients",
    kind: "prepare",
  },
  {
    key: "client_draft_create",
    label: "Create client draft",
    description: "Legacy — use Prepare new client instead.",
    module: "clients",
    kind: "write",
    deprecated: true,
  },
  {
    key: "client_draft_confirm",
    label: "Confirm client draft",
    description: "Legacy — disabled. Use Prepare new client instead.",
    module: "clients",
    kind: "write",
    deprecated: true,
  },
  {
    key: "client_patch_draft_create",
    label: "Create client patch draft",
    description: "Legacy — use Prepare client field update instead.",
    module: "clients",
    kind: "write",
    deprecated: true,
  },
  {
    key: "client_patch_draft_confirm",
    label: "Confirm client patch",
    description: "Legacy — disabled. Use Prepare client field update instead.",
    module: "clients",
    kind: "write",
    deprecated: true,
  },
  {
    key: "client_activity_draft_create",
    label: "Add client activity draft",
    description: "Legacy — use Prepare client activity note instead.",
    module: "clients",
    kind: "write",
    deprecated: true,
  },
  {
    key: "client_activity_draft_confirm",
    label: "Confirm client activity",
    description: "Legacy — disabled. Use Prepare client activity note instead.",
    module: "clients",
    kind: "write",
    deprecated: true,
  },
  {
    key: "enquiry_search",
    label: "Enquiry search",
    description: "Find enquiries by name, document number, status, or intake details.",
    module: "enquiries",
    kind: "read",
  },
  {
    key: "enquiry_get",
    label: "Enquiry details",
    description: "Get one enquiry with activity and intake fields.",
    module: "enquiries",
    kind: "read",
  },
  {
    key: "enquiry_list_recent",
    label: "Recently updated enquiries",
    description: "List enquiries updated within the last N hours.",
    module: "enquiries",
    kind: "read",
  },
  {
    key: "enquiry_create_prepare",
    label: "Prepare new enquiry (review & save)",
    description: "Fill a new enquiry form for the user to review and create.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "enquiries",
    kind: "prepare",
  },
  {
    key: "enquiry_task_prepare",
    label: "Prepare enquiry follow-up task",
    description: "Open a new task form linked to an enquiry for human review and save.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "enquiries",
    kind: "prepare",
  },
  {
    key: "enquiry_draft_create",
    label: "Create enquiry draft",
    description: "Legacy — use Prepare new enquiry instead.",
    module: "enquiries",
    kind: "write",
    deprecated: true,
  },
  {
    key: "enquiry_draft_confirm",
    label: "Confirm enquiry draft",
    description: "Legacy — disabled. Use Prepare new enquiry instead.",
    module: "enquiries",
    kind: "write",
    deprecated: true,
  },
  {
    key: "enquiry_convert_draft_create",
    label: "Convert enquiry to client draft",
    description: "Legacy — prepare a client from an enquiry for confirmation.",
    module: "enquiries",
    kind: "workflow",
    deprecated: true,
  },
  {
    key: "enquiry_convert_draft_confirm",
    label: "Confirm enquiry conversion",
    description: "Legacy — disabled.",
    module: "enquiries",
    kind: "workflow",
    deprecated: true,
  },
  {
    key: "task_search",
    label: "Task search",
    description: "Find tasks by title, assignee, status, or linked record.",
    module: "tasks",
    kind: "read",
  },
  {
    key: "task_list_mine",
    label: "My active tasks",
    description: "Tasks assigned to the signed-in user or their current role.",
    skillHint: "Use scope=role for tasks assigned to the user's role.",
    module: "tasks",
    kind: "read",
  },
  {
    key: "task_list_overdue",
    label: "Overdue tasks",
    description: "Active tasks past due date that the user can see.",
    module: "tasks",
    kind: "read",
  },
  {
    key: "task_create_prepare",
    label: "Prepare new task (review & save)",
    description: "Fill a new task form for the user to review and create — does not write to the database.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "tasks",
    kind: "prepare",
  },
  {
    key: "task_update_prepare",
    label: "Prepare task update",
    description: "Open a task with a suggested note, completion, reassignment, or status change for human review.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "tasks",
    kind: "prepare",
  },
  {
    key: "task_draft_create",
    label: "Create task draft",
    description: "Legacy — use Prepare new task instead.",
    module: "tasks",
    kind: "write",
    deprecated: true,
  },
  {
    key: "task_draft_confirm",
    label: "Confirm task draft",
    description: "Legacy — disabled. Use Prepare new task instead.",
    module: "tasks",
    kind: "write",
    deprecated: true,
  },
  {
    key: "task_update_draft_create",
    label: "Update task draft",
    description: "Legacy — prepare task status or assignment changes for confirmation.",
    module: "tasks",
    kind: "write",
    deprecated: true,
  },
  {
    key: "task_update_draft_confirm",
    label: "Confirm task update",
    description: "Legacy — disabled.",
    module: "tasks",
    kind: "write",
    deprecated: true,
  },
  {
    key: "incident_search",
    label: "Incident search",
    description: "Find incident reports by title, status, severity, NDIS fields, or overdue.",
    module: "incidents",
    kind: "read",
  },
  {
    key: "incident_get",
    label: "Incident details",
    description: "Get one incident with parties, NDIS checklist, notifications, and investigation notes.",
    module: "incidents",
    kind: "read",
  },
  {
    key: "incident_list_recent",
    label: "Recent incidents",
    description: "List incidents from the last N hours.",
    module: "incidents",
    kind: "read",
  },
  {
    key: "incident_compliance_summary",
    label: "NDIS compliance summary",
    description: "Open reportable, overdue, and incomplete checklist counts.",
    module: "incidents",
    kind: "read",
  },
  {
    key: "incident_linked_search",
    label: "Incidents for client/employee",
    description: "Find incidents linked to a support receiver or staff member.",
    module: "incidents",
    kind: "read",
  },
  {
    key: "incident_create_prepare",
    label: "Prepare incident report (review & submit)",
    description: "Pre-fill the incident wizard for human review and submit.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "incidents",
    kind: "prepare",
  },
  {
    key: "incident_task_prepare",
    label: "Prepare incident follow-up task",
    description: "Open a new task form linked to an incident for human review and save.",
    skillHint: GUIDED_PREPARE_SKILL_HINT,
    module: "incidents",
    kind: "prepare",
  },
  {
    key: "incident_draft_create",
    label: "Create incident draft",
    description: "Legacy — use Prepare incident report instead.",
    module: "incidents",
    kind: "write",
    deprecated: true,
  },
  {
    key: "incident_draft_confirm",
    label: "Confirm incident draft",
    description: "Legacy — disabled. Use Prepare incident report instead.",
    module: "incidents",
    kind: "write",
    deprecated: true,
  },
  {
    key: "incident_update_draft_create",
    label: "Update incident draft",
    description: "Legacy — prepare status, workflow, or investigation updates for confirmation.",
    module: "incidents",
    kind: "write",
    deprecated: true,
  },
  {
    key: "incident_update_draft_confirm",
    label: "Confirm incident update",
    description: "Legacy — disabled.",
    module: "incidents",
    kind: "write",
    deprecated: true,
  },
  {
    key: "employee_search",
    label: "Employee search",
    description: "Find staff by name, search key, email, or job title.",
    module: "people",
    kind: "read",
  },
];

export const AI_MODEL_OPTIONS = [
  { id: "gpt-4o-mini", label: "gpt-4o-mini (fast, lower cost)" },
  { id: "gpt-4o", label: "gpt-4o (stronger)" },
  { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
  { id: "gpt-4.1", label: "gpt-4.1" },
];

export function toolLabel(key: string): string {
  return AI_TOOL_CATALOG.find((t) => t.key === key)?.label ?? key;
}

export function catalogEntry(key: string): AiToolDefinition | undefined {
  return AI_TOOL_CATALOG.find((t) => t.key === key);
}

export function toolsGroupedByModule(
  tools: AiToolDefinition[] = AI_TOOL_CATALOG
): { module: AiToolModule; label: string; tools: AiToolDefinition[] }[] {
  return AI_TOOL_MODULE_ORDER.map((module) => ({
    module,
    label: AI_TOOL_MODULE_LABELS[module],
    tools: tools.filter((t) => t.module === module),
  })).filter((group) => group.tools.length > 0);
}

const KIND_ORDER: AiToolKind[] = ["read", "prepare", "workflow", "write"];

export function toolsGroupedByModuleAndKind(
  tools: AiToolDefinition[] = AI_TOOL_CATALOG
): {
  module: AiToolModule;
  label: string;
  kinds: { kind: AiToolKind; label: string; tools: AiToolDefinition[] }[];
}[] {
  return toolsGroupedByModule(tools).map((group) => ({
    module: group.module,
    label: group.label,
    kinds: KIND_ORDER.map((kind) => ({
      kind,
      label: AI_TOOL_KIND_LABELS[kind],
      tools: group.tools.filter((t) => t.kind === kind),
    })).filter((k) => k.tools.length > 0),
  }));
}
