"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AppRoleRecord, AppUserRecord, AuthSession, TaskTypePermission } from "@/lib/access/types";
import { displayName, userInitials } from "@/lib/access/types";
import { canAccessWindow, processById } from "@/lib/access/catalog";
import { SEED_ROLES, SEED_USERS, withSeedTaskAccess } from "@/lib/access/seed";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRoles,
  fetchUsers,
  resolveRoleAccess,
  saveRole,
  saveUser,
} from "@/lib/supabase/access-api";

const SESSION_KEY = "abilityerp-auth-session";

type AuthStore = {
  session: AuthSession | null;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  hydrated: boolean;
  source: "supabase" | "local";
  login: (userId: string, roleId: string) => Promise<void>;
  logout: () => void;
  switchRole: (roleId: string) => Promise<void>;
  canWindow: (key: string) => boolean;
  canProcess: (processId: string) => boolean;
  upsertUser: (user: AppUserRecord) => Promise<void>;
  upsertRole: (role: AppRoleRecord) => Promise<void>;
  userInitials: string;
  availableRolesForUser: (userId: string) => AppRoleRecord[];
};

const AuthContext = createContext<AuthStore | null>(null);

function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    return {
      ...parsed,
      taskTypePermissions: parsed.taskTypePermissions ?? [],
    };
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function buildSession(
  user: AppUserRecord,
  role: AppRoleRecord,
  resolveAccess: (roleId: string) => Promise<{ windowKeys: string[]; processIds: string[]; taskTypePermissions: TaskTypePermission[] }>
): Promise<AuthSession> {
  const access = await resolveAccess(role.id);
  return {
    userId: user.id,
    username: user.username,
    displayName: displayName(user),
    email: user.email,
    activeRoleId: role.id,
    activeRoleName: role.name,
    windowKeys: access.windowKeys,
    processIds: access.processIds,
    taskTypePermissions: access.taskTypePermissions,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUserRecord[]>(SEED_USERS);
  const [roles, setRoles] = useState<AppRoleRecord[]>(SEED_ROLES);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  const resolveAccess = useCallback(async (roleId: string) => {
    let windowKeys: string[] = [];
    let processIds: string[] = [];
    let taskTypePermissions: TaskTypePermission[] = [];

    if (source === "supabase" && isSupabaseConfigured()) {
      const supabase = createClient();
      const access = await resolveRoleAccess(supabase, roleId);
      windowKeys = access.windowKeys;
      processIds = access.processIds;
      taskTypePermissions = access.taskTypePermissions;
    } else {
      const role = roles.find((r) => r.id === roleId);
      windowKeys = role?.windowKeys ?? [];
      processIds = role?.processIds ?? [];
      taskTypePermissions = role?.taskTypePermissions ?? [];
    }

    const seed = SEED_ROLES.find((r) => r.id === roleId);
    if (seed) {
      const merged = withSeedTaskAccess({ ...seed, windowKeys, processIds, taskTypePermissions });
      return {
        windowKeys: merged.windowKeys,
        processIds: merged.processIds,
        taskTypePermissions: merged.taskTypePermissions,
      };
    }

    return { windowKeys, processIds, taskTypePermissions };
  }, [roles, source]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const saved = loadSession();

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const [dbUsers, dbRoles] = await Promise.all([fetchUsers(supabase), fetchRoles(supabase)]);
          if (!cancelled && dbUsers.length) {
            setUsers(dbUsers);
            setRoles(dbRoles.map(withSeedTaskAccess));
            setSource("supabase");

            if (saved) {
              const user = dbUsers.find((u) => u.id === saved.userId);
              const role = dbRoles.find((r) => r.id === saved.activeRoleId);
              if (user?.active && role?.active && user.roleIds.includes(role.id)) {
                const next = await buildSession(user, role, (id) => resolveRoleAccess(supabase, id));
                setSession(next);
                persistSession(next);
              }
            }
            setHydrated(true);
            return;
          }
        } catch {
          // fall through
        }
      }

      if (!cancelled) {
        setUsers(SEED_USERS);
        setRoles(SEED_ROLES.map(withSeedTaskAccess));
        setSource("local");
        if (saved) {
          const user = SEED_USERS.find((u) => u.id === saved.userId);
          const role = SEED_ROLES.find((r) => r.id === saved.activeRoleId);
          if (user && role && user.roleIds.includes(role.id)) {
            const merged = withSeedTaskAccess(role);
            const next = {
              ...saved,
              windowKeys: merged.windowKeys,
              processIds: merged.processIds,
              taskTypePermissions: merged.taskTypePermissions,
            };
            setSession(next);
            persistSession(next);
          }
        }
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
    if (!hydrated || !session) return;

    void (async () => {
      const access = await resolveAccess(session.activeRoleId);
      const keysMatch =
        access.windowKeys.length === session.windowKeys.length &&
        access.windowKeys.every((k) => session.windowKeys.includes(k));
      const procsMatch =
        access.processIds.length === session.processIds.length &&
        access.processIds.every((p) => session.processIds.includes(p));
      const taskTypesMatch =
        access.taskTypePermissions.length === (session.taskTypePermissions?.length ?? 0) &&
        access.taskTypePermissions.every((p) =>
          session.taskTypePermissions?.some(
            (s) =>
              s.taskTypeId === p.taskTypeId &&
              s.canSee === p.canSee &&
              s.canSelect === p.canSelect &&
              s.canCreate === p.canCreate
          )
        );
      if (keysMatch && procsMatch && taskTypesMatch) return;

      const next = {
        ...session,
        windowKeys: access.windowKeys,
        processIds: access.processIds,
        taskTypePermissions: access.taskTypePermissions,
      };
      setSession(next);
      persistSession(next);
    })();
    // Refresh cached session access when the active role changes — not on every session field update.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session.windowKeys is what we're syncing
  }, [hydrated, session?.activeRoleId, session?.userId, resolveAccess]);

  const login = useCallback(
    async (userId: string, roleId: string) => {
      const user = users.find((u) => u.id === userId);
      const role = roles.find((r) => r.id === roleId);
      if (!user?.active || !role?.active || !user.roleIds.includes(roleId)) {
        throw new Error("Invalid user or role");
      }
      const next = await buildSession(user, role, resolveAccess);
      setSession(next);
      persistSession(next);
    },
    [users, roles, resolveAccess]
  );

  const logout = useCallback(() => {
    setSession(null);
    persistSession(null);
  }, []);

  const switchRole = useCallback(
    async (roleId: string) => {
      if (!session) return;
      const user = users.find((u) => u.id === session.userId);
      const role = roles.find((r) => r.id === roleId);
      if (!user || !role || !user.roleIds.includes(roleId)) return;
      const next = await buildSession(user, role, resolveAccess);
      setSession(next);
      persistSession(next);
    },
    [session, users, roles, resolveAccess]
  );

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

  const upsertUser = useCallback(
    async (user: AppUserRecord) => {
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === user.id);
        return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
      });
      if (source === "supabase" && isSupabaseConfigured()) {
        await saveUser(createClient(), user);
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
        const next = {
          ...session,
          windowKeys: role.windowKeys,
          processIds: role.processIds,
          taskTypePermissions: role.taskTypePermissions,
        };
        setSession(next);
        persistSession(next);
      }
    },
    [source, session]
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
      logout,
      switchRole,
      canWindow,
      canProcess,
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
      logout,
      switchRole,
      canWindow,
      canProcess,
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
