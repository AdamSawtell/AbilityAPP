import type { AiAgentRecord, AiToolName } from "@/lib/ai/types";
import { agentHasTool, SEED_AGENTS } from "@/lib/ai/seed";
import type { PageChatContext } from "@/lib/ai/page-chat-context";

type ToolRequirement = {
  /** At least one assigned agent must have one of these tools (default). */
  anyOf: AiToolName[];
};

const SUGGESTION_TOOLS: Record<string, ToolRequirement> = {
  "Show recent client activity": { anyOf: ["activity_search", "client_activity_recent", "client_list_recent"] },
  "Who was updated most recently?": { anyOf: ["records_updated_since", "client_list_recent", "enquiry_list_recent"] },
  "Prepare a new client": { anyOf: ["client_create_prepare"] },
  "Prepare another client": { anyOf: ["client_create_prepare"] },
  "What should I check before saving?": { anyOf: ["help_search"] },
  "Help me write today's activity update": { anyOf: ["client_activity_prepare"] },
  "Summarise the last 5 activity notes": { anyOf: ["client_activity_recent"] },
  "Prepare an update to phone or status": { anyOf: ["client_patch_prepare"] },
  "What intake fields matter most?": { anyOf: ["help_search", "enquiry_get"] },
  "Prepare another enquiry": { anyOf: ["enquiry_create_prepare"] },
  "Summarise this enquiry": { anyOf: ["enquiry_get", "enquiry_search"] },
  "What is the next step for intake?": { anyOf: ["help_search", "enquiry_get"] },
  "Who should this task go to?": { anyOf: ["help_search", "employee_search", "task_search"] },
  "Prepare a follow-up task": { anyOf: ["task_create_prepare", "client_task_prepare", "enquiry_task_prepare", "incident_task_prepare"] },
  "What is the status of this task?": { anyOf: ["task_search", "task_list_mine"] },
  "Prepare a related task": { anyOf: ["task_create_prepare", "client_task_prepare"] },
  "Is this NDIS reportable?": { anyOf: ["help_search", "incident_get", "incident_create_prepare"] },
  "What evidence should I attach?": { anyOf: ["help_search"] },
  "Is this overdue for NDIS?": { anyOf: ["incident_get", "incident_compliance_summary", "incident_search"] },
  "Show linked client incidents": { anyOf: ["incident_linked_search"] },
  "What tasks are overdue?": { anyOf: ["task_list_overdue", "task_search"] },
  "Prepare a task for my team": { anyOf: ["task_create_prepare"] },
  "Any overdue NDIS reportables?": { anyOf: ["incident_compliance_summary", "incident_search"] },
  "How do I submit an incident?": { anyOf: ["help_search", "incident_create_prepare"] },
  "Show recent enquiries": { anyOf: ["enquiry_list_recent", "enquiry_search"] },
  "Prepare a new enquiry": { anyOf: ["enquiry_create_prepare"] },
  "Find Bernadette Rose": { anyOf: ["client_search", "activity_search"] },
};

/** Capabilities that describe manual form actions, not AI tools — always shown. */
const MANUAL_CAPABILITIES = new Set([
  "Save the client record",
  "Create the enquiry",
  "Create the task",
  "Submit the incident",
]);

const CAPABILITY_TOOLS: Record<string, ToolRequirement> = {
  "Search records": {
    anyOf: ["activity_search", "client_search", "records_updated_since", "enquiry_search", "task_search", "incident_search"],
  },
  "Prepare new clients": { anyOf: ["client_create_prepare"] },
  "Ask how-to questions": { anyOf: ["help_search"] },
  "Ask questions": { anyOf: ["help_search"] },
  "Review prepared fields": { anyOf: ["help_search"] },
  "Look up details": { anyOf: ["client_get", "enquiry_get", "incident_get"] },
  "Summarise recent activity": { anyOf: ["client_activity_recent", "activity_search"] },
  "Coach activity notes (confirm client → last 5 notes → questions → save)": { anyOf: ["client_activity_prepare"] },
  "Search intake": { anyOf: ["enquiry_search", "enquiry_list_recent"] },
  "Convert to client": { anyOf: ["enquiry_convert_draft_create", "enquiry_convert_draft_confirm"] },
  "Review prepared task": { anyOf: ["help_search", "task_create_prepare"] },
  "Search tasks": { anyOf: ["task_search", "task_list_mine", "task_list_overdue"] },
  "Prepare updates": { anyOf: ["task_update_prepare", "client_patch_prepare", "incident_update_draft_create"] },
  "Review prepared report": { anyOf: ["help_search", "incident_create_prepare"] },
  "Compliance summary": { anyOf: ["incident_compliance_summary"] },
  "Linked client history": { anyOf: ["incident_linked_search", "client_get"] },
  "Search incidents": { anyOf: ["incident_search", "incident_list_recent"] },
  "Submit incident": { anyOf: ["incident_create_prepare", "help_search"] },
  "NDIS reportable summary": { anyOf: ["incident_compliance_summary"] },
  "Search enquiries": { anyOf: ["enquiry_search", "enquiry_list_recent"] },
  "Prepare new enquiries": { anyOf: ["enquiry_create_prepare"] },
  "Search clients": { anyOf: ["client_search", "client_list_recent"] },
  "Prepare new tasks": { anyOf: ["task_create_prepare"] },
};

