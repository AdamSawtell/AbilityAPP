"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { safeMobilePostLoginPath } from "@/lib/mobile/login-redirect";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type MobileLoginFormProps = {
  nextPath?: string;
  sessionMessage?: string;
};

export function MobileLoginForm({ nextPath = "/m/today", sessionMessage }: MobileLoginFormProps) {
  const { authenticate, login, availableRolesForUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = useMemo(
    () => (userId ? availableRolesForUser(userId) : []),
    [userId, availableRolesForUser]
  );
  const showRoleStep = Boolean(userId);

  function destination(): string {
    return safeMobilePostLoginPath(nextPath);
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
          await login(user.id, user.roleIds[0]);
          router.replace(destination());
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
      await login(userId, roleId);
      router.replace(destination());
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

  return (
    <div>
      {sessionMessage ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {sessionMessage}
        </p>
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
            disabled={submitting || !username.trim() || !password}
            className="min-h-12 w-full rounded-xl bg-[#b51266] text-base font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
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
