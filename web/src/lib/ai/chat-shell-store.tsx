"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const COLLAPSED_KEY = "abilityapp-ai-chat-collapsed";
const WIDTH_KEY = "abilityapp-ai-chat-width";
const MIN_WIDTH = 280;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 360;

type AiChatShellContextValue = {
  collapsed: boolean;
  panelWidth: number;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  setPanelWidth: (value: number | ((prev: number) => number)) => void;
};

const AiChatShellContext = createContext<AiChatShellContextValue | null>(null);

function clampWidth(value: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

export function AiChatShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [panelWidth, setPanelWidthState] = useState(DEFAULT_WIDTH);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (raw === "1") setCollapsedState(true);
      const w = Number(localStorage.getItem(WIDTH_KEY));
      if (Number.isFinite(w) && w >= MIN_WIDTH) setPanelWidthState(clampWidth(w));
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

  const setPanelWidth = useCallback((value: number | ((prev: number) => number)) => {
    setPanelWidthState((prev) => {
      const raw = typeof value === "function" ? value(prev) : value;
      const next = clampWidth(raw);
      try {
        localStorage.setItem(WIDTH_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleCollapsed]);

  const value = useMemo(
    () => ({
      collapsed: ready ? collapsed : false,
      panelWidth: ready ? panelWidth : DEFAULT_WIDTH,
      toggleCollapsed,
      setCollapsed,
      setPanelWidth,
    }),
    [collapsed, panelWidth, ready, setCollapsed, setPanelWidth, toggleCollapsed]
  );

  return <AiChatShellContext.Provider value={value}>{children}</AiChatShellContext.Provider>;
}

export function useAiChatShell() {
  const ctx = useContext(AiChatShellContext);
  if (!ctx) throw new Error("useAiChatShell must be used within AiChatShellProvider");
  return ctx;
}
