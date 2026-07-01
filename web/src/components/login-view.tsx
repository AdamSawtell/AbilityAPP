"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginBackdrop, OrgLogo } from "@/components/organization-landing";
import { useAuth } from "@/lib/auth-store";
import { organizationAddressLine, organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { safePostLoginPath } from "@/lib/mobile/login-redirect";

export function LoginView() {
  const { authenticate, login, availableRolesForUser } = useAuth();
  const { organization } = useOrganization();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orgName = organizationDisplayName(organization);
  const showLegalName =
    organization.legalName.trim() &&
    organization.legalName.trim().toLowerCase() !== orgName.trim().toLowerCase();
  const locationLine = organizationAddressLine(organization);

  const roleOptions = useMemo(
    () => (userId ? availableRolesForUser(userId) : []),
    [userId, availableRolesForUser]
  );
  const showRoleStep = Boolean(userId);

  function postLoginDestination(): string {
    if (typeof window === "undefined") return "/";
    return safePostLoginPath(new URLSearchParams(window.location.search).get("next"));
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSessionMessage(
      params.get("expired") === "inactivity"
        ? "Your session expired due to inactivity. Sign in again to continue."
        : ""
    );
  }, []);

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await authenticate(username.trim(), password);
      if (!user.roleIds.length) {
        setError("This account has no roles assigned. Ask an administrator to update System access on your employee record.");
        setUserId("");
        setRoleId("");
        return;
      }
      setUserId(user.id);
      if (user.roleIds.length === 1) {
        try {
          await login(user.id, user.roleIds[0]);
          router.replace(postLoginDestination());
        } catch (sessionErr) {
          setError(
            sessionErr instanceof Error
              ? sessionErr.message
              : "Sign-in worked but the session could not start. Check AUTH_SESSION_SECRET in Amplify and redeploy."
          );
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
      router.replace(postLoginDestination());
    } catch (sessionErr) {
      setError(
        sessionErr instanceof Error
          ? sessionErr.message
          : "Could not start a session with that role."
      );
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
    <LoginBackdrop>
      <div className="text-center">
        <div className="mx-auto flex justify-center">
          <OrgLogo organization={organization} size="lg" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{orgName}</h1>
        {showLegalName ? <p className="mt-1 text-sm text-white/65">{organization.legalName}</p> : null}
        {locationLine ? <p className="mt-2 text-sm text-white/50">{locationLine}</p> : null}
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/75">
          Sign in to your workspace — enquiries, clients, and day-to-day service delivery.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-slate-700">Staff sign in</p>
        <p className="mt-1 text-center text-xs text-slate-500">
          {showRoleStep ? "Choose the role for this session." : "Enter your username and password."}
        </p>
        {!showRoleStep ? (
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Username or full name — e.g. JasonBrown or Jason Brown
          </p>
        ) : null}
        {sessionMessage ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
            {sessionMessage}
          </p>
        ) : null}

        {!showRoleStep ? (
          <form onSubmit={onCredentialsSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting || !username.trim() || !password}
              className="w-full rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={onRoleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                required
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">Select role…</option>
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting || !roleId}
              className="w-full rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Opening workspace…" : "Continue to workspace"}
            </button>

            <button
              type="button"
              onClick={backToCredentials}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Use a different account
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Microsoft SSO is planned for a future release.
        </p>
        <p className="mt-4 text-center">
          <Link
            href="/system/login"
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            System setup sign in
          </Link>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
        <Link href="/portal/login" className="underline-offset-2 transition hover:text-white/80 hover:underline">
          Client portal
        </Link>
        <span aria-hidden className="text-white/30">
          ·
        </span>
        <Link
          href="/agency-portal/login"
          className="underline-offset-2 transition hover:text-white/80 hover:underline"
        >
          Vendor portal
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Powered by <span className="font-medium text-white/55">AbilityVua</span>
      </p>
    </LoginBackdrop>
  );
}
