"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const COLLAPSED_KEY = "abilityapp-ai-chat-collapsed";

type AiChatShellContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
};

const AiChatShellContext = createContext<AiChatShellContextValue | null>(null);

export function AiChatShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (raw === "1") setCollapsedState(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      collapsed: ready ? collapsed : false,
      toggleCollapsed,
      setCollapsed,
    }),
    [collapsed, ready, setCollapsed, toggleCollapsed]
  );

  return <AiChatShellContext.Provider value={value}>{children}</AiChatShellContext.Provider>;
}

export function useAiChatShell() {
  const ctx = useContext(AiChatShellContext);
  if (!ctx) throw new Error("useAiChatShell must be used within AiChatShellProvider");
  return ctx;
}
