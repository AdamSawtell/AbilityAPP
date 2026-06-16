"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { ChatMessage, ChatResponseBody, ChatThreadState } from "@/lib/ai/types";
import type { TaskEntityType } from "@/lib/task";

type AgentSummary = {
  id: string;
  agentKey: string;
  name: string;
  description: string;
};

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#d4147a] text-white"
            : "bg-white text-slate-800 ring-1 ring-slate-200"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function HomeAiChat() {
  const { session, canAgent, users } = useAuth();
  const { addTask } = useData();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [configured, setConfigured] = useState(true);
  const [agentId, setAgentId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadState, setThreadState] = useState<ChatThreadState>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/ai/agents", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { agents: AgentSummary[]; configured: boolean };
        if (cancelled) return;
        setAgents(data.agents);
        setConfigured(data.configured);
        if (data.agents.length && !agentId) {
          setAgentId(data.agents[0].id);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, agentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const activeAgent = useMemo(() => agents.find((a) => a.id === agentId), [agents, agentId]);

  const applyCreatedTask = useCallback(
    (createdTask: NonNullable<ChatResponseBody["createdTask"]>) => {
      if (!session) return;
      const user = users.find((u) => u.id === session.userId);
      const display = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : session.displayName;
      const partial = {
        title: createdTask.title,
        description: createdTask.description,
        status: "Open" as const,
        taskTypeId: createdTask.taskTypeId,
        priority: createdTask.priority,
        dueDate: createdTask.dueDate,
        assignmentType: createdTask.assignmentType,
        assigneeUserId: createdTask.assigneeUserId,
        assigneeRoleId: createdTask.assigneeRoleId,
        entityType: (createdTask.entityType || "") as TaskEntityType | "",
        entityId: createdTask.entityId,
        entityLabel: createdTask.entityLabel,
        createdByUserId: session.userId,
        createdBy: display,
        updatedBy: display,
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
      };
      addTask(partial);
    },
    [addTask, session, users]
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !agentId || loading) return;

    setError("");
    setLoading(true);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agentId, messages: nextMessages, threadState }),
      });
      const data = (await res.json()) as ChatResponseBody & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send message");
        return;
      }
      setMessages(data.messages.filter((m) => m.role === "user" || m.role === "assistant"));
      setThreadState(data.threadState ?? {});
      if (data.createdTask) {
        applyCreatedTask(data.createdTask);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }, [agentId, applyCreatedTask, input, loading, messages, threadState]);

  const resetChat = () => {
    setMessages([]);
    setThreadState({});
    setError("");
  };

  if (!session || !agents.length) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#fdf2f8]/40 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">AI assistant</h2>
          <p className="text-sm text-slate-500">
            {activeAgent?.description ?? "Ask questions, search activities, or get help using the app."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              resetChat();
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            aria-label="Choose assistant"
          >
            {agents.filter((a) => canAgent(a.id)).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
          {messages.length ? (
            <button
              type="button"
              onClick={resetChat}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              New chat
            </button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <>
          {!configured ? (
            <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-900">
              AI chat needs <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> on the server. Until then,
              use the{" "}
              <Link href="/help" className="font-medium underline">
                how-to guide
              </Link>
              .
            </div>
          ) : null}

          <div className="max-h-80 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
            {!messages.length ? (
              <div className="rounded-xl bg-white px-4 py-6 text-center ring-1 ring-slate-200">
                <p className="text-sm font-medium text-slate-700">Try asking:</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  <li>How do I create a client?</li>
                  <li>Find activities mentioning ambulance updated in the last 2 hours</li>
                  <li>Which records were updated today?</li>
                </ul>
              </div>
            ) : (
              messages.map((m, i) => <MessageBubble key={`${m.role}-${i}`} message={m} />)
            )}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Thinking…
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {error ? <p className="px-5 py-2 text-sm text-red-700">{error}</p> : null}

          <div className="flex gap-2 border-t border-slate-100 bg-white px-4 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={configured ? "Ask a question…" : "AI not configured"}
              disabled={!configured || loading}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#d4147a] focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/50 disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!configured || loading || !input.trim()}
              className="rounded-xl bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
