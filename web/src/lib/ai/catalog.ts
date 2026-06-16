import type { AiToolName } from "@/lib/ai/types";

export type AiToolDefinition = {
  key: AiToolName;
  label: string;
  description: string;
};

export const AI_TOOL_CATALOG: AiToolDefinition[] = [
  {
    key: "help_search",
    label: "How-to guide search",
    description: "Search in-app help articles and quick-task guides.",
  },
  {
    key: "activity_search",
    label: "Activity search",
    description: "Find activity notes by text and time across clients, enquiries, employees, and locations.",
  },
  {
    key: "client_search",
    label: "Client search",
    description: "Find client records by name or search key, sorted by name or last updated.",
  },
  {
    key: "client_get",
    label: "Client details",
    description: "Get one client with recent activity notes.",
  },
  {
    key: "client_list_recent",
    label: "Recently updated clients",
    description: "List clients updated within the last N hours.",
  },
  {
    key: "records_updated_since",
    label: "Recently updated records",
    description: "List records updated within the last N hours.",
  },
  {
    key: "task_search",
    label: "Task search",
    description: "Find tasks by title, assignee, status, or linked record.",
  },
  {
    key: "task_draft_create",
    label: "Create task draft",
    description: "Prepare a task for user confirmation (does not create until confirmed).",
  },
  {
    key: "task_draft_confirm",
    label: "Confirm task draft",
    description: "Confirm a pending task draft after explicit user approval.",
  },
  {
    key: "client_draft_create",
    label: "Create client draft",
    description: "Prepare a client for user confirmation (does not create until confirmed).",
  },
  {
    key: "client_draft_confirm",
    label: "Confirm client draft",
    description: "Confirm a pending client draft after explicit user approval.",
  },
  {
    key: "client_activity_draft_create",
    label: "Add client activity draft",
    description: "Prepare a client activity note for confirmation.",
  },
  {
    key: "client_activity_draft_confirm",
    label: "Confirm client activity",
    description: "Save a pending client activity note after explicit approval.",
  },
  {
    key: "incident_search",
    label: "Incident search",
    description: "Find incident reports by title, status, severity, NDIS fields, or overdue.",
  },
  {
    key: "incident_get",
    label: "Incident details",
    description: "Get one incident with parties, NDIS checklist, notifications, and investigation notes.",
  },
  {
    key: "incident_list_recent",
    label: "Recent incidents",
    description: "List incidents from the last N hours.",
  },
  {
    key: "incident_compliance_summary",
    label: "NDIS compliance summary",
    description: "Open reportable, overdue, and incomplete checklist counts.",
  },
  {
    key: "incident_linked_search",
    label: "Incidents for client/employee",
    description: "Find incidents linked to a support receiver or staff member.",
  },
  {
    key: "incident_draft_create",
    label: "Create incident draft",
    description: "Prepare an incident report for user confirmation.",
  },
  {
    key: "incident_draft_confirm",
    label: "Confirm incident draft",
    description: "Save a pending incident draft after explicit approval.",
  },
  {
    key: "incident_update_draft_create",
    label: "Update incident draft",
    description: "Prepare status, workflow, or investigation updates for confirmation.",
  },
  {
    key: "incident_update_draft_confirm",
    label: "Confirm incident update",
    description: "Save a pending incident update after explicit approval.",
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
