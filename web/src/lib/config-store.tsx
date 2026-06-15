"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultReferenceData,
  referenceDataMeta,
  type ReferenceDataCatalog,
  type ReferenceDataGroup,
} from "@/lib/reference-data";

type ReferenceDataStore = {
  catalog: ReferenceDataCatalog;
  getOptions: (key: string) => string[];
  setOptions: (key: string, options: string[]) => void;
  resetKey: (key: string) => void;
  resetAll: () => void;
};

const ReferenceDataContext = createContext<ReferenceDataStore | null>(null);
const STORAGE_KEY = "abilityerp-reference-data";

function mergeCatalog(overrides: ReferenceDataCatalog): ReferenceDataCatalog {
  const merged = { ...defaultReferenceData };
  for (const [key, options] of Object.entries(overrides)) {
    if (!Array.isArray(options) || !options.length) continue;
    // Legacy localStorage key from before clientStatus split
    if (key === "status") {
      merged.clientStatus = options;
    } else {
      merged[key] = options;
    }
  }
  return merged;
}

function loadOverrides(): ReferenceDataCatalog {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ReferenceDataCatalog) : {};
  } catch {
    return {};
  }
}

export function ReferenceDataProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<ReferenceDataCatalog>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setOverrides(loadOverrides());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
  }, [overrides, hydrated]);

  const catalog = useMemo(() => mergeCatalog(overrides), [overrides]);

  const getOptions = useCallback((key: string) => catalog[key] ?? defaultReferenceData[key] ?? [], [catalog]);

  const setOptions = useCallback((key: string, options: string[]) => {
    setOverrides((prev) => ({ ...prev, [key]: options.filter((o) => o.trim()) }));
  }, []);

  const resetKey = useCallback((key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => setOverrides({}), []);

  const value = useMemo(
    () => ({ catalog, getOptions, setOptions, resetKey, resetAll }),
    [catalog, getOptions, setOptions, resetKey, resetAll]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>;
}

export function useReferenceData() {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx) throw new Error("useReferenceData must be used within ReferenceDataProvider");
  return ctx;
}

export function useReferenceDataAdmin() {
  const { catalog, setOptions, resetKey, resetAll } = useReferenceData();
  const keysByGroup = useMemo(() => {
    const groups = new Map<ReferenceDataGroup, string[]>();
    for (const key of Object.keys(referenceDataMeta)) {
      const group = referenceDataMeta[key].group;
      const list = groups.get(group) ?? [];
      list.push(key);
      groups.set(group, list);
    }
    return groups;
  }, []);
  return { catalog, keysByGroup, setOptions, resetKey, resetAll };
}
