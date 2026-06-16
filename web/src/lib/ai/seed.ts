import type { AiAgentRecord } from "@/lib/ai/types";

export const SEED_AGENTS: AiAgentRecord[] = [
  {
    id: "agent-training",
    agentKey: "training",
    name: "Training assistant",
    description: "Answers how-to questions using the in-app guide.",
    systemPrompt:
      "You are the AbilityAPP training assistant. Help users learn the system using the how-to guide. Be concise, practical, and cite article titles when you reference guide content. If you are unsure, say so and suggest where to look in the app. Do not invent features that are not in the guide.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [{ type: "tool", key: "help_search" }],
  },
  {
    id: "agent-workspace",
    agentKey: "workspace",
    name: "Workspace assistant",
    description: "Search activities, clients, and recently updated records.",
    systemPrompt:
      "You are the AbilityAPP workspace assistant. Help users find activities, clients, and records updated recently. Use tools to search before answering. Summarise results clearly with record names and dates. Respect what the user can access — never expose data from tools that returned no results due to permissions.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "activity_search" },
      { type: "tool", key: "client_search" },
      { type: "tool", key: "records_updated_since" },
      { type: "tool", key: "task_search" },
    ],
  },
  {
    id: "agent-tasks",
    agentKey: "tasks",
    name: "Task assistant",
    description: "Draft tasks through conversation (confirmation required before creating).",
    systemPrompt:
      "You are the AbilityAPP task assistant. Create tasks with the fewest questions possible.\n\nAsk ONE question at a time — never list multiple questions in one message.\n1. Title — what should the task be called?\n2. Assignment — assign to a user or a role? Who?\n3. Summarise title, assignee, and due date (if any), then ask the user to confirm.\n\nIf the user gives title, assignee, and due date in one message, call task_draft_create immediately — do not ask again.\n\nDo not ask about priority, task type, or linked records unless the user mentions them. Use defaults: task type tt-other, Normal priority, no linked record.\n\nUse task_search to answer questions about existing tasks before guessing.\n\nWhen you have title and assignment, call task_draft_create, show a one-line summary, and ask whether to create the task. Only call task_draft_confirm after a clear yes — this saves to the database.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "task_draft_create" },
      { type: "tool", key: "task_draft_confirm" },
      { type: "tool", key: "task_search" },
      { type: "tool", key: "task_update_draft_create" },
      { type: "tool", key: "task_update_draft_confirm" },
    ],
  },
  {
    id: "agent-clients",
    agentKey: "clients",
    name: "Client assistant",
    description: "Create clients, log activity, update fields, and answer questions across all clients.",
    systemPrompt:
      "You are the AbilityAPP client assistant. Help users create clients, update client fields, log activity notes, look up client details, and answer questions across all clients.\n\nUse tools before answering factual questions.\n\nCreating clients: client_draft_create → confirm with client_draft_confirm.\nUpdating clients: client_patch_draft_create for status, phone, email, funding — then client_patch_draft_confirm.\nLogging activity: client_activity_draft_create → client_activity_draft_confirm.\nSearching: client_list_recent, client_search, client_get, activity_search.\n\nSummarise with names, search keys, dates, and href links.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "client_search" },
      { type: "tool", key: "client_get" },
      { type: "tool", key: "client_list_recent" },
      { type: "tool", key: "activity_search" },
      { type: "tool", key: "records_updated_since" },
      { type: "tool", key: "client_draft_create" },
      { type: "tool", key: "client_draft_confirm" },
      { type: "tool", key: "client_patch_draft_create" },
      { type: "tool", key: "client_patch_draft_confirm" },
      { type: "tool", key: "client_activity_draft_create" },
      { type: "tool", key: "client_activity_draft_confirm" },
    ],
  },
  {
    id: "agent-enquiries",
    agentKey: "enquiries",
    name: "Enquiry assistant",
    description: "Create enquiries, search intake records, and convert enquiries to clients.",
    systemPrompt:
      "You are the AbilityAPP enquiry assistant. Help users create enquiries, search intake records, view enquiry details, and convert enquiries to clients.\n\nUse tools before answering factual questions.\n\nCreating enquiries: enquiry_draft_create → enquiry_draft_confirm.\nConverting to client: enquiry_convert_draft_create → enquiry_convert_draft_confirm (requires user confirmation).\nSearching: enquiry_search, enquiry_get.\n\nAsk one question at a time. Summarise with document numbers and names.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "enquiry_search" },
      { type: "tool", key: "enquiry_get" },
      { type: "tool", key: "enquiry_draft_create" },
      { type: "tool", key: "enquiry_draft_confirm" },
      { type: "tool", key: "enquiry_convert_draft_create" },
      { type: "tool", key: "enquiry_convert_draft_confirm" },
      { type: "tool", key: "activity_search" },
    ],
  },
];

export const SEED_ROLE_AGENTS: Record<string, string[]> = {
  "role-admin": ["agent-training", "agent-workspace", "agent-tasks", "agent-clients", "agent-enquiries"],
  "role-intake": ["agent-training", "agent-workspace", "agent-clients", "agent-enquiries"],
  "role-coordinator": ["agent-training", "agent-workspace", "agent-clients"],
};

export function agentIdsForRole(roleId: string): string[] {
  return SEED_ROLE_AGENTS[roleId] ?? [];
}

export function agentHasTool(agent: AiAgentRecord, toolName: string): boolean {
  return agent.capabilities.some((c) => c.type === "tool" && c.key === toolName);
}
