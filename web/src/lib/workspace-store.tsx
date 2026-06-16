"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type WorkspaceTabKind = "client" | "enquiry" | "employee" | "location";

export type WorkspaceTab = {
  key: string;
  kind: WorkspaceTabKind;
  recordId: string;
  label: string;
  subtitle?: string;
  dirty: boolean;
};

type WorkspaceStore = {
  tabs: WorkspaceTab[];
  openClient: (recordId: string, label: string, subtitle?: string) => void;
  openEnquiry: (recordId: string, label: string, subtitle?: string) => void;
  openEmployee: (recordId: string, label: string, subtitle?: string) => void;
  openLocation: (recordId: string, label: string, subtitle?: string) => void;
  closeTab: (key: string) => string;
  setTabDirty: (key: string, dirty: boolean) => void;
  touchTab: (key: string, label: string, subtitle?: string) => void;
};

const WorkspaceContext = createContext<WorkspaceStore | null>(null);
const STORAGE_KEY = "abilityerp-workspace-tabs";
const MAX_TABS = 12;

function tabKey(kind: WorkspaceTabKind, recordId: string) {
  return `${kind}:${recordId}`;
}

function loadTabs(): WorkspaceTab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkspaceTab[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setTabs(loadTabs());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs, hydrated]);

  const upsertTab = useCallback((tab: Omit<WorkspaceTab, "dirty"> & { dirty?: boolean }) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.key === tab.key);
      if (existing) {
        return prev.map((t) =>
          t.key === tab.key
            ? {
                ...t,
                label: tab.label,
                subtitle: tab.subtitle,
                dirty: tab.dirty ?? t.dirty,
              }
            : t
        );
      }
      const next = [...prev, { ...tab, dirty: tab.dirty ?? false }];
      return next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next;
    });
  }, []);

  const openClient = useCallback(
    (recordId: string, label: string, subtitle?: string) => {
      upsertTab({ key: tabKey("client", recordId), kind: "client", recordId, label, subtitle });
    },
    [upsertTab]
  );

  const openEnquiry = useCallback(
    (recordId: string, label: string, subtitle?: string) => {
      upsertTab({ key: tabKey("enquiry", recordId), kind: "enquiry", recordId, label, subtitle });
    },
    [upsertTab]
  );

  const openEmployee = useCallback(
    (recordId: string, label: string, subtitle?: string) => {
      upsertTab({ key: tabKey("employee", recordId), kind: "employee", recordId, label, subtitle });
    },
    [upsertTab]
  );

  const openLocation = useCallback(
    (recordId: string, label: string, subtitle?: string) => {
      upsertTab({ key: tabKey("location", recordId), kind: "location", recordId, label, subtitle });
    },
    [upsertTab]
  );

  const closeTab = useCallback((key: string): string => {
    let nextHref = "/";
    setTabs((prev) => {
      const index = prev.findIndex((t) => t.key === key);
      const remaining = prev.filter((t) => t.key !== key);
      const fallback = remaining[Math.min(index, Math.max(0, remaining.length - 1))];
      if (fallback) {
        nextHref =
          fallback.kind === "client"
            ? `/clients/${fallback.recordId}`
            : fallback.kind === "employee"
              ? `/employees/${fallback.recordId}`
              : fallback.kind === "location"
                ? `/locations/${fallback.recordId}`
                : `/enquiries/${fallback.recordId}`;
      } else {
        nextHref = key.startsWith("client:")
          ? "/clients"
          : key.startsWith("employee:")
            ? "/employees"
            : key.startsWith("location:")
              ? "/locations"
              : "/enquiries";
      }
      return remaining;
    });
    return nextHref;
  }, []);

  const setTabDirty = useCallback((key: string, dirty: boolean) => {
    setTabs((prev) => prev.map((t) => (t.key === key ? { ...t, dirty } : t)));
  }, []);

  const touchTab = useCallback((key: string, label: string, subtitle?: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.key === key ? { ...t, label, subtitle: subtitle ?? t.subtitle } : t))
    );
  }, []);

  const value = useMemo(
    () => ({ tabs, openClient, openEnquiry, openEmployee, openLocation, closeTab, setTabDirty, touchTab }),
    [tabs, openClient, openEnquiry, openEmployee, openLocation, closeTab, setTabDirty, touchTab]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

export function workspaceKey(kind: WorkspaceTabKind, recordId: string) {
  return tabKey(kind, recordId);
}
