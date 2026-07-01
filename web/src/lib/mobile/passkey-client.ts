"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export function passkeySupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";
}

export function passkeyLabel(): string {
  if (typeof navigator === "undefined") return "Biometric sign-in";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "Face ID";
  if (/android/i.test(navigator.userAgent)) return "Fingerprint";
  if (/macintosh|mac os x/i.test(navigator.userAgent)) return "Touch ID";
  return "Biometric sign-in";
}

export async function fetchPasskeyStatus(): Promise<{ supported: boolean; enrolled: boolean; count: number }> {
  const res = await fetch("/api/mobile/passkey/status", { credentials: "include" });
  if (!res.ok) return { supported: passkeySupported(), enrolled: false, count: 0 };
  return res.json() as Promise<{ supported: boolean; enrolled: boolean; count: number }>;
}

export async function registerPasskey(): Promise<{ ok: boolean; error?: string }> {
  if (!passkeySupported()) {
    return { ok: false, error: `${passkeyLabel()} is not supported on this device.` };
  }

  try {
    const optionsRes = await fetch("/api/mobile/passkey/register", {
      method: "POST",
      credentials: "include",
    });
    const optionsBody = (await optionsRes.json()) as PublicKeyCredentialCreationOptionsJSON & { error?: string };
    if (!optionsRes.ok) throw new Error(optionsBody.error ?? "Could not start Face ID setup");

    const attestation = (await startRegistration({ optionsJSON: optionsBody })) as RegistrationResponseJSON;
    const verifyRes = await fetch("/api/mobile/passkey/register", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: attestation, label: passkeyLabel() }),
    });
    const verifyBody = (await verifyRes.json()) as { error?: string };
    if (!verifyRes.ok) throw new Error(verifyBody.error ?? "Face ID setup failed");
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === "NotAllowedError") {
      return { ok: false, error: `${passkeyLabel()} was cancelled.` };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Face ID setup failed" };
  }
}

export async function signInWithPasskey(): Promise<{
  ok: boolean;
  error?: string;
  session?: unknown;
}> {
  if (!passkeySupported()) {
    return { ok: false, error: `${passkeyLabel()} is not supported on this device.` };
  }

  try {
    const optionsRes = await fetch("/api/mobile/passkey/login", {
      method: "POST",
      credentials: "include",
    });
    const optionsBody = (await optionsRes.json()) as PublicKeyCredentialRequestOptionsJSON & { error?: string };
    if (!optionsRes.ok) throw new Error(optionsBody.error ?? "Could not start Face ID sign-in");

    const assertion = (await startAuthentication({ optionsJSON: optionsBody })) as AuthenticationResponseJSON;
    const verifyRes = await fetch("/api/mobile/passkey/login", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: assertion }),
    });
    const verifyBody = (await verifyRes.json()) as { error?: string; session?: unknown };
    if (!verifyRes.ok) throw new Error(verifyBody.error ?? "Face ID sign-in failed");
    return { ok: true, session: verifyBody.session };
  } catch (err) {
    if (err instanceof Error && err.name === "NotAllowedError") {
      return { ok: false, error: `${passkeyLabel()} was cancelled.` };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Face ID sign-in failed" };
  }
}
