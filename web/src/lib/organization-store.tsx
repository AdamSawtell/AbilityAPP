"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { persistRecordAudit } from "@/lib/audit-mutation";
import {
  defaultOrganization,
  normalizeOrganization,
  type OrganizationRecord,
} from "@/lib/organization";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchOrganization, saveOrganization } from "@/lib/supabase/organization-api";

type OrganizationStore = {
  organization: OrganizationRecord;
  source: "supabase" | "local";
  updateOrganization: (record: OrganizationRecord) => void;
  resetOrganization: () => void;
};

const OrganizationContext = createContext<OrganizationStore | null>(null);
const STORAGE_KEY = "abilityvua-organization";

function loadLocal(): OrganizationRecord {
  if (typeof window === "undefined") return defaultOrganization();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return defaultOrganization();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultOrganization();
    return normalizeOrganization(parsed as OrganizationRecord);
  } catch {
    return defaultOrganization();
  }
}

function persistLocal(record: OrganizationRecord) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore quota errors
  }
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<OrganizationRecord>(() => defaultOrganization());
  const [source, setSource] = useState<"supabase" | "local">("local");
  const organizationRef = useRef(organization);

  useEffect(() => {
    organizationRef.current = organization;
  });

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const remote = await fetchOrganization(supabase);
          if (!cancelled && remote) {
            setOrganization(normalizeOrganization(remote));
            setSource("supabase");
            return;
          }
        } catch {
          // fall back to local
        }
      }

      if (!cancelled) {
        setOrganization(loadLocal());
        setSource("local");
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateOrganization = useCallback(
    (record: OrganizationRecord) => {
      const before = organizationRef.current;
      const normalized = normalizeOrganization({
        ...record,
        updatedBy: record.updatedBy || "SuperUser",
      });
      const stamped = persistRecordAudit("organization", normalized, false, before);
      setOrganization(stamped);
      if (source === "local") {
        persistLocal(stamped);
      }
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void saveOrganization(supabase, stamped);
      }
    },
    [source]
  );

  const resetOrganization = useCallback(() => {
    const before = organizationRef.current;
    const defaults = defaultOrganization();
    const stamped = persistRecordAudit("organization", defaults, false, before, {
      action: "updated",
      summary: "Organisation profile reset to defaults",
    });
    setOrganization(stamped);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      persistLocal(stamped);
    }
    if (source === "supabase" && isSupabaseConfigured()) {
      const supabase = createClient();
      void saveOrganization(supabase, stamped);
    }
  }, [source]);

  const value = useMemo(
    () => ({ organization, source, updateOrganization, resetOrganization }),
    [organization, source, updateOrganization, resetOrganization]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useOrganization must be used within OrganizationProvider");
  return ctx;
}
