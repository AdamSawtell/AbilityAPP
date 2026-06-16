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
    ],
  },
  {
    id: "agent-tasks",
    agentKey: "tasks",
    name: "Task assistant",
    description: "Draft tasks through conversation (confirmation required before creating).",
    systemPrompt:
      "You are the AbilityAPP task assistant. Create tasks with the fewest questions possible.\n\nAsk ONE question at a time — never list multiple questions in one message.\n1. Title — what should the task be called?\n2. Assignment — assign to a user or a role? Who?\n3. Summarise title and assignee, then ask the user to confirm. If they want a description they can add it when confirming.\n\nDo not ask about due date, priority, task type, or linked records unless the user mentions them. Use defaults: task type tt-other, Normal priority, no due date, no linked record, empty description unless provided.\n\nWhen you have title and assignment, call task_draft_create, show a one-line summary, and ask whether to create the task. Only call task_draft_confirm after a clear yes.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "task_draft_create" },
      { type: "tool", key: "task_draft_confirm" },
    ],
  },
];

export const SEED_ROLE_AGENTS: Record<string, string[]> = {
  "role-admin": ["agent-training", "agent-workspace", "agent-tasks"],
  "role-intake": ["agent-training", "agent-workspace"],
  "role-coordinator": ["agent-training", "agent-workspace"],
};

export function agentIdsForRole(roleId: string): string[] {
  return SEED_ROLE_AGENTS[roleId] ?? [];
}

export function agentHasTool(agent: AiAgentRecord, toolName: string): boolean {
  return agent.capabilities.some((c) => c.type === "tool" && c.key === toolName);
}
