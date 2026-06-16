import type { ChatMessage, ChatThreadState } from "@/lib/ai/types";

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
