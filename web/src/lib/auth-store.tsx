"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AppRoleRecord, AppUserRecord, AuthSession } from "@/lib/access/types";
import { userInitials } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { canRunProcess } from "@/lib/access/process-access";
import { canHomePanel } from "@/lib/access/home-panels";
import { canSaveModuleRecord, canWriteWindowSession } from "@/lib/access/window-access";
import { canAccessReport } from "@/lib/reports/catalog";
import { SEED_ROLES, SEED_USERS, withSeedTaskAccess, ALL_TASK_TYPE_IDS } from "@/lib/access/seed";
import { ensureAdminRoleAccess } from "@/lib/access/role-access-templates";
import { effectiveRoleIds, isSuperUser } from "@/lib/access/superuser";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRoles,
  fetchUsers,
  saveRole,
} from "@/lib/supabase/access-api";
import { routePageSkeleton } from "@/components/ui/page-skeletons";
import { safePostLoginPath } from "@/lib/mobile/login-redirect";

/** Legacy workspace Admin URLs that immediately redirect into System setup. */
const ADMIN_SYSTEM_REDIRECT_PREFIXES = ["/admin/organization", "/admin/security"] as const;

function isAdminSystemRedirect(pathname: string): boolean {
  return ADMIN_SYSTEM_REDIRECT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const LEGACY_SESSION_KEY = "abilityerp-auth-session";
const WORKSPACE_SESSION_CACHE_KEY = "abilityerp-session-data-cache";

type AuthStore = {
  session: AuthSession | null;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  hydrated: boolean;
  accessDirectoryHydrated: boolean;
  accessDirectoryError: string | null;
  source: "supabase" | "local";
  login: (userId: string, roleId: string) => Promise<void>;
  authenticate: (username: string, password: string) => Promise<AppUserRecord>;
  logout: (options?: { reason?: "inactivity" | "manual" }) => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  canWindow: (key: string) => boolean;
  canWriteWindow: (key: string) => boolean;
  canSaveModule: (moduleKey: string, childKeyPrefix: string) => boolean;
  canHomePanel: (panelKey: string) => boolean;
  canProcess: (processId: string) => boolean;
  canReport: (reportId: string) => boolean;
  canAgent: (agentId: string) => boolean;
  upsertUser: (user: AppUserRecord, options?: { password?: string }) => Promise<void>;
  upsertRole: (role: AppRoleRecord) => Promise<void>;
  ensureAccessDirectory: () => Promise<void>;
  userInitials: string;
  availableRolesForUser: (userId: string) => AppRoleRecord[];
};

const AuthContext = createContext<AuthStore | null>(null);

function normalizeSession(raw: AuthSession): AuthSession {
  const windowAccess = raw.windowAccess ?? {};
  const windowKeys = raw.windowKeys?.length
    ? raw.windowKeys
    : Object.keys(windowAccess);
  return {
    ...raw,
    employeeBpId: raw.employeeBpId ?? "",
    sessionId: raw.sessionId ?? "",
    windowKeys,
    windowAccess: Object.keys(windowAccess).length ? windowAccess : Object.fromEntries(windowKeys.map((k) => [k, "write" as const])),
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

async function clearSessionViaApi(reason: "inactivity" | "manual" = "manual"): Promise<void> {
  const suffix = reason === "inactivity" ? "?reason=inactivity" : "";
  await fetch(`/api/auth/session${suffix}`, { method: "DELETE", credentials: "include" });
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(WORKSPACE_SESSION_CACHE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUserRecord[]>(SEED_USERS);
  const [roles, setRoles] = useState<AppRoleRecord[]>(SEED_ROLES);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [accessDirectoryHydrated, setAccessDirectoryHydrated] = useState(false);
  const [accessDirectoryError, setAccessDirectoryError] = useState<string | null>(null);
  const [source, setSource] = useState<"supabase" | "local">("local");
  const accessDirectoryPromise = useRef<Promise<void> | null>(null);

  const ensureAccessDirectory = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUsers(SEED_USERS);
      setRoles(SEED_ROLES.map(withSeedTaskAccess));
      setSource("local");
      setAccessDirectoryHydrated(true);
      setAccessDirectoryError(null);
      return;
    }

    if (accessDirectoryPromise.current) {
      await accessDirectoryPromise.current;
      return;
    }

    accessDirectoryPromise.current = (async () => {
      const startedAt = performance.now();
      let error: string | null = null;
      try {
        const supabase = createClient();
        const [dbUsers, dbRoles] = await Promise.all([fetchUsers(supabase), fetchRoles(supabase)]);
        if (dbUsers.length) {
          setUsers(dbUsers);
          setRoles(dbRoles.map(withSeedTaskAccess));
          setSource("supabase");
        } else {
          error = "Could not load live users and roles.";
        }
      } catch (err) {
        error = err instanceof Error ? err.message : "Could not load live users and roles.";
        // Keep seed data; admin screens can still surface save/load failures.
      } finally {
        setAccessDirectoryError(error);
        setAccessDirectoryHydrated(true);
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[AuthStore] access directory hydrate ${Math.round(performance.now() - startedAt)}ms`);
        }
        accessDirectoryPromise.current = null;
      }
    })();

    await accessDirectoryPromise.current;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LEGACY_SESSION_KEY);
      }

      if (isSupabaseConfigured()) {
        setSource("supabase");
        try {
          const active = await fetchSessionFromApi();
          if (!cancelled && active) setSession(active);
        } catch {
          // no session cookie
        }

        if (!cancelled) setHydrated(true);
        void ensureAccessDirectory();
        return;
      }

      if (!cancelled) {
        setUsers(SEED_USERS);
        setRoles(SEED_ROLES.map(withSeedTaskAccess));
        setSource("local");
        setAccessDirectoryHydrated(true);
        setAccessDirectoryError(null);
        setHydrated(true);
      }
    }

    queueMicrotask(() => {
      void hydrate();
    });

    return () => {
      cancelled = true;
    };
  }, [ensureAccessDirectory]);

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
      await ensureAccessDirectory();
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === user.id);
        return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
      });
      return user;
    },
    [ensureAccessDirectory]
  );

  const logout = useCallback(async (options?: { reason?: "inactivity" | "manual" }) => {
    await clearSessionViaApi(options?.reason ?? "manual");
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

  const canWriteWindowFn = useCallback(
    (key: string) => (session ? canWriteWindowSession(session, key) : false),
    [session]
  );

  const canSaveModule = useCallback(
    (moduleKey: string, childKeyPrefix: string) =>
      session ? canSaveModuleRecord(session, moduleKey, childKeyPrefix) : false,
    [session]
  );

  const canHomePanelFn = useCallback(
    (panelKey: string) => (session ? canHomePanel(session.windowKeys, panelKey) : false),
    [session]
  );
  const canProcess = useCallback(
    (processId: string) => (session ? canRunProcess(session, processId) : false),
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
      if (source === "supabase" && (!accessDirectoryHydrated || accessDirectoryError)) {
        throw new Error("Live access directory is not loaded.");
      }
      // SuperUser is persisted with every active role; mirror that in client state
      // so the UI never shows fewer roles than were saved.
      const allRoleIds = roles.filter((r) => r.active).map((r) => r.id);
      const stored: AppUserRecord = isSuperUser(user)
        ? { ...user, roleIds: effectiveRoleIds(user, allRoleIds) }
        : user;
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === stored.id);
        return exists ? prev.map((u) => (u.id === stored.id ? stored : u)) : [...prev, stored];
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        const res = await fetch("/api/auth/system-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user: stored, password: options?.password }),
        });
        if (!res.ok) throw new Error("Could not save system access");
      }
    },
    [source, roles, accessDirectoryHydrated, accessDirectoryError]
  );

  const upsertRole = useCallback(
    async (role: AppRoleRecord) => {
      if (source === "supabase" && (!accessDirectoryHydrated || accessDirectoryError)) {
        throw new Error("Live role configuration is not loaded.");
      }
      const toSave = ensureAdminRoleAccess(withSeedTaskAccess(role), ALL_TASK_TYPE_IDS);
      setRoles((prev) => {
        const exists = prev.some((r) => r.id === toSave.id);
        return exists ? prev.map((r) => (r.id === toSave.id ? toSave : r)) : [...prev, toSave];
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        await saveRole(createClient(), toSave);
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
    [source, session?.activeRoleId, accessDirectoryHydrated, accessDirectoryError]
  );

  const availableRolesForUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return [];
      const allRoleIds = roles.filter((r) => r.active).map((r) => r.id);
      const allowed = new Set(effectiveRoleIds(user, allRoleIds));
      return roles.filter((r) => r.active && allowed.has(r.id));
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
      accessDirectoryHydrated,
      accessDirectoryError,
      source,
      login,
      authenticate,
      logout,
      switchRole,
      canWindow,
      canWriteWindow: canWriteWindowFn,
      canSaveModule,
      canHomePanel: canHomePanelFn,
      canProcess,
      canReport,
      canAgent,
      upsertUser,
      upsertRole,
      ensureAccessDirectory,
      userInitials: initials,
      availableRolesForUser,
    }),
    [
      session,
      users,
      roles,
      hydrated,
      accessDirectoryHydrated,
      accessDirectoryError,
      source,
      login,
      authenticate,
      logout,
      switchRole,
      canWindow,
      canWriteWindowFn,
      canSaveModule,
      canHomePanelFn,
      canProcess,
      canReport,
      canAgent,
      upsertUser,
      upsertRole,
      ensureAccessDirectory,
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
    if (pathname.startsWith("/system")) return;
    if (isAdminSystemRedirect(pathname)) return;
    if (pathname.startsWith("/portal")) return;
    if (pathname.startsWith("/agency-portal")) return;
    if (pathname.startsWith("/m")) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    }
    if (session && pathname === "/login") {
      const next =
        typeof window !== "undefined"
          ? safePostLoginPath(new URLSearchParams(window.location.search).get("next"))
          : "/";
      router.replace(next);
    }
  }, [hydrated, session, pathname, router]);

  if (!hydrated) {
    return routePageSkeleton(pathname);
  }

  if (pathname.startsWith("/system")) return <>{children}</>;
  if (isAdminSystemRedirect(pathname)) return <>{children}</>;
  if (pathname.startsWith("/portal")) return <>{children}</>;
  if (pathname.startsWith("/agency-portal")) return <>{children}</>;
  if (pathname.startsWith("/m")) return <>{children}</>;
  if (!session && pathname !== "/login") return null;
  return <>{children}</>;
}
