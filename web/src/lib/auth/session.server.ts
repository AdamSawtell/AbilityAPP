import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { AuthSession } from "@/lib/access/types";
import { displayName } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { agentIdsForRole } from "@/lib/ai/seed";
import { SEED_ROLES, SEED_USERS, withSeedTaskAccess } from "@/lib/access/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  fetchRoles,
  fetchUsers,
  resolveRoleAccess,
} from "@/lib/supabase/access-api";
import { resolveRoleAgentIds } from "@/lib/ai/agents-api";

export const SESSION_COOKIE = "abilityapp_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionTokenPayload = {
  userId: string;
  roleId: string;
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
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string, roleId: string): string {
  const payload: SessionTokenPayload = {
    userId,
    roleId,
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

export async function buildAuthSession(userId: string, roleId: string): Promise<AuthSession | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      const [users, roles] = await Promise.all([fetchUsers(supabase), fetchRoles(supabase)]);
      const user = users.find((u) => u.id === userId);
      const role = roles.find((r) => r.id === roleId);
      if (!user?.active || !role?.active || !user.roleIds.includes(roleId)) return null;
      const mergedRole = withSeedTaskAccess(role);
      const access = await resolveRoleAccess(supabase, roleId);
      const agentIds = await resolveRoleAgentIds(supabase, roleId);
      const merged = withSeedTaskAccess({ ...mergedRole, ...access });
      const resolvedAgentIds = agentIds.length ? agentIds : agentIdsForRole(roleId);
      return {
        userId: user.id,
        username: user.username,
        displayName: displayName(user),
        email: user.email,
        activeRoleId: merged.id,
        activeRoleName: merged.name,
        windowKeys: merged.windowKeys,
        processIds: merged.processIds,
        reportIds: merged.reportIds ?? [],
        taskTypePermissions: merged.taskTypePermissions,
        agentIds: resolvedAgentIds,
      };
    } catch {
      return null;
    }
  }

  const user = SEED_USERS.find((u) => u.id === userId);
  const role = SEED_ROLES.find((r) => r.id === roleId);
  if (!user?.active || !role?.active || !user.roleIds.includes(roleId)) return null;
  const merged = withSeedTaskAccess(role);
  return {
    userId: user.id,
    username: user.username,
    displayName: displayName(user),
    email: user.email,
    activeRoleId: merged.id,
    activeRoleName: merged.name,
    windowKeys: merged.windowKeys,
    processIds: merged.processIds,
    reportIds: merged.reportIds ?? [],
    taskTypePermissions: merged.taskTypePermissions,
    agentIds: agentIdsForRole(roleId),
  };
}

export async function getAuthSessionFromRequest(): Promise<AuthSession | null> {
  const token = await readSessionTokenFromCookies();
  if (!token) return null;
  return buildAuthSession(token.userId, token.roleId);
}

export function sessionHasWindow(session: AuthSession, windowKey: string): boolean {
  return canAccessWindow(session.windowKeys, windowKey);
}