function assignedAgents(agentIds: string[], agents: AiAgentRecord[]): AiAgentRecord[] {
  const idSet = new Set(agentIds);
  return agents.filter((a) => idSet.has(a.id));
}

function requirementMet(agents: AiAgentRecord[], requirement: ToolRequirement): boolean {
  return agents.some((agent) => requirement.anyOf.some((tool) => agentHasTool(agent, tool)));
}

export function suggestionAvailableForAgents(suggestion: string, agents: AiAgentRecord[]): boolean {
  const requirement = SUGGESTION_TOOLS[suggestion];
  if (!requirement) return agents.some((agent) => agentHasTool(agent, "help_search"));
  return requirementMet(agents, requirement);
}

export function capabilityAvailableForAgents(capability: string, agents: AiAgentRecord[]): boolean {
  if (MANUAL_CAPABILITIES.has(capability)) return true;
  const requirement = CAPABILITY_TOOLS[capability];
  if (!requirement) return true;
  return requirementMet(agents, requirement);
}

function resolvePreferredAgentId(
  ctx: PageChatContext,
  agentIds: string[],
  assigned: AiAgentRecord[]
): string | undefined {
  const fullCoverage = assigned.filter((agent) =>
    ctx.suggestions.every((s) => suggestionAvailableForAgents(s, [agent]))
  );
  if (fullCoverage.length === 1) return fullCoverage[0]!.id;
  if (fullCoverage.length > 1) {
    if (ctx.preferredAgentId && fullCoverage.some((a) => a.id === ctx.preferredAgentId)) {
      return ctx.preferredAgentId;
    }
    return fullCoverage[0]!.id;
  }

  let bestId: string | undefined;
  let bestScore = -1;
  for (const agent of assigned) {
    const score = ctx.suggestions.filter((s) => suggestionAvailableForAgents(s, [agent])).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = agent.id;
    }
  }
  if (bestId && bestScore > 0) return bestId;

  if (ctx.preferredAgentId && agentIds.includes(ctx.preferredAgentId)) return ctx.preferredAgentId;
  return agentIds[0];
}

/** Pick an assigned assistant that can run this prompt (keeps current agent when capable). */
export function resolveAgentForSuggestion(
  suggestion: string,
  agentIds: string[],
  currentAgentId?: string,
  agents: AiAgentRecord[] = SEED_AGENTS
): string | undefined {
  const assigned = assignedAgents(agentIds, agents);
  if (currentAgentId) {
    const current = assigned.find((a) => a.id === currentAgentId);
    if (current && suggestionAvailableForAgents(suggestion, [current])) return currentAgentId;
  }
  return assigned.find((a) => suggestionAvailableForAgents(suggestion, [a]))?.id;
}

/** Filter Home and page chat prompts to tools enabled on the role's assigned assistants. */
export function filterPageChatContextForRole(
  ctx: PageChatContext,
  agentIds: string[] | undefined,
  agents: AiAgentRecord[] = SEED_AGENTS
): PageChatContext {
  if (!agentIds?.length) {
    return { ...ctx, suggestions: [], capabilities: [] };
  }

  const assigned = assignedAgents(agentIds, agents);
  const suggestions = ctx.suggestions.filter((s) => suggestionAvailableForAgents(s, assigned));
  const capabilities = ctx.capabilities.filter((c) => capabilityAvailableForAgents(c, assigned));

  return {
    ...ctx,
    suggestions,
    capabilities,
    preferredAgentId: resolvePreferredAgentId(ctx, agentIds, assigned),
  };
}
