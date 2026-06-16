import OpenAI from "openai";
import type { AuthSession } from "@/lib/access/types";
import type { AiAgentRecord, AiWriteResult, ChatMessage, ChatResponseBody, ChatThreadState } from "@/lib/ai/types";
import { attachmentsFromToolAudit } from "@/lib/ai/display";
import type { AiDatabase } from "@/lib/ai/db";
import { logChatTurn } from "@/lib/ai/agents-api";
import { persistAiTask } from "@/lib/ai/persist";
import { isKnownTool, toolsForAgent } from "@/lib/ai/tools/registry";
import { runHelpSearch } from "@/lib/ai/tools/help-search";
import { runActivitySearch } from "@/lib/ai/tools/activity-search";
import { runClientSearch } from "@/lib/ai/tools/client-search";
import { runClientGet } from "@/lib/ai/tools/client-get";
import { runClientListRecent } from "@/lib/ai/tools/client-list-recent";
import { runClientPatchDraftConfirm, runClientPatchDraftCreate } from "@/lib/ai/tools/client-patch";
import { runRecordsUpdatedSince } from "@/lib/ai/tools/records-updated-since";
import { runTaskSearch } from "@/lib/ai/tools/task-search";
import { runTaskDraftConfirm, runTaskDraftCreate } from "@/lib/ai/tools/task-draft";
import { runTaskUpdateDraftConfirm, runTaskUpdateDraftCreate } from "@/lib/ai/tools/task-update";
import { runClientDraftConfirm, runClientDraftCreate } from "@/lib/ai/tools/client-draft";
import {
  runClientActivityDraftConfirm,
  runClientActivityDraftCreate,
} from "@/lib/ai/tools/client-activity";
import { runEnquirySearch } from "@/lib/ai/tools/enquiry-search";
import { runEnquiryGet } from "@/lib/ai/tools/enquiry-get";
import { runEnquiryDraftConfirm, runEnquiryDraftCreate } from "@/lib/ai/tools/enquiry-draft";
import {
  runEnquiryConvertDraftConfirm,
  runEnquiryConvertDraftCreate,
} from "@/lib/ai/tools/enquiry-convert";
import { runIncidentSearch } from "@/lib/ai/tools/incident-search";
import { runIncidentDraftConfirm, runIncidentDraftCreate } from "@/lib/ai/tools/incident-draft";
import { persistAiIncident } from "@/lib/ai/persist";

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
  db: AiDatabase | null,
  name: string,
  args: Record<string, unknown>,
  threadState: ChatThreadState
): Promise<{
  result: unknown;
  threadState: ChatThreadState;
  createdTask?: ChatResponseBody["createdTask"];
  updatedTask?: ChatResponseBody["updatedTask"];
  createdClient?: ChatResponseBody["createdClient"];
  createdEnquiry?: ChatResponseBody["createdEnquiry"];
  writeResult?: AiWriteResult;
}> {
  const supabase = db?.client ?? null;
  const session = db?.session;
  if (!session) {
    return { result: { error: "Session required" }, threadState };
  }

  if (!isKnownTool(name)) {
    return { result: { error: "Unknown tool" }, threadState };
  }

  void db?.logAccess({ tool: name, action: "call", target: JSON.stringify(args).slice(0, 200) });

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
          sortBy: args.sortBy === "updated" ? "updated" : "name",
        }),
        threadState,
      };
    }
    case "client_get": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runClientGet(supabase, session, {
          clientId: args.clientId as string | undefined,
          searchKey: args.searchKey as string | undefined,
          name: args.name as string | undefined,
        }),
        threadState,
      };
    }
    case "client_list_recent": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runClientListRecent(supabase, session, {
          hours: Number(args.hours) || 168,
          limit: Number(args.limit) || 20,
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
    case "task_search": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runTaskSearch(supabase, session, {
          query: String(args.query ?? ""),
          status: String(args.status ?? ""),
          limit: Number(args.limit) || 15,
          sortBy: args.sortBy === "due" ? "due" : "updated",
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
      if (!out.task) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      if (!supabase) {
        return { result: { error: "Database not configured" }, threadState: out.threadState };
      }
      const saved = await persistAiTask(supabase, session, out.task);
      if (!saved.ok) {
        return { result: { error: saved.error }, threadState: out.threadState };
      }
      return {
        result: {
          note: "Task saved to database.",
          task: { id: saved.record.id, documentNo: saved.record.documentNo, title: saved.record.title },
        },
        threadState: out.threadState,
        createdTask: saved.record,
        writeResult: {
          kind: "task",
          label: `${saved.record.documentNo} — ${saved.record.title}`,
          href: saved.href ?? `/tasks/${saved.record.id}`,
        },
      };
    }
    case "client_draft_create": {
      const out = await runClientDraftCreate(session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "client_draft_confirm": {
      const out = await runClientDraftConfirm(supabase, session, threadState);
      if (!out.client) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: {
          note: out.message,
          client: { id: out.client.id, name: out.client.name, searchKey: out.client.searchKey },
        },
        threadState: out.threadState,
        createdClient: out.client,
        writeResult: {
          kind: "client",
          label: out.client.name,
          href: out.href ?? `/clients/${out.client.searchKey}`,
        },
      };
    }
    case "client_activity_draft_create": {
      const out = await runClientActivityDraftCreate(supabase, session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "client_activity_draft_confirm": {
      const out = await runClientActivityDraftConfirm(supabase, session, threadState);
      if (!out.activity) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: { note: out.message, activity: out.activity },
        threadState: out.threadState,
        writeResult: {
          kind: "client_activity",
          label: out.activity.subject,
          href: out.href ?? "",
        },
      };
    }
    case "client_patch_draft_create": {
      const out = await runClientPatchDraftCreate(supabase, session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "client_patch_draft_confirm": {
      const out = await runClientPatchDraftConfirm(supabase, session, threadState);
      if (!out.client) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: { note: out.message, client: { id: out.client.id, name: out.client.name } },
        threadState: out.threadState,
        createdClient: out.client,
        writeResult: {
          kind: "client_patch",
          label: `Updated ${out.client.name}`,
          href: out.href ?? `/clients/${out.client.searchKey}`,
        },
      };
    }
    case "task_update_draft_create": {
      const out = await runTaskUpdateDraftCreate(supabase, session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "task_update_draft_confirm": {
      const out = await runTaskUpdateDraftConfirm(supabase, session, threadState);
      if (!out.task) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: { note: out.message, task: { id: out.task.id, title: out.task.title } },
        threadState: out.threadState,
        updatedTask: out.task,
        writeResult: {
          kind: "task_update",
          label: `${out.task.documentNo} — ${out.task.title}`,
          href: out.href ?? `/tasks/${out.task.id}`,
        },
      };
    }
    case "enquiry_search": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runEnquirySearch(supabase, session, {
          query: String(args.query ?? ""),
          limit: Number(args.limit) || 15,
          sortBy: args.sortBy === "updated" ? "updated" : "name",
        }),
        threadState,
      };
    }
    case "enquiry_get": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runEnquiryGet(supabase, session, {
          enquiryId: args.enquiryId as string | undefined,
          documentNo: args.documentNo as string | undefined,
          name: args.name as string | undefined,
        }),
        threadState,
      };
    }
    case "enquiry_draft_create": {
      const out = await runEnquiryDraftCreate(session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "enquiry_draft_confirm": {
      const out = await runEnquiryDraftConfirm(supabase, session, threadState);
      if (!out.enquiry) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: { note: out.message, enquiry: { id: out.enquiry.id, documentNo: out.enquiry.documentNo } },
        threadState: out.threadState,
        createdEnquiry: out.enquiry,
        writeResult: {
          kind: "enquiry",
          label: `Enquiry ${out.enquiry.documentNo}`,
          href: out.href ?? `/enquiries/${out.enquiry.id}`,
        },
      };
    }
    case "enquiry_convert_draft_create": {
      const out = await runEnquiryConvertDraftCreate(supabase, session, args, threadState);
      return {
        result: { summary: out.summary, note: out.message, enquiryId: out.enquiryId },
        threadState: out.threadState,
      };
    }
    case "enquiry_convert_draft_confirm": {
      const out = await runEnquiryConvertDraftConfirm(supabase, session, threadState);
      if (!out.client) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: { note: out.message, client: { id: out.client.id, name: out.client.name } },
        threadState: out.threadState,
        createdClient: out.client,
        writeResult: {
          kind: "enquiry_convert",
          label: out.client.name,
          href: out.href ?? `/clients/${out.client.searchKey}`,
        },
      };
    }
    case "incident_search": {
      if (!supabase) return { result: { error: "Database not configured" }, threadState };
      return {
        result: await runIncidentSearch(supabase, session, {
          query: String(args.query ?? ""),
          status: String(args.status ?? ""),
          reportableOnly: Boolean(args.reportableOnly),
          limit: Number(args.limit) || 15,
        }),
        threadState,
      };
    }
    case "incident_draft_create": {
      const out = await runIncidentDraftCreate(supabase, session, args, threadState);
      return {
        result: { draft: out.draft, summary: out.summary, note: out.message },
        threadState: out.threadState,
      };
    }
    case "incident_draft_confirm": {
      const out = await runIncidentDraftConfirm(supabase, session, threadState, (draft) =>
        persistAiIncident(supabase!, session, draft)
      );
      if (!out.incident) {
        return { result: { note: out.message }, threadState: out.threadState };
      }
      return {
        result: {
          note: out.message,
          incident: { id: out.incident.id, documentNo: out.incident.documentNo, title: out.incident.title },
        },
        threadState: out.threadState,
        writeResult: {
          kind: "incident",
          label: `${out.incident.documentNo} — ${out.incident.title}`,
          href: out.href ?? `/incidents/${out.incident.id}`,
        },
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
  db: AiDatabase | null;
}): Promise<ChatResponseBody> {
  const openai = openAiClient();
  const tools = toolsForAgent(options.agent);
  let threadState = { ...options.threadState };
  let workingMessages = [...options.messages];
  const auditTools: { name: string; args: Record<string, unknown>; result: unknown }[] = [];
  let createdTask: ChatResponseBody["createdTask"];
  let updatedTask: ChatResponseBody["updatedTask"];
  let createdClient: ChatResponseBody["createdClient"];
  let createdEnquiry: ChatResponseBody["createdEnquiry"];
  let writeResult: AiWriteResult | undefined;

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

        const executed = await executeTool(options.db, call.function.name, parsed, threadState);
        threadState = executed.threadState;
        if (executed.createdTask) createdTask = executed.createdTask;
        if (executed.updatedTask) updatedTask = executed.updatedTask;
        if (executed.createdClient) createdClient = executed.createdClient;
        if (executed.createdEnquiry) createdEnquiry = executed.createdEnquiry;
        if (executed.writeResult) writeResult = executed.writeResult;
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
    if (options.db?.client && lastUser) {
      void logChatTurn(options.db.client, {
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
      updatedTask,
      createdClient,
      createdEnquiry,
      writeResult,
      attachments: attachmentsFromToolAudit(auditTools),
    };
  }

  throw new Error("Too many tool rounds — try a simpler question.");
}

export function isAiConfigured(): boolean {
  return Boolean(readOpenAiKey());
}
