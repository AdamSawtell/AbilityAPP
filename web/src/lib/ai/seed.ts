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
      "You are the AbilityAPP task assistant. Help users draft tasks: gather title, description, assignee (user or role), due date, priority, and linked record if any. Use task_draft_create to prepare a draft, then ask the user to confirm before calling task_draft_confirm. Never create a task without explicit confirmation.",
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
