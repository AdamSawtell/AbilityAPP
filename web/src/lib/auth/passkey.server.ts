import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requestPublicOrigin } from "@/lib/app-origin";
import {
  buildAuthSession,
  createSessionToken,
  readIdleTimeoutMinutes,
  readSessionTokenFromCookies,
  sessionCookieOptions,
} from "@/lib/auth/session.server";
import { isSuperUser } from "@/lib/access/superuser";
import { MOBILE_APP_NAME } from "@/lib/mobile/constants";
import { generateSessionId, recordSuccessfulLogin } from "@/lib/session-audit/server";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const CHALLENGE_COOKIE = "abilityvua_passkey_challenge";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export type PasskeyChallengeKind = "registration" | "authentication";

type PasskeyChallengePayload = {
  challenge: string;
  kind: PasskeyChallengeKind;
  userId?: string;
  exp: number;
};

type PasskeyRow = {
  credential_id: string;
  user_id: string;
  public_key: string;
  counter: number;
  device_type: string;
  backed_up: boolean;
  transports: string[];
  label: string;
  last_role_id: string;
};

type AppUserPasskeyRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  webauthn_user_id: string | null;
};

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function sessionSecret(): string {
  const secret = readEnv("AUTH_SESSION_SECRET");
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET is not set");
  }
  return "dev-only-insecure-secret-change-me";
}

