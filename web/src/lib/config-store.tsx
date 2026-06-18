"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  defaultReferenceData,
  referenceDataMeta,
  type ReferenceDataCatalog,
  type ReferenceDataGroup,
} from "@/lib/reference-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchReferenceCatalog, replaceReferenceOptions } from "@/lib/supabase/reference-data";

type ReferenceDataStore = {
  catalog: ReferenceDataCatalog;
  getOptions: (key: string) => string[];
  setOptions: (key: string, options: string[]) => Promise<void>;
  resetKey: (key: string) => void;
  resetAll: () => void;
  source: "supabase" | "local";
};

const ReferenceDataContext = createContext<ReferenceDataStore | null>(null);
const STORAGE_KEY = "abilityerp-reference-data";

function mergeCatalog(
  base: ReferenceDataCatalog,
  overrides: ReferenceDataCatalog
): ReferenceDataCatalog {
  const merged = { ...base };
  for (const [key, options] of Object.entries(overrides)) {
    if (!Array.isArray(options) || !options.length) continue;
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
  const [remoteCatalog, setRemoteCatalog] = useState<ReferenceDataCatalog | null>(null);
  const [overrides, setOverrides] = useState<ReferenceDataCatalog>({});
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const localOverrides = loadOverrides();
      setOverrides(localOverrides);

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const catalog = await fetchReferenceCatalog(supabase);
          if (!cancelled && Object.keys(catalog).length) {
            setRemoteCatalog(catalog);
            setSource("supabase");
            setHydrated(true);
            return;
          }
        } catch {
          // fall back to bundled defaults
        }
      }

      if (!cancelled) {
        setRemoteCatalog(null);
        setSource("local");
        setHydrated(true);
      }
    }

    queueMicrotask(() => {
      void hydrate();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || source === "supabase") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
  }, [overrides, hydrated, source]);

  const baseCatalog = remoteCatalog ?? defaultReferenceData;
  const catalog = useMemo(() => mergeCatalog(baseCatalog, overrides), [baseCatalog, overrides]);

  const getOptions = useCallback(
    (key: string) => catalog[key] ?? defaultReferenceData[key] ?? [],
    [catalog]
  );

  const setOptions = useCallback(
    async (key: string, options: string[]) => {
      const trimmed = options.filter((o) => o.trim());

      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        await replaceReferenceOptions(supabase, key, trimmed);
        const next = await fetchReferenceCatalog(supabase);
        setRemoteCatalog(next);
        return;
      }

      setOverrides((prev) => ({ ...prev, [key]: trimmed }));
    },
    [source]
  );

  const resetKey = useCallback(
    (key: string) => {
      if (source === "supabase") return;
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [source]
  );

  const resetAll = useCallback(() => {
    if (source === "supabase") return;
    setOverrides({});
  }, [source]);

  const value = useMemo(
    () => ({ catalog, getOptions, setOptions, resetKey, resetAll, source }),
    [catalog, getOptions, setOptions, resetKey, resetAll, source]
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
  const { catalog, setOptions, resetKey, resetAll, source } = useReferenceData();
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
  return { catalog, keysByGroup, setOptions, resetKey, resetAll, source };
}
