import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { AuthSession } from "@/lib/access/types";
import { displayName } from "@/lib/access/types";
import { canAccessWindow, sanitizeAppWindowKeys } from "@/lib/access/catalog";
import { canRunProcess } from "@/lib/access/process-access";
import { normalizeRoleWindowAccess, canWriteWindowSession } from "@/lib/access/window-access";
import { agentIdsForRole } from "@/lib/ai/seed";
import { SEED_ROLES, SEED_USERS, withSeedTaskAccess, ALL_TASK_TYPE_IDS } from "@/lib/access/seed";
import { ensureAdminRoleAccess, isAdminRole } from "@/lib/access/role-access-templates";
import { userHasRole } from "@/lib/access/superuser";
import { normalizeIdleTimeoutMinutes, ORGANIZATION_ID } from "@/lib/organization";
import { recordLogout } from "@/lib/session-audit/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  fetchRoles,
  fetchUsers,
  resolveRoleAccess,
} from "@/lib/supabase/access-api";
import { resolveRoleAgentIds } from "@/lib/ai/agents-api";

export const SESSION_COOKIE = "abilityvua_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;
const IDLE_WARNING_GRACE_MS = 2 * 60 * 1000;
const SESSION_TOUCH_INTERVAL_MS = 30 * 1000;

let idleTimeoutCache: { value: number; expiresAt: number } | null = null;

export function invalidateIdleTimeoutCache() {
  idleTimeoutCache = null;
}

function effectiveIdleTimeoutMinutes(tokenMinutes: number | undefined, orgMinutes: number): number {
  const org = normalizeIdleTimeoutMinutes(orgMinutes);
  const token = normalizeIdleTimeoutMinutes(tokenMinutes ?? org);
  return Math.min(token, org);
}

export type SessionTokenPayload = {
  userId: string;
  roleId: string;
  sessionId: string;
  idleTimeoutMinutes?: number;
  exp: number;
};

function readEnv(name: string): string | undefined {
  // Bracket access avoids Next.js replacing missing vars with `undefined` at build time.
  return process.env[name]?.trim() || undefined;
}

function sessionSecret(): string {
  const secret = readEnv("AUTH_SESSION_SECRET");
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SESSION_SECRET is not set. Add it in Amplify environment variables and redeploy."
    );
  }
  return "dev-only-insecure-secret-change-me";
}

function signPayload(payload: SessionTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token: string): SessionTokenPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionTokenPayload;
    if (!payload.userId || !payload.roleId || payload.exp < Date.now()) return null;
    return { ...payload, sessionId: payload.sessionId ?? "" };
  } catch {
    return null;
  }
}

export function createSessionToken(
  userId: string,
  roleId: string,
  sessionId: string,
  idleTimeoutMinutes = 15
): string {
  const payload: SessionTokenPayload = {
    userId,
    roleId,
    sessionId,
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(idleTimeoutMinutes),
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  };
  return signPayload(payload);
}

export async function readSessionTokenFromCookies(): Promise<SessionTokenPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function readIdleTimeoutMinutes(): Promise<number> {
  if (!isSupabaseConfigured()) return 15;
  if (idleTimeoutCache && idleTimeoutCache.expiresAt > Date.now()) return idleTimeoutCache.value;
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("app_organization")
      .select("idle_timeout_minutes")
      .eq("id", ORGANIZATION_ID)
      .maybeSingle();
    if (error) return 15;
    const value = normalizeIdleTimeoutMinutes(data?.idle_timeout_minutes);
    idleTimeoutCache = { value, expiresAt: Date.now() + 60_000 };
    return value;
  } catch {
    return 15;
  }
}

async function validateAndTouchIdleSession(token: SessionTokenPayload): Promise<boolean> {
  if (!isSupabaseConfigured() || !token.sessionId) return true;
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("user_session")
      .select("status, updated_at")
      .eq("id", token.sessionId)
      .maybeSingle();
    if (error || !data) return true;
    if (data.status !== "active") return false;

    const orgMinutes = await readIdleTimeoutMinutes();
    const timeoutMinutes = effectiveIdleTimeoutMinutes(token.idleTimeoutMinutes, orgMinutes);
    const updatedAt = Date.parse(String(data.updated_at ?? ""));
    if (updatedAt && Date.now() - updatedAt > timeoutMinutes * 60 * 1000 + IDLE_WARNING_GRACE_MS) {
      await recordLogout(token.sessionId, "timed_out");
      return false;
    }

    if (!updatedAt || Date.now() - updatedAt > SESSION_TOUCH_INTERVAL_MS) {
      await supabase
        .from("user_session")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", token.sessionId)
        .eq("status", "active");
    }
    return true;
  } catch {
    return !isSupabaseConfigured();
  }
}

