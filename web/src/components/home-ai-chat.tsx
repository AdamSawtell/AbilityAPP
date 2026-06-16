"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { ChatMessage, ChatResponseBody, ChatThreadState } from "@/lib/ai/types";
import {
  clearHomeChatSession,
  loadHomeChatSession,
  saveHomeChatSession,
} from "@/lib/ai/chat-session-storage";
import type { TaskEntityType } from "@/lib/task";

type AgentSummary = {
  id: string;
  agentKey: string;
  name: string;
  description: string;
};

const SUGGESTIONS = [
  "How do I create a client?",
  "Find activities updated in the last 2 hours",
  "Which records were updated today?",
];

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
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [agentId, setAgentId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadState, setThreadState] = useState<ChatThreadState>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const threadStateRef = useRef(threadState);

  threadStateRef.current = threadState;
  messagesRef.current = messages;

  useEffect(() => {
    if (!session) {
      setHydrated(false);
      return;
    }
    const saved = loadHomeChatSession(session.userId, session.activeRoleId);
    if (saved) {
      setMessages(saved.messages);
      setThreadState(saved.threadState);
      if (saved.agentId) setAgentId(saved.agentId);
    } else {
      setMessages([]);
      setThreadState({});
    }
    setHydrated(true);
  }, [session?.userId, session?.activeRoleId, session]);

  useEffect(() => {
    if (!session || !hydrated) return;
    saveHomeChatSession(session.userId, session.activeRoleId, {
      agentId,
      messages,
      threadState,
    });
  }, [session, hydrated, agentId, messages, threadState]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setAgentsLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/ai/agents", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { agents: AgentSummary[]; configured: boolean };
        if (cancelled) return;
        setAgents(data.agents);
        setConfigured(data.configured);
        setAgentId((current) => {
          if (current && data.agents.some((a) => a.id === current)) return current;
          return data.agents[0]?.id ?? "";
        });
      } catch {
        // ignore
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const focusComposer = useCallback(() => {
    const el = inputRef.current;
    if (!el || !configured) return;
    el.focus({ preventScroll: true });
  }, [configured]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (hydrated && configured && !agentsLoading) {
      focusComposer();
    }
  }, [hydrated, configured, agentsLoading, focusComposer]);

  useEffect(() => {
    if (!loading) focusComposer();
  }, [loading, focusComposer]);

  const activeAgent = useMemo(() => agents.find((a) => a.id === agentId), [agents, agentId]);

  const applyCreatedTask = useCallback(
    (createdTask: NonNullable<ChatResponseBody["createdTask"]>) => {
      if (!session) return;
      const user = users.find((u) => u.id === session.userId);
      const display = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : session.displayName;
      addTask({
        title: createdTask.title,
        description: createdTask.description,
        status: "Open",
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
      });
    },
    [addTask, session, users]
  );

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || !agentId || loading) return;

      setError("");
      setLoading(true);
      setInput("");

      const userMessage: ChatMessage = { role: "user", content: text };
      const nextMessages = [...messagesRef.current, userMessage];
      messagesRef.current = nextMessages;
      setMessages(nextMessages);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            agentId,
            messages: nextMessages,
            threadState: threadStateRef.current,
          }),
        });
        const data = (await res.json()) as ChatResponseBody & { error?: string };
        if (!res.ok) {
          const rolledBack = messagesRef.current.slice(0, -1);
          messagesRef.current = rolledBack;
          setMessages(rolledBack);
          setError(data.error ?? "Could not send message");
          setInput(text);
          return;
        }
        const visible = data.messages.filter((m) => m.role === "user" || m.role === "assistant");
        messagesRef.current = visible;
        setMessages(visible);
        setThreadState(data.threadState ?? {});
        if (data.createdTask) applyCreatedTask(data.createdTask);
      } catch {
        const rolledBack = messagesRef.current.slice(0, -1);
        messagesRef.current = rolledBack;
        setMessages(rolledBack);
        setError("Network error — try again.");
        setInput(text);
      } finally {
        setLoading(false);
      }
    },
    [agentId, applyCreatedTask, input, loading]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setThreadState({});
    setError("");
    setInput("");
    if (session) clearHomeChatSession(session.userId, session.activeRoleId);
    focusComposer();
  }, [session, focusComposer]);

  if (!session) return null;

  const canSend = configured && Boolean(agentId) && !loading && Boolean(input.trim());

  return (
    <section className="mb-8 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#fdf2f8]/40 shadow-sm">
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
            disabled={agentsLoading || loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-60"
            aria-label="Choose assistant"
          >
            {agents.filter((a) => canAgent(a.id)).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {messages.length ? (
            <button
              type="button"
              onClick={resetChat}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              New chat
            </button>
          ) : null}
        </div>
      </div>

      {!configured ? (
        <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          AI chat needs <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> on the server. Until then, use
          the{" "}
          <Link href="/help" className="font-medium underline">
            how-to guide
          </Link>
          .
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-[12rem] max-h-80 flex-1 space-y-3 overflow-y-auto overscroll-y-contain bg-slate-50/60 px-4 py-4"
        aria-live="polite"
        aria-busy={loading}
      >
        {agentsLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading assistants…</p>
        ) : !messages.length ? (
          <div className="rounded-xl bg-white px-4 py-6 text-center ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-700">Try asking:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setInput(suggestion);
                    focusComposer();
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-sm text-slate-600 hover:border-[#f9a8d4] hover:bg-[#fdf2f8]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={`${m.role}-${i}-${m.content.slice(0, 24)}`} message={m} />)
        )}
        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2.5 text-sm text-slate-500 ring-1 ring-slate-200">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#d4147a]" aria-hidden />
                Thinking…
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="border-t border-slate-100 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={
              configured
                ? loading
                  ? "Waiting for reply — you can type your next message…"
                  : "Ask a question…"
                : "AI not configured"
            }
            disabled={!configured || agentsLoading || !agentId}
            className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#d4147a] focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/50 disabled:bg-slate-50"
            aria-label="Message the AI assistant"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!canSend}
            className="shrink-0 rounded-xl bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Enter to send · Shift+Enter for a new line · Conversation stays on this device until you start a new chat</p>
      </div>
    </section>
  );
}
