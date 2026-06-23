import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { displayName } from "@/lib/access/types";
import { SEED_USERS } from "@/lib/access/seed";
import { isSystemOperatorUsername } from "@/lib/system/constants";
import type { SystemSession } from "@/lib/system/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetchUsers } from "@/lib/supabase/access-api";

export const SYSTEM_SESSION_COOKIE = "abilityvua_system_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type { SystemSession } from "@/lib/system/types";

type SystemTokenPayload = {
  userId: string;
  exp: number;
};

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function sessionSecret(): string {
  const secret = readEnv("AUTH_SESSION_SECRET");
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET is not set.");
  }
  return "dev-only-insecure-secret-change-me";
}

function signPayload(payload: SystemTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token: string): SystemTokenPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SystemTokenPayload;
    if (!payload.userId || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSystemSessionToken(userId: string): string {
  return signPayload({ userId, exp: Date.now() + SESSION_MAX_AGE_SEC * 1000 });
}

export function systemSessionCookieOptions(token: string) {
  return {
    name: SYSTEM_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

async function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function buildSystemSession(userId: string): Promise<SystemSession | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await serviceClient();
      const users = await fetchUsers(supabase);
      const user = users.find((u) => u.id === userId);
      if (!user?.active || !isSystemOperatorUsername(user.username)) return null;
      return {
        userId: user.id,
        username: user.username,
        displayName: displayName(user),
        email: user.email,
      };
    } catch {
      return null;
    }
  }

  const user = SEED_USERS.find((u) => u.id === userId);
  if (!user?.active || !isSystemOperatorUsername(user.username)) return null;
  return {
    userId: user.id,
    username: user.username,
    displayName: displayName(user),
    email: user.email,
  };
}

export async function readSystemSessionFromCookies(): Promise<SystemSession | null> {
  const jar = await cookies();
  const token = jar.get(SYSTEM_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return buildSystemSession(payload.userId);
}
