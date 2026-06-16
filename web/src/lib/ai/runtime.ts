import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import type { AiAgentRecord, ChatMessage, ChatResponseBody, ChatThreadState } from "@/lib/ai/types";
import { logChatTurn } from "@/lib/ai/agents-api";
import { isKnownTool, toolsForAgent } from "@/lib/ai/tools/registry";
import { runHelpSearch } from "@/lib/ai/tools/help-search";
import { runActivitySearch } from "@/lib/ai/tools/activity-search";
import { runClientSearch } from "@/lib/ai/tools/client-search";
import { runRecordsUpdatedSince } from "@/lib/ai/tools/records-updated-since";
import { runTaskDraftConfirm, runTaskDraftCreate } from "@/lib/ai/tools/task-draft";

const MAX_TOOL_ROUNDS = 6;

function readOpenAiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

function openAiClient(): OpenAI {
  const apiKey = readOpenAiKey();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in Amplify environment variables (or .env.local for development) and redeploy."
    );
  }
  return new OpenAI({ apiKey });
}

function toOpenAiMessages(
  agent: AiAgentRecord,
  session: AuthSession,
  messages: ChatMessage[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const system: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
    role: "system",
    content: `${agent.systemPrompt}\n\nSigned-in user: ${session.displayName} (${session.activeRoleName}). Answer in clear, helpful prose.`,
  };

  const mapped = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  return [system, ...mapped];
}

async function executeTool(
  supabase: SupabaseClient | null,
  session: AuthSession,
  name: string,
  args: Record<string, unknown>,
  threadState: ChatThreadState
): Promise<{ result: unknown; threadState: ChatThreadState; createdTask?: ChatResponseBody["createdTask"] }> {
  if (!isKnownTool(name)) {
    return { result: { error: "Unknown tool" }, threadState };
  }

  switch (name) {
    case "help_search":
      return { result: runHelpSearch(session, String(args.query ?? ""), Number(args.limit) || 8), threadState };
    case "activity_search": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runActivitySearch(supabase, session, {
          query: String(args.query ?? ""),
          updatedWithinHours: args.updatedWithinHours as number | undefined,
          limit: Number(args.limit) || 20,
        }),
        threadState,
      };
    }
    case "client_search": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runClientSearch(supabase, session, {
          query: String(args.query ?? ""),
          limit: Number(args.limit) || 15,
        }),
        threadState,
      };
    }
    case "records_updated_since": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runRecordsUpdatedSince(supabase, session, {
          hours: Number(args.hours) || 24,
          limit: Number(args.limit) || 25,
        }),
        threadState,
      };
    }
    case "task_draft_create": {
      const out = await runTaskDraftCreate(supabase, session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "task_draft_confirm": {
      const out = runTaskDraftConfirm(session, threadState);
      const createdTask = out.task
        ? {
            title: out.task.title,
            description: out.task.description,
            taskTypeId: out.task.taskTypeId,
            priority: out.task.priority,
            dueDate: out.task.dueDate,
            assignmentType: out.task.assignmentType,
            assigneeUserId: out.task.assigneeUserId,
            assigneeRoleId: out.task.assigneeRoleId,
            entityType: out.task.entityType,
            entityId: out.task.entityId,
            entityLabel: out.task.entityLabel,
          }
        : undefined;
      return {
        result: { note: out.message, task: out.task },
        threadState: out.threadState,
        createdTask,
      };
    }
    default:
      return { result: { error: "Tool not implemented" }, threadState };
  }
}

export async function runChatTurn(options: {
  agent: AiAgentRecord;
  session: AuthSession;
  messages: ChatMessage[];
  threadState: ChatThreadState;
  supabase: SupabaseClient | null;
}): Promise<ChatResponseBody> {
  const openai = openAiClient();
  const tools = toolsForAgent(options.agent);
  let threadState = { ...options.threadState };
  let workingMessages = [...options.messages];
  const auditTools: unknown[] = [];
  let createdTask: ChatResponseBody["createdTask"];

  const openAiHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = toOpenAiMessages(
    options.agent,
    options.session,
    workingMessages
  );

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await openai.chat.completions.create({
      model: options.agent.model,
      messages: openAiHistory,
      tools: tools.length ? tools : undefined,
    });

    const choice = completion.choices[0]?.message;
    if (!choice) throw new Error("No response from the model");

    if (choice.tool_calls?.length) {
      openAiHistory.push({
        role: "assistant",
        content: choice.content ?? "",
        tool_calls: choice.tool_calls,
      });

      for (const call of choice.tool_calls) {
        if (call.type !== "function") continue;
        let parsed: Record<string, unknown> = {};
        try {
          parsed = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          parsed = {};
        }

        const executed = await executeTool(
          options.supabase,
          options.session,
          call.function.name,
          parsed,
          threadState
        );
        threadState = executed.threadState;
        if (executed.createdTask) createdTask = executed.createdTask;
        auditTools.push({ name: call.function.name, args: parsed, result: executed.result });

        const toolContent = JSON.stringify(executed.result);
        openAiHistory.push({
          role: "tool",
          tool_call_id: call.id,
          content: toolContent,
        });
        workingMessages.push({
          role: "tool",
          content: toolContent,
          toolCallId: call.id,
          name: call.function.name,
        });
      }
      continue;
    }

    const assistantText = choice.content?.trim() || "I could not generate a response.";
    const assistantMessage: ChatMessage = { role: "assistant", content: assistantText };
    workingMessages = [...workingMessages, assistantMessage];

    const lastUser = [...options.messages].reverse().find((m) => m.role === "user");
    if (options.supabase && lastUser) {
      void logChatTurn(options.supabase, {
        userId: options.session.userId,
        roleId: options.session.activeRoleId,
        agentId: options.agent.id,
        userMessage: lastUser.content,
        assistantMessage: assistantText,
        toolCalls: auditTools,
      });
    }

    return {
      message: assistantMessage,
      messages: workingMessages,
      threadState,
      agentId: options.agent.id,
      agentName: options.agent.name,
      createdTask,
    };
  }

  throw new Error("Too many tool rounds — try a simpler question.");
}

export function isAiConfigured(): boolean {
  return Boolean(readOpenAiKey());
}
