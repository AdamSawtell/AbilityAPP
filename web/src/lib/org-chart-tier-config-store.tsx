"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  activeOrgChartTiers,
  DEFAULT_ORG_CHART_TIER_OPTIONS,
  orgChartTierLabelFromConfig,
  type OrgChartTierConfigRecord,
} from "@/lib/org-chart-tier-config";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchOrgChartTierConfig,
  saveOrgChartTierConfig,
} from "@/lib/supabase/org-chart-tier-config-api";

type OrgChartTierConfigStore = {
  tiers: OrgChartTierConfigRecord[];
  activeTiers: OrgChartTierConfigRecord[];
  hydrated: boolean;
  source: "supabase" | "local";
  tierLabel: (tier: number) => string;
  upsertTier: (record: OrgChartTierConfigRecord) => void;
};

const OrgChartTierConfigContext = createContext<OrgChartTierConfigStore | null>(null);

export function OrgChartTierConfigProvider({ children }: { children: React.ReactNode }) {
  const [tiers, setTiers] = useState<OrgChartTierConfigRecord[]>(DEFAULT_ORG_CHART_TIER_OPTIONS);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const data = await fetchOrgChartTierConfig(supabase);
          if (!cancelled && data.length) {
            setTiers(data);
            setSource("supabase");
            setHydrated(true);
            return;
          }
        } catch {
          // fall through
        }
      }

      if (!cancelled) {
        setTiers(DEFAULT_ORG_CHART_TIER_OPTIONS);
        setSource("local");
        setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertTier = useCallback(
    (record: OrgChartTierConfigRecord) => {
      setTiers((prev) => {
        const next = [...prev.filter((t) => t.tier !== record.tier), record].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.tier - b.tier
        );
        return next;
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void saveOrgChartTierConfig(supabase, record);
      }
    },
    [source]
  );

  const activeTiers = useMemo(() => activeOrgChartTiers(tiers), [tiers]);
  const tierLabel = useCallback(
    (tier: number) => orgChartTierLabelFromConfig(tiers, tier),
    [tiers]
  );

  const value = useMemo(
    () => ({ tiers, activeTiers, hydrated, source, tierLabel, upsertTier }),
    [tiers, activeTiers, hydrated, source, tierLabel, upsertTier]
  );

  return (
    <OrgChartTierConfigContext.Provider value={value}>{children}</OrgChartTierConfigContext.Provider>
  );
}

export function useOrgChartTierConfig() {
  const ctx = useContext(OrgChartTierConfigContext);
  if (!ctx) throw new Error("useOrgChartTierConfig must be used within OrgChartTierConfigProvider");
  return ctx;
}
