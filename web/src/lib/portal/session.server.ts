import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PORTAL_SESSION_COOKIE = "abilityvua_portal_session";
const PORTAL_MAGIC_MAX_AGE_SEC = 60 * 15;
const PORTAL_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type PortalSession = {
  clientId: string;
  email: string;
  displayName: string;
};

export type PortalMagicTokenPayload = {
  clientId: string;
  email: string;
  exp: number;
};

export type PortalSessionTokenPayload = PortalSession & {
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

function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifySignedToken<T extends { exp: number }>(token: string): T | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createPortalMagicToken(clientId: string, email: string): string {
  const payload: PortalMagicTokenPayload = {
    clientId,
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + PORTAL_MAGIC_MAX_AGE_SEC,
  };
  return signPayload(payload);
}

export function verifyPortalMagicToken(token: string): PortalMagicTokenPayload | null {
  return verifySignedToken<PortalMagicTokenPayload>(token);
}

export function createPortalSessionToken(session: PortalSession): string {
  const payload: PortalSessionTokenPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + PORTAL_SESSION_MAX_AGE_SEC,
  };
  return signPayload(payload);
}

function verifyPortalSessionToken(token: string): PortalSessionTokenPayload | null {
  return verifySignedToken<PortalSessionTokenPayload>(token);
}

export async function setPortalSessionCookie(session: PortalSession): Promise<void> {
  const token = createPortalSessionToken(session);
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PORTAL_SESSION_MAX_AGE_SEC,
  });
}

export async function clearPortalSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getPortalSessionFromCookies(): Promise<PortalSession | null> {
  const jar = await cookies();
  const token = jar.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyPortalSessionToken(token);
  if (!payload) return null;
  return {
    clientId: payload.clientId,
    email: payload.email,
    displayName: payload.displayName,
  };
}

export async function getPortalSessionFromRequest(request: Request): Promise<PortalSession | null> {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`${PORTAL_SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  const payload = verifyPortalSessionToken(decodeURIComponent(match[1]));
  if (!payload) return null;
  return {
    clientId: payload.clientId,
    email: payload.email,
    displayName: payload.displayName,
  };
}
