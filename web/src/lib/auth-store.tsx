"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AppRoleRecord, AppUserRecord, AuthSession } from "@/lib/access/types";
import { userInitials } from "@/lib/access/types";
import { canAccessWindow, processById } from "@/lib/access/catalog";
import { canAccessReport } from "@/lib/reports/catalog";
import { SEED_ROLES, SEED_USERS, withSeedTaskAccess } from "@/lib/access/seed";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRoles,
  fetchUsers,
  saveRole,
} from "@/lib/supabase/access-api";

const LEGACY_SESSION_KEY = "abilityerp-auth-session";

type AuthStore = {
  session: AuthSession | null;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  hydrated: boolean;
  source: "supabase" | "local";
  login: (userId: string, roleId: string) => Promise<void>;
  authenticate: (username: string, password: string) => Promise<AppUserRecord>;
  logout: () => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  canWindow: (key: string) => boolean;
  canProcess: (processId: string) => boolean;
  canReport: (reportId: string) => boolean;
  canAgent: (agentId: string) => boolean;
  upsertUser: (user: AppUserRecord, options?: { password?: string }) => Promise<void>;
  upsertRole: (role: AppRoleRecord) => Promise<void>;
  userInitials: string;
  availableRolesForUser: (userId: string) => AppRoleRecord[];
};

const AuthContext = createContext<AuthStore | null>(null);

function normalizeSession(raw: AuthSession): AuthSession {
  return {
    ...raw,
    taskTypePermissions: raw.taskTypePermissions ?? [],
    reportIds: raw.reportIds ?? [],
    agentIds: raw.agentIds ?? [],
  };
}

async function fetchSessionFromApi(): Promise<AuthSession | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Could not load session");
  const data = (await res.json()) as { session: AuthSession };
  return data.session ? normalizeSession(data.session) : null;
}

async function createSessionViaApi(userId: string, roleId: string): Promise<AuthSession> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, roleId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not start a session with that role");
  }
  const data = (await res.json()) as { session: AuthSession };
  return normalizeSession(data.session);
}

async function switchSessionRoleViaApi(roleId: string): Promise<AuthSession> {
  const res = await fetch("/api/auth/session", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ roleId }),
  });
  if (!res.ok) throw new Error("Invalid role");
  const data = (await res.json()) as { session: AuthSession };
  return normalizeSession(data.session);
}

async function clearSessionViaApi(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUserRecord[]>(SEED_USERS);
  const [roles, setRoles] = useState<AppRoleRecord[]>(SEED_ROLES);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LEGACY_SESSION_KEY);
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const [dbUsers, dbRoles] = await Promise.all([fetchUsers(supabase), fetchRoles(supabase)]);
          if (!cancelled && dbUsers.length) {
            setUsers(dbUsers);
            setRoles(dbRoles.map(withSeedTaskAccess));
            setSource("supabase");
          }
        } catch {
          // fall through to seed data
        }
      }

      if (!cancelled) {
        if (!isSupabaseConfigured()) {
          setUsers(SEED_USERS);
          setRoles(SEED_ROLES.map(withSeedTaskAccess));
          setSource("local");
        }

        try {
          const active = await fetchSessionFromApi();
          if (!cancelled && active) setSession(active);
        } catch {
          // no session cookie
        }

        if (!cancelled) setHydrated(true);
      }
    }

    queueMicrotask(() => {
      void hydrate();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (userId: string, roleId: string) => {
    const next = await createSessionViaApi(userId, roleId);
    setSession(next);
  }, []);

  const authenticate = useCallback(
    async (username: string, password: string): Promise<AppUserRecord> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        throw new Error("Invalid username or password");
      }
      const data = (await res.json()) as { user: AppUserRecord };
      const user = data.user;
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === user.id);
        return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
      });
      return user;
    },
    []
  );

  const logout = useCallback(async () => {
    await clearSessionViaApi();
    setSession(null);
  }, []);

  const switchRole = useCallback(async (roleId: string) => {
    const next = await switchSessionRoleViaApi(roleId);
    setSession(next);
  }, []);

  const canWindow = useCallback(
    (key: string) => (session ? canAccessWindow(session.windowKeys, key) : false),
    [session]
  );
  const canProcess = useCallback(
    (processId: string) => {
      if (!session?.processIds.includes(processId)) return false;
      const proc = processById(processId);
      if (proc?.parentWindowKey && !canAccessWindow(session.windowKeys, proc.parentWindowKey)) return false;
      return true;
    },
    [session]
  );

  const canReport = useCallback(
    (reportId: string) => {
      if (!session) return false;
      return canAccessReport(session.reportIds ?? [], session.windowKeys, reportId, (key) =>
        canAccessWindow(session.windowKeys, key)
      );
    },
    [session]
  );

  const canAgent = useCallback(
    (agentId: string) => (session?.agentIds ?? []).includes(agentId),
    [session]
  );

  const upsertUser = useCallback(
    async (user: AppUserRecord, options?: { password?: string }) => {
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === user.id);
        return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        const res = await fetch("/api/auth/system-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user, password: options?.password }),
        });
        if (!res.ok) throw new Error("Could not save system access");
      }
    },
    [source]
  );

  const upsertRole = useCallback(
    async (role: AppRoleRecord) => {
      setRoles((prev) => {
        const exists = prev.some((r) => r.id === role.id);
        return exists ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role];
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        await saveRole(createClient(), role);
      }
      if (session?.activeRoleId === role.id) {
        try {
          const next = await fetchSessionFromApi();
          if (next) setSession(next);
        } catch {
          // keep existing session
        }
      }
    },
    [source, session?.activeRoleId]
  );

  const availableRolesForUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return [];
      return roles.filter((r) => r.active && user.roleIds.includes(r.id));
    },
    [users, roles]
  );

  const initials = useMemo(() => {
    if (!session) return "??";
    const user = users.find((u) => u.id === session.userId);
    return user ? userInitials(user) : session.username.slice(0, 2).toUpperCase();
  }, [session, users]);

  const value = useMemo(
    () => ({
      session,
      users,
      roles,
      hydrated,
      source,
      login,
      authenticate,
      logout,
      switchRole,
      canWindow,
      canProcess,
      canReport,
      canAgent,
      upsertUser,
      upsertRole,
      userInitials: initials,
      availableRolesForUser,
    }),
    [
      session,
      users,
      roles,
      hydrated,
      source,
      login,
      authenticate,
      logout,
      switchRole,
      canWindow,
      canProcess,
      canReport,
      canAgent,
      upsertUser,
      upsertRole,
      initials,
      availableRolesForUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    }
    if (session && pathname === "/login") {
      router.replace("/");
    }
  }, [hydrated, session, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!session && pathname !== "/login") return null;
  return <>{children}</>;
}
