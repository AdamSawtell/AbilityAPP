import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { AiAgentRecord, AiToolName } from "@/lib/ai/types";
import { agentHasTool } from "@/lib/ai/seed";

const TOOL_DEFS: Record<AiToolName, ChatCompletionTool> = {
  help_search: {
    type: "function",
    function: {
      name: "help_search",
      description: "Search the in-app how-to guide for articles and steps relevant to the user's question.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query, e.g. how to create a client" },
          limit: { type: "number", description: "Max results (default 8)" },
        },
        required: ["query"],
      },
    },
  },
  activity_search: {
    type: "function",
    function: {
      name: "activity_search",
      description:
        "Search activity notes across clients, enquiries, employees, and locations. Filter by text and optionally by records updated within the last N hours.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Text to match in subject, description, or type (e.g. ambulance)" },
          updatedWithinHours: {
            type: "number",
            description: "Only include activities updated within this many hours (e.g. 2 for last 2 hours)",
          },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  client_search: {
    type: "function",
    function: {
      name: "client_search",
      description: "Find client records by name, search key, email, or phone.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name or partial match" },
          limit: { type: "number", description: "Max results (default 15)" },
        },
      },
    },
  },
  records_updated_since: {
    type: "function",
    function: {
      name: "records_updated_since",
      description: "List clients, enquiries, employees, and locations updated within the last N hours.",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number", description: "Look back this many hours (default 24)" },
          limit: { type: "number", description: "Max results (default 25)" },
        },
      },
    },
  },
  task_draft_create: {
    type: "function",
    function: {
      name: "task_draft_create",
      description: "Prepare a task draft for user confirmation. Does not create the task yet.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          taskTypeId: { type: "string", description: "e.g. tt-review, tt-check, tt-other" },
          priority: { type: "string", enum: ["Low", "Normal", "High"] },
          dueDate: { type: "string", description: "ISO date YYYY-MM-DD" },
          assignmentType: { type: "string", enum: ["user", "role"] },
          assigneeUserId: { type: "string" },
          assigneeRoleId: { type: "string" },
          entityType: { type: "string", description: "Optional linked record type" },
          entityId: { type: "string" },
          entityLabel: { type: "string" },
        },
        required: ["title", "assignmentType"],
      },
    },
  },
  task_draft_confirm: {
    type: "function",
    function: {
      name: "task_draft_confirm",
      description: "Confirm the pending task draft after explicit user approval. Returns the draft for creation.",
      parameters: { type: "object", properties: {} },
    },
  },
};

export function toolsForAgent(agent: AiAgentRecord): ChatCompletionTool[] {
  return (Object.keys(TOOL_DEFS) as AiToolName[])
    .filter((name) => agentHasTool(agent, name))
    .map((name) => TOOL_DEFS[name]);
}

export function isKnownTool(name: string): name is AiToolName {
  return name in TOOL_DEFS;
}