function signChallengePayload(payload: PasskeyChallengePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyChallengePayload(token: string): PasskeyChallengePayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PasskeyChallengePayload;
    if (!payload.challenge || !payload.kind || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function passkeyChallengeCookieOptions(token: string) {
  return {
    name: CHALLENGE_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(CHALLENGE_TTL_MS / 1000),
  };
}

export function clearPasskeyChallengeCookie(response: NextResponse) {
  response.cookies.set({
    name: CHALLENGE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readPasskeyChallenge(): Promise<PasskeyChallengePayload | null> {
  const jar = await cookies();
  const token = jar.get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  return verifyChallengePayload(token);
}

export function attachPasskeyChallenge(response: NextResponse, payload: Omit<PasskeyChallengePayload, "exp">) {
  const signed = signChallengePayload({ ...payload, exp: Date.now() + CHALLENGE_TTL_MS });
  response.cookies.set(passkeyChallengeCookieOptions(signed));
}

export function getWebAuthnConfig(request: Request) {
  const origin = requestPublicOrigin(request);
  const hostname = new URL(origin).hostname;
  const rpID = hostname === "127.0.0.1" ? "localhost" : hostname;
  return {
    rpName: MOBILE_APP_NAME,
    rpID,
    origin,
  };
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function displayName(user: AppUserPasskeyRow): string {
  const name = `${user.first_name} ${user.last_name}`.trim();
  return name || user.username;
}

function decodePublicKey(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (Buffer.isBuffer(value)) return new Uint8Array(value);
  const text = String(value);
  if (text.startsWith("\\x")) return new Uint8Array(Buffer.from(text.slice(2), "hex"));
  return new Uint8Array(Buffer.from(text, "base64"));
}

function webauthnUserIdBuffer(webauthnUserId: string): Uint8Array {
  const hex = webauthnUserId.replace(/-/g, "");
  return new Uint8Array(Buffer.from(hex, "hex"));
}

async function loadUser(userId: string): Promise<AppUserPasskeyRow | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("app_user")
    .select("id, username, first_name, last_name, webauthn_user_id")
    .eq("id", userId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as AppUserPasskeyRow | null) ?? null;
}

async function ensureWebAuthnUserId(user: AppUserPasskeyRow): Promise<string> {
  if (user.webauthn_user_id) return user.webauthn_user_id;
  const webauthnUserId = randomUUID();
  const supabase = serviceClient();
  const { error } = await supabase.from("app_user").update({ webauthn_user_id: webauthnUserId }).eq("id", user.id);
  if (error) throw error;
  return webauthnUserId;
}

async function listPasskeysForUser(userId: string): Promise<PasskeyRow[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase.from("app_passkey").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as PasskeyRow[];
}

async function roleIdsForUser(userId: string): Promise<string[]> {
  const supabase = serviceClient();
  const { data: userRoles, error } = await supabase.from("app_user_role").select("role_id").eq("user_id", userId);
  if (error) throw error;
  const roleIds = (userRoles ?? []).map((r) => r.role_id);
  if (roleIds.length) return roleIds;
  if (isSuperUser(userId)) {
    const { data: allRoles } = await supabase.from("app_role").select("id").eq("active", true);
    return (allRoles ?? []).map((r) => r.id);
  }
  return [];
}

async function resolveRoleId(userId: string, preferredRoleId: string): Promise<string | null> {
  const roleIds = await roleIdsForUser(userId);
  if (!roleIds.length) return null;
  if (preferredRoleId && roleIds.includes(preferredRoleId)) return preferredRoleId;
  if (roleIds.length === 1) return roleIds[0];
  return null;
}

export async function getPasskeyStatus(userId?: string) {
  if (!isSupabaseConfigured()) {
    return { supported: false, enrolled: false, count: 0 };
  }
  if (!userId) {
    return { supported: true, enrolled: false, count: 0 };
  }
  const passkeys = await listPasskeysForUser(userId);
  return { supported: true, enrolled: passkeys.length > 0, count: passkeys.length };
}

export async function createPasskeyRegistrationOptions(request: Request): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const token = await readSessionTokenFromCookies();
  if (!token?.userId) throw new Error("Sign in with password first to enable Face ID");

  const user = await loadUser(token.userId);
  if (!user) throw new Error("User not found");

  const webauthnUserId = await ensureWebAuthnUserId(user);
  const existing = await listPasskeysForUser(user.id);
  const { rpID, rpName } = getWebAuthnConfig(request);

  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.username,
    userDisplayName: displayName(user),
    userID: webauthnUserIdBuffer(webauthnUserId),
    attestationType: "none",
    excludeCredentials: existing.map((row) => ({
      id: row.credential_id,
      transports: row.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });
}

export async function verifyPasskeyRegistration(
  request: Request,
  body: RegistrationResponseJSON,
  label?: string
): Promise<{ ok: true }> {
  const challenge = await readPasskeyChallenge();
  if (!challenge || challenge.kind !== "registration") {
    throw new Error("Passkey registration expired. Try again.");
  }

  const token = await readSessionTokenFromCookies();
  if (!token?.userId) throw new Error("Not signed in");

  const user = await loadUser(token.userId);
  if (!user) throw new Error("User not found");

  const { origin, rpID } = getWebAuthnConfig(request);
  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Face ID registration could not be verified");
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const supabase = serviceClient();
  const { error } = await supabase.from("app_passkey").insert({
    credential_id: credential.id,
    user_id: user.id,
    public_key: Buffer.from(credential.publicKey),
    counter: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: credential.transports ?? [],
    label: label?.trim() || "This device",
    last_role_id: token.roleId,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Face ID is already enabled on this device");
    throw error;
  }
  return { ok: true };
}

export async function createPasskeyLoginOptions(request: Request): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { rpID } = getWebAuthnConfig(request);
  return generateAuthenticationOptions({
    rpID,
    userVerification: "required",
  });
}

export async function verifyPasskeyLogin(request: Request, body: AuthenticationResponseJSON) {
  const challenge = await readPasskeyChallenge();
  if (!challenge || challenge.kind !== "authentication") {
    throw new Error("Sign-in expired. Try Face ID again.");
  }

  const supabase = serviceClient();
  const { data: passkey, error } = await supabase
    .from("app_passkey")
    .select("*")
    .eq("credential_id", body.id)
    .maybeSingle();
  if (error) throw error;
  if (!passkey) throw new Error("No passkey found for this device. Sign in with password first.");

  const row = passkey as PasskeyRow;
  const { origin, rpID } = getWebAuthnConfig(request);
  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: row.credential_id,
      publicKey: decodePublicKey(row.public_key),
      counter: Number(row.counter),
      transports: row.transports as AuthenticatorTransportFuture[],
    },
  });

  if (!verification.verified) {
    throw new Error("Face ID sign-in could not be verified");
  }

  const roleId = await resolveRoleId(row.user_id, row.last_role_id);
  if (!roleId) {
    throw new Error("Choose your role with password sign-in once, then Face ID will remember it.");
  }

  const newCounter = verification.authenticationInfo.newCounter;
  await supabase
    .from("app_passkey")
    .update({
      counter: newCounter,
      last_role_id: roleId,
      last_used_at: new Date().toISOString(),
    })
    .eq("credential_id", row.credential_id);

  return startSessionForUser(request, row.user_id, roleId, "passkey");
}

async function startSessionForUser(
  request: Request,
  userId: string,
  roleId: string,
  authMethod: "password" | "passkey"
) {
  const session = await buildAuthSession(userId, roleId);
  if (!session) throw new Error("Invalid user or role");

  const sessionId = generateSessionId();
  const ipAddress = clientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent") ?? "";

  try {
    await recordSuccessfulLogin({
      sessionId,
      userId,
      userName: session.displayName,
      roleId,
      roleName: session.activeRoleName,
      ipAddress,
      userAgent,
      authMethod,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start session";
    if (message.includes("Concurrent sessions")) throw new Error(message);
  }

  const idleTimeoutMinutes = await readIdleTimeoutMinutes();
  const token = createSessionToken(userId, roleId, sessionId, idleTimeoutMinutes);
  const jar = await cookies();
  jar.set(sessionCookieOptions(token));
  return { session: { ...session, sessionId, idleTimeoutMinutes } };
}

export async function assertPasskeyAvailable(request: Request) {
  if (!isSupabaseConfigured()) {
    throw new Error("Face ID sign-in is not available in offline demo mode");
  }
  getWebAuthnConfig(request);
}
