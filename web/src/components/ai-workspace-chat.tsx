"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { ChatDisplayAttachment, ChatMessage, ChatResponseBody, ChatThreadState } from "@/lib/ai/types";
import { ChatMessageContent } from "@/components/chat-message-content";
import { PrepareSaveBar } from "@/components/prepare-save-bar";
import { PrepareReviewModal } from "@/components/prepare-review-modal";
import {
  clearHomeChatSession,
  consumeChatNotice,
  consumeChatPrompt,
  loadHomeChatSession,
  saveHomeChatSession,
} from "@/lib/ai/chat-session-storage";
import { resolvePageChatContext } from "@/lib/ai/page-chat-context";
import { prefetchCoachNotesFromClients } from "@/lib/ai/activity-coach-prefetch";
import { savedActivityCardAttachment, clientActivityCoachSaveHrefFromHref } from "@/lib/ai/activity-coach-display";

type AgentSummary = {
  id: string;
  agentKey: string;
  name: string;
  description: string;
};

type UiMessage = ChatMessage & { attachments?: ChatDisplayAttachment[] };

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser ? "bg-[#d4147a] text-white" : "bg-white text-slate-800 ring-1 ring-slate-200"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <ChatMessageContent content={message.content} attachments={message.attachments} />
        )}
      </div>
    </div>
  );
}

