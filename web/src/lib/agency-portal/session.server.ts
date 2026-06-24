import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AGENCY_PORTAL_SESSION_COOKIE = "abilityvua_agency_portal_session";
const MAGIC_MAX_AGE_SEC = 60 * 15;
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type AgencyPortalSession = {
  vendorBpId: string;
  email: string;
  displayName: string;
};

type MagicPayload = {
  vendorBpId: string;
  email: string;
  exp: number;
};

type SessionPayload = AgencyPortalSession & { exp: number };

function sessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
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

export function createAgencyPortalMagicToken(vendorBpId: string, email: string): string {
  const payload: MagicPayload = {
    vendorBpId,
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + MAGIC_MAX_AGE_SEC,
  };
  return signPayload(payload);
}

export function verifyAgencyPortalMagicToken(token: string): MagicPayload | null {
  return verifySignedToken<MagicPayload>(token);
}

function createSessionToken(session: AgencyPortalSession): string {
  const payload: SessionPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  return signPayload(payload);
}

function verifySessionToken(token: string): SessionPayload | null {
  return verifySignedToken<SessionPayload>(token);
}

export async function setAgencyPortalSessionCookie(session: AgencyPortalSession): Promise<void> {
  const jar = await cookies();
  jar.set(AGENCY_PORTAL_SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearAgencyPortalSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(AGENCY_PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAgencyPortalSessionFromCookies(): Promise<AgencyPortalSession | null> {
  const jar = await cookies();
  const token = jar.get(AGENCY_PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return {
    vendorBpId: payload.vendorBpId,
    email: payload.email,
    displayName: payload.displayName,
  };
}

export async function getAgencyPortalSessionFromRequest(request: Request): Promise<AgencyPortalSession | null> {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`${AGENCY_PORTAL_SESSION_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;
  const payload = verifySessionToken(decodeURIComponent(match[1]));
  if (!payload) return null;
  return {
    vendorBpId: payload.vendorBpId,
    email: payload.email,
    displayName: payload.displayName,
  };
}
