"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_ORGANIZATION_TIMEZONE, normalizeOrganizationTimezone } from "@/lib/system-timezone";

type SystemTimezoneContextValue = {
  timezone: string;
  loading: boolean;
  canConfigure: boolean;
  configureHref: string;
  refresh: () => Promise<void>;
};

const SystemTimezoneContext = createContext<SystemTimezoneContextValue | null>(null);

const LOCAL_TIMEZONE_KEY = "abilityapp-organization-timezone";

function loadLocalTimezone(): string {
  if (typeof window === "undefined") return DEFAULT_ORGANIZATION_TIMEZONE;
  try {
    return normalizeOrganizationTimezone(localStorage.getItem(LOCAL_TIMEZONE_KEY));
  } catch {
    return DEFAULT_ORGANIZATION_TIMEZONE;
  }
}

export function SystemTimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezone] = useState(DEFAULT_ORGANIZATION_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [canConfigure, setCanConfigure] = useState(false);
  const [configureHref, setConfigureHref] = useState("/system/settings/time-and-date");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/timezone", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as {
          timezone?: string;
          canConfigure?: boolean;
          configureHref?: string;
        };
        const next = normalizeOrganizationTimezone(data.timezone ?? loadLocalTimezone());
        setTimezone(next);
        setCanConfigure(Boolean(data.canConfigure));
        if (data.configureHref?.trim()) setConfigureHref(data.configureHref);
      } else {
        setTimezone(loadLocalTimezone());
        setCanConfigure(false);
      }
    } catch {
      setTimezone(loadLocalTimezone());
      setCanConfigure(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    const onTimezoneChanged = () => {
      void refresh();
    };
    window.addEventListener("abilityapp-timezone-changed", onTimezoneChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("abilityapp-timezone-changed", onTimezoneChanged);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ timezone, loading, canConfigure, configureHref, refresh }),
    [timezone, loading, canConfigure, configureHref, refresh]
  );

  return <SystemTimezoneContext.Provider value={value}>{children}</SystemTimezoneContext.Provider>;
}

export function useSystemTimezone() {
  const ctx = useContext(SystemTimezoneContext);
  if (!ctx) throw new Error("useSystemTimezone must be used within SystemTimezoneProvider");
  return ctx;
}

export function useSystemTimezoneOptional() {
  return useContext(SystemTimezoneContext);
}
