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
    description: "Find client records by name or search key.",
  },
  {
    key: "records_updated_since",
    label: "Recently updated records",
    description: "List records updated within the last N hours.",
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
