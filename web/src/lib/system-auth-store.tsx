"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SystemSession } from "@/lib/system/types";

type SystemAuthStore = {
  session: SystemSession | null;
  hydrated: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SystemAuthContext = createContext<SystemAuthStore | null>(null);

async function fetchSystemSession(): Promise<SystemSession | null> {
  const res = await fetch("/api/auth/system-session", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Could not load system session");
  const data = (await res.json()) as { session: SystemSession };
  return data.session ?? null;
}

async function createSystemSession(userId: string): Promise<SystemSession> {
  const res = await fetch("/api/auth/system-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not start system session");
  }
  const data = (await res.json()) as { session: SystemSession };
  return data.session;
}

async function clearSystemSession(): Promise<void> {
  await fetch("/api/auth/system-session", { method: "DELETE", credentials: "include" });
}

export function SystemAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SystemSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchSystemSession()
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (userId: string) => {
    const s = await createSystemSession(userId);
    setSession(s);
  }, []);

  const logout = useCallback(async () => {
    await clearSystemSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, hydrated, login, logout }),
    [session, hydrated, login, logout]
  );

  return <SystemAuthContext.Provider value={value}>{children}</SystemAuthContext.Provider>;
}

export function useSystemAuth() {
  const ctx = useContext(SystemAuthContext);
  if (!ctx) throw new Error("useSystemAuth must be used within SystemAuthProvider");
  return ctx;
}

export function useSystemAuthOptional() {
  return useContext(SystemAuthContext);
}

export function SystemAuthGate({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useSystemAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/system/login";

  useEffect(() => {
    if (!hydrated) return;
    if (!session && !isLogin) router.replace("/system/login");
    if (session && isLogin) router.replace("/system");
  }, [hydrated, session, isLogin, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
        Loading System…
      </div>
    );
  }

  if (!session && !isLogin) return null;
  return <>{children}</>;
}