export async function buildAuthSession(userId: string, roleId: string): Promise<AuthSession | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      const [users, roles] = await Promise.all([fetchUsers(supabase), fetchRoles(supabase)]);
      const user = users.find((u) => u.id === userId);
      const role = roles.find((r) => r.id === roleId);
      const allRoleIds = roles.filter((r) => r.active).map((r) => r.id);
      if (!user?.active || !role?.active || !userHasRole(user, roleId, allRoleIds)) return null;

      const agentIds = await resolveRoleAgentIds(supabase, roleId);

      if (isAdminRole(role)) {
        const normalized = normalizeRoleWindowAccess(
          ensureAdminRoleAccess(withSeedTaskAccess(role), ALL_TASK_TYPE_IDS)
        );
        const resolvedAgentIds = agentIds.length ? agentIds : agentIdsForRole(roleId);
        return {
          userId: user.id,
          username: user.username,
          displayName: displayName(user),
          email: user.email,
          employeeBpId: user.employeeBpId ?? "",
          activeRoleId: normalized.id,
          activeRoleName: normalized.name,
          sessionId: "",
          windowKeys: sanitizeAppWindowKeys(normalized.windowKeys),
          windowAccess: normalized.windowAccess,
          processIds: normalized.processIds,
          reportIds: normalized.reportIds ?? [],
          taskTypePermissions: normalized.taskTypePermissions,
          agentIds: resolvedAgentIds,
        };
      }

      const mergedRole = withSeedTaskAccess(role);
      const access = await resolveRoleAccess(supabase, roleId);
      const merged = withSeedTaskAccess({ ...mergedRole, ...access });
      const normalized = normalizeRoleWindowAccess(merged);
      const resolvedAgentIds = agentIds.length ? agentIds : agentIdsForRole(roleId);
      return {
        userId: user.id,
        username: user.username,
        displayName: displayName(user),
        email: user.email,
        employeeBpId: user.employeeBpId ?? "",
        activeRoleId: normalized.id,
        activeRoleName: normalized.name,
        sessionId: "",
        windowKeys: sanitizeAppWindowKeys(normalized.windowKeys),
        windowAccess: normalized.windowAccess,
        processIds: normalized.processIds,
        reportIds: normalized.reportIds ?? [],
        taskTypePermissions: normalized.taskTypePermissions,
        agentIds: resolvedAgentIds,
      };
    } catch {
      return null;
    }
  }

  const user = SEED_USERS.find((u) => u.id === userId);
  const role = SEED_ROLES.find((r) => r.id === roleId);
  const allRoleIds = SEED_ROLES.filter((r) => r.active).map((r) => r.id);
  if (!user?.active || !role?.active || !userHasRole(user, roleId, allRoleIds)) return null;
  const merged = normalizeRoleWindowAccess(withSeedTaskAccess(role));
  return {
    userId: user.id,
    username: user.username,
    displayName: displayName(user),
    email: user.email,
    employeeBpId: user.employeeBpId ?? "",
    activeRoleId: merged.id,
    activeRoleName: merged.name,
    sessionId: "",
    windowKeys: sanitizeAppWindowKeys(merged.windowKeys),
    windowAccess: merged.windowAccess,
    processIds: merged.processIds,
    reportIds: merged.reportIds ?? [],
    taskTypePermissions: merged.taskTypePermissions,
    agentIds: agentIdsForRole(roleId),
  };
}

export async function getAuthSessionFromRequest(): Promise<AuthSession | null> {
  const token = await readSessionTokenFromCookies();
  if (!token) return null;
  if (!(await validateAndTouchIdleSession(token))) return null;
  const session = await buildAuthSession(token.userId, token.roleId);
  const orgMinutes = await readIdleTimeoutMinutes();
  return session
    ? {
        ...session,
        sessionId: token.sessionId,
        idleTimeoutMinutes: effectiveIdleTimeoutMinutes(token.idleTimeoutMinutes, orgMinutes),
      }
    : null;
}

export function sessionHasWindow(session: AuthSession, windowKey: string): boolean {
  return canAccessWindow(session.windowKeys, windowKey);
}

export function sessionCanWriteWindow(session: AuthSession, windowKey: string): boolean {
  return canWriteWindowSession(session, windowKey);
}

export function sessionCanRunProcess(session: AuthSession, processId: string): boolean {
  return canRunProcess(session, processId);
}
