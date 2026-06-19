import type { ChatMessage, ChatThreadState } from "@/lib/ai/types";

const NOTICE_PREFIX = "abilityapp-ai-chat-notice";
const PROMPT_PREFIX = "abilityapp-ai-chat-prompt";

export type PendingChatNotice = {
  message: string;
  at: string;
};

export type PendingChatPrompt = {
  text: string;
  autoSend: boolean;
  at: string;
};

function noticeKey(userId: string, roleId: string) {
  return `${NOTICE_PREFIX}:${userId}:${roleId}`;
}

export function queueChatNotice(userId: string, roleId: string, message: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      noticeKey(userId, roleId),
      JSON.stringify({ message, at: new Date().toISOString() } satisfies PendingChatNotice)
    );
    window.dispatchEvent(
      new CustomEvent("abilityapp-chat-notice", { detail: { userId, roleId } })
    );
  } catch {
    // ignore
  }
}

function promptKey(userId: string, roleId: string) {
  return `${PROMPT_PREFIX}:${userId}:${roleId}`;
}

/** Queue a prompt for the sidebar assistant (prefill or auto-send). */
export function queueChatPrompt(
  userId: string,
  roleId: string,
  text: string,
  autoSend = true
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      promptKey(userId, roleId),
      JSON.stringify({ text, autoSend, at: new Date().toISOString() } satisfies PendingChatPrompt)
    );
    window.dispatchEvent(
      new CustomEvent("abilityapp-chat-prompt", { detail: { userId, roleId } })
    );
  } catch {
    // ignore
  }
}

export function consumeChatPrompt(userId: string, roleId: string): PendingChatPrompt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(promptKey(userId, roleId));
    if (!raw) return null;
    sessionStorage.removeItem(promptKey(userId, roleId));
    const parsed = JSON.parse(raw) as PendingChatPrompt;
    if (!parsed?.text?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function consumeChatNotice(userId: string, roleId: string): PendingChatNotice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(noticeKey(userId, roleId));
    if (!raw) return null;
    sessionStorage.removeItem(noticeKey(userId, roleId));
    const parsed = JSON.parse(raw) as PendingChatNotice;
    if (!parsed?.message) return null;
    return parsed;
  } catch {
    return null;
  }
}

const STORAGE_PREFIX = "abilityapp-ai-chat";

export type PersistedHomeChat = {
  agentId: string;
  messages: ChatMessage[];
  threadState: ChatThreadState;
  updatedAt: string;
};

function storageKey(userId: string, roleId: string) {
  return `${STORAGE_PREFIX}:${userId}:${roleId}`;
}

function readRaw(key: string): PersistedHomeChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedHomeChat;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.messages)) return null;
    return {
      agentId: String(parsed.agentId ?? ""),
      messages: parsed.messages.filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      ),
      threadState: parsed.threadState ?? {},
      updatedAt: String(parsed.updatedAt ?? ""),
    };
  } catch {
    return null;
  }
}

export function loadHomeChatSession(userId: string, roleId: string): PersistedHomeChat | null {
  return readRaw(storageKey(userId, roleId));
}

export function saveHomeChatSession(
  userId: string,
  roleId: string,
  data: Omit<PersistedHomeChat, "updatedAt">
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      storageKey(userId, roleId),
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // quota or private mode
  }
}

export function clearHomeChatSession(userId: string, roleId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(userId, roleId));
  } catch {
    // ignore
  }
}