export function AiWorkspaceChat({ className = "" }: { className?: string }) {
  const { session, canAgent } = useAuth();
  const { clients, enquiries, tasks, incidents, refreshFromRemote } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [agentId, setAgentId] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [threadState, setThreadState] = useState<ChatThreadState>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastWrite, setLastWrite] = useState<ChatResponseBody["writeResult"]>();
  const [prepareModalOpen, setPrepareModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prepareBarRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<UiMessage[]>([]);
  const threadStateRef = useRef(threadState);
  const lastPathRef = useRef("");

  const pageCtx = useMemo(
    () => resolvePageChatContext(pathname, { clients, enquiries, tasks, incidents }),
    [pathname, clients, enquiries, tasks, incidents]
  );

  useEffect(() => {
    threadStateRef.current = threadState;
    messagesRef.current = messages;
  }, [threadState, messages]);

  useEffect(() => {
    if (!hydrated) return;
    const prefetched = prefetchCoachNotesFromClients(clients, pathname);
    setThreadState((prev) => {
      const nextPrefetch = prefetched ?? null;
      const clientChanged =
        prev.activityCoachClient?.id &&
        nextPrefetch?.clientId &&
        prev.activityCoachClient.id !== nextPrefetch.clientId;
      return {
        ...prev,
        activityCoachPrefetchedNotes: nextPrefetch,
        ...(clientChanged
          ? {
              activityCoachClient: undefined,
              activityCoachClientConfirmed: false,
              activityCoachNotesReviewed: false,
            }
          : {}),
      };
    });
  }, [hydrated, pathname, clients]);

  const appendNoticeIfAny = useCallback(() => {
    if (!session) return;
    const notice = consumeChatNotice(session.userId, session.activeRoleId);
    if (!notice) return;
    const assistantMsg: UiMessage = { role: "assistant", content: notice.message };
    setMessages((prev) => {
      const next = [...prev, assistantMsg];
      messagesRef.current = next;
      return next;
    });
    setLastWrite(undefined);
  }, [session]);

  useEffect(() => {
    if (!session) {
      startTransition(() => setHydrated(false));
      return;
    }
    const saved = loadHomeChatSession(session.userId, session.activeRoleId);
    startTransition(() => {
      if (saved) {
        setMessages(saved.messages);
        setThreadState(saved.threadState);
        if (saved.agentId) setAgentId(saved.agentId);
      } else {
        setMessages([]);
        setThreadState({});
      }
      setHydrated(true);
    });
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
    if (!hydrated) return;
    appendNoticeIfAny();
  }, [hydrated, pathname, appendNoticeIfAny]);

  useEffect(() => {
    if (!session) return;
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; roleId: string }>).detail;
      if (detail?.userId === session.userId && detail?.roleId === session.activeRoleId) {
        appendNoticeIfAny();
      }
    };
    window.addEventListener("abilityapp-chat-notice", onNotice);
    return () => window.removeEventListener("abilityapp-chat-notice", onNotice);
  }, [session, appendNoticeIfAny]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    startTransition(() => setAgentsLoading(true));
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

  useEffect(() => {
    if (!hydrated || !pageCtx.preferredAgentId) return;
    const moduleChanged = lastPathRef.current.split("/")[1] !== pathname.split("/")[1];
    lastPathRef.current = pathname;
    if (messages.length > 0 && !moduleChanged) return;
    if (canAgent(pageCtx.preferredAgentId)) {
      setAgentId(pageCtx.preferredAgentId);
    }
  }, [pathname, hydrated, pageCtx.preferredAgentId, canAgent, messages.length]);

  const focusComposer = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (lastWrite?.href && lastWrite.kind.endsWith("_prepare")) {
      prepareBarRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (lastWrite?.preview) setPrepareModalOpen(true);
  }, [lastWrite]);

  useEffect(() => {
    if (hydrated && configured && !agentsLoading) focusComposer();
  }, [hydrated, configured, agentsLoading, focusComposer]);

  const activeAgent = useMemo(() => agents.find((a) => a.id === agentId), [agents, agentId]);
  const suggestions = pageCtx.suggestions;
  const showAgentPicker = agents.filter((a) => canAgent(a.id)).length > 1;

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
            pagePath: pathname,
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
        const visible = data.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m, i, arr) => {
            const isLastAssistant = m.role === "assistant" && i === arr.length - 1;
            return isLastAssistant && data.attachments?.length
              ? { ...m, attachments: data.attachments }
              : m;
          }) as UiMessage[];
        messagesRef.current = visible;
        setMessages(visible);
        setThreadState(data.threadState ?? {});
        if (data.writeResult) setLastWrite(data.writeResult);
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
    [agentId, input, loading, pathname]
  );

  const applyPromptIfAny = useCallback(() => {
    if (!session) return;
    const prompt = consumeChatPrompt(session.userId, session.activeRoleId);
    if (!prompt) return;
    if (prompt.autoSend) {
      void sendMessage(prompt.text);
    } else {
      setInput(prompt.text);
      focusComposer();
    }
  }, [session, focusComposer, sendMessage]);

  useEffect(() => {
    if (!hydrated) return;
    applyPromptIfAny();
  }, [hydrated, applyPromptIfAny]);

  useEffect(() => {
    if (!session) return;
    const onPrompt = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; roleId: string }>).detail;
      if (detail?.userId === session.userId && detail?.roleId === session.activeRoleId) {
        applyPromptIfAny();
      }
    };
    window.addEventListener("abilityapp-chat-prompt", onPrompt);
    return () => window.removeEventListener("abilityapp-chat-prompt", onPrompt);
  }, [session, applyPromptIfAny]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setThreadState({});
    setError("");
    setInput("");
    setLastWrite(undefined);
    setPrepareModalOpen(false);
    if (session) clearHomeChatSession(session.userId, session.activeRoleId);
    focusComposer();
  }, [session, focusComposer]);

  if (!session) return null;

  const canSend = configured && Boolean(agentId) && !loading && Boolean(input.trim());
  const prepareLink = lastWrite?.href && lastWrite.kind.endsWith("_prepare");

  const handleActivitySaved = useCallback(
    (result: { clientName?: string; subject?: string; href?: string }) => {
      setPrepareModalOpen(false);
      setLastWrite(undefined);
      setThreadState({});
      void refreshFromRemote();

      const href = result.href ?? "";
      const clientName = result.clientName ?? "the client";
      const subject = result.subject ?? "Activity note";
      const attachments: ChatDisplayAttachment[] = href
        ? [savedActivityCardAttachment({ clientName, subject, href })]
        : [];

      const assistantMsg: UiMessage = {
        role: "assistant",
        content: `**Step 5 — Saved.** The activity note for ${clientName} is on their Activity tab. Open the link below to review it on the record.`,
        attachments: attachments.length ? attachments : undefined,
      };
      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        messagesRef.current = next;
        return next;
      });

      if (href) {
        router.push(clientActivityCoachSaveHrefFromHref(href));
      }
    },
    [refreshFromRemote, router]
  );

  return (
    <>
    <div className={`flex min-h-0 flex-col bg-slate-50/80 ${className}`}>
      <div className="shrink-0 border-b border-slate-100 bg-white px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">{activeAgent?.name ?? "AI assistant"}</p>
        <p className="text-xs text-slate-500 line-clamp-2">
          {activeAgent?.description ?? "Ask questions or prepare records to review and save."}
        </p>
        {showAgentPicker ? (
          <select
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              resetChat();
            }}
            disabled={agentsLoading || loading}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
            aria-label="Choose assistant"
          >
            {agents.filter((a) => canAgent(a.id)).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        ) : null}
        {messages.length ? (
          <button
            type="button"
            onClick={resetChat}
            disabled={loading}
            className="mt-2 text-xs text-slate-500 hover:text-[#b51266]"
          >
            New chat
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Viewing</p>
        <p className="truncate text-xs font-medium text-slate-800">{pageCtx.viewingLabel}</p>
        <p className="mt-1 text-[10px] text-slate-500">{pageCtx.capabilities.join(" · ")}</p>
      </div>

      {!configured ? (
        <div className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Set <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> to enable chat.
        </div>
      ) : null}

      {prepareLink ? (
        <div className="shrink-0 border-b border-[#f9a8d4]/50 bg-[#fdf2f8] px-3 py-2">
          <p className="text-xs font-medium text-[#b51266]">Draft ready — review the activity below</p>
          <p className="mt-0.5 truncate text-xs text-slate-700">{lastWrite!.label}</p>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain px-3 py-3"
        aria-live="polite"
        aria-busy={loading}
      >
        {agentsLoading ? (
          <p className="py-6 text-center text-xs text-slate-500">Loading…</p>
        ) : !messages.length ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Try on this page:</p>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void sendMessage(suggestion)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs text-slate-600 hover:border-[#f9a8d4]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={`${m.role}-${i}-${m.content.slice(0, 24)}`} message={m} />)
        )}
        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
              Thinking…
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p> : null}

      {prepareLink && lastWrite ? (
        <div ref={prepareBarRef}>
          <PrepareSaveBar writeResult={lastWrite} onSaved={handleActivitySaved} />
        </div>
      ) : null}

      <div className="shrink-0 border-t border-slate-200 bg-white p-2">
        <p className="mb-1.5 text-[10px] text-slate-400">Assistants prepare records — you save them.</p>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={configured ? "Ask or describe what to prepare…" : "AI not configured"}
            disabled={!configured || agentsLoading || !agentId}
            className="max-h-28 min-h-[44px] min-w-0 flex-1 resize-y rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:border-[#d4147a] focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/40 disabled:bg-slate-50"
            aria-label="Message the AI assistant"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!canSend}
            className="shrink-0 rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
    {lastWrite?.preview && prepareModalOpen ? (
      <PrepareReviewModal
        open={prepareModalOpen}
        writeResult={lastWrite}
        onClose={() => setPrepareModalOpen(false)}
        onSaved={handleActivitySaved}
      />
    ) : null}
    </>
  );
}
