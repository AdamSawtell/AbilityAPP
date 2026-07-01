"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { safeMobilePostLoginPath } from "@/lib/mobile/login-redirect";
import { fetchPasskeyStatus, passkeyLabel, passkeySupported, registerPasskey, signInWithPasskey } from "@/lib/mobile/passkey-client";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type MobileLoginFormProps = {
  nextPath?: string;
  sessionMessage?: string;
};

export function MobileLoginForm({ nextPath = "/m/today", sessionMessage }: MobileLoginFormProps) {
  const { authenticate, login, refreshSession, availableRolesForUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [offerPasskeySetup, setOfferPasskeySetup] = useState(false);

  const biometricLabel = passkeyLabel();

  useEffect(() => {
    setShowPasskey(passkeySupported());
  }, []);

  const roleOptions = useMemo(
    () => (userId ? availableRolesForUser(userId) : []),
    [userId, availableRolesForUser]
  );
  const showRoleStep = Boolean(userId);

  function destination(): string {
    return safeMobilePostLoginPath(nextPath);
  }

  async function completePasswordLogin(activeUserId: string, activeRoleId: string) {
    await login(activeUserId, activeRoleId);
    const status = await fetchPasskeyStatus();
    if (passkeySupported() && status.supported && !status.enrolled) {
      setOfferPasskeySetup(true);
      return;
    }
    router.replace(destination());
  }

  async function onPasskeySignIn() {
    setPasskeyBusy(true);
    setError("");
    try {
      const result = await signInWithPasskey();
      if (!result.ok) {
        setError(result.error ?? `${biometricLabel} sign-in failed`);
        return;
      }
      await refreshSession();
      router.replace(destination());
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function onEnablePasskeyAfterLogin() {
    setPasskeyBusy(true);
    setError("");
    const result = await registerPasskey();
    setPasskeyBusy(false);
    if (!result.ok) {
      router.replace(destination());
      return;
    }
    router.replace(destination());
  }

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await authenticate(username.trim(), password);
      if (!user.roleIds.length) {
        setError("This account has no roles assigned. Ask your administrator for My workplace access.");
        setUserId("");
        setRoleId("");
        return;
      }
      setUserId(user.id);
      if (user.roleIds.length === 1) {
        try {
          await completePasswordLogin(user.id, user.roleIds[0]);
        } catch (sessionErr) {
          setError(sessionErr instanceof Error ? sessionErr.message : "Sign-in worked but the session could not start.");
          setUserId("");
          setRoleId("");
        }
        return;
      }
      setRoleId("");
    } catch {
      setError("Invalid username or password.");
      setUserId("");
      setRoleId("");
    } finally {
      setSubmitting(false);
    }
  }

  async function onRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await completePasswordLogin(userId, roleId);
    } catch (sessionErr) {
      setError(sessionErr instanceof Error ? sessionErr.message : "Could not start a session with that role.");
    } finally {
      setSubmitting(false);
    }
  }

  function backToCredentials() {
    setUserId("");
    setRoleId("");
    setError("");
  }

  if (offerPasskeySetup) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Enable {biometricLabel} on this device so you can sign back in without your password next time.
        </p>
        <button
          type="button"
          disabled={passkeyBusy}
          onClick={() => void onEnablePasskeyAfterLogin()}
          className="min-h-12 w-full rounded-xl bg-[#b51266] text-base font-semibold text-white disabled:opacity-60"
        >
          {passkeyBusy ? "Setting up…" : `Enable ${biometricLabel}`}
        </button>
        <button
          type="button"
          disabled={passkeyBusy}
          onClick={() => router.replace(destination())}
          className="min-h-11 w-full text-sm text-slate-500"
        >
          Not now
        </button>
      </div>
    );
  }

  return (
    <div>
      {sessionMessage ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {sessionMessage}
        </p>
      ) : null}

      {showPasskey && !showRoleStep ? (
        <>
          <button
            type="button"
            disabled={passkeyBusy || submitting}
            onClick={() => void onPasskeySignIn()}
            className="mb-4 min-h-12 w-full rounded-xl border border-[#b51266]/20 bg-[#fdf2f8] text-base font-semibold text-[#b51266] disabled:opacity-60"
          >
            {passkeyBusy ? "Checking…" : `Sign in with ${biometricLabel}`}
          </button>
          <p className="mb-4 text-center text-xs text-slate-400">or use your password</p>
        </>
      ) : null}

      {!showRoleStep ? (
        <form onSubmit={onCredentialsSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Username</span>
            <input
              id="mobile-username"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="e.g. JasonBrown"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Password</span>
            <input
              id="mobile-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || passkeyBusy || !username.trim() || !password}
            className="min-h-12 w-full rounded-xl bg-[#b51266] text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in with password"}
          </button>
        </form>
      ) : (
        <form onSubmit={onRoleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Role for this session</span>
            <select
              id="mobile-role"
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select role…</option>
              {roleOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !roleId}
            className="min-h-12 w-full rounded-xl bg-[#b51266] text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Opening…" : "Continue"}
          </button>
          <button type="button" onClick={backToCredentials} className="w-full text-sm text-slate-500">
            Use a different account
          </button>
        </form>
      )}
    </div>
  );
}
