"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginBackdrop, OrgLogo } from "@/components/organization-landing";
import { useAuth } from "@/lib/auth-store";
import { useSystemAuth } from "@/lib/system-auth-store";
import { isSystemOperatorUsername } from "@/lib/system/constants";
import { organizationAddressLine, organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";

export function SystemLoginView() {
  const { authenticate } = useAuth();
  const { login } = useSystemAuth();
  const { organization } = useOrganization();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orgName = organizationDisplayName(organization);
  const locationLine = organizationAddressLine(organization);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const trimmed = username.trim();
      if (!isSystemOperatorUsername(trimmed)) {
        setError("System setup is restricted to authorised operator accounts.");
        return;
      }
      const user = await authenticate(trimmed, password);
      if (!isSystemOperatorUsername(user.username)) {
        setError("This account cannot access System setup.");
        return;
      }
      await login(user.id);
      router.replace("/system");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginBackdrop>
      <div className="text-center">
        <div className="mx-auto flex justify-center">
          <OrgLogo organization={organization} size="lg" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{orgName}</h1>
        {locationLine ? <p className="mt-2 text-sm text-white/50">{locationLine}</p> : null}
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/75">
          System setup — tenant configuration, organisation profile, reference data, and AI assistants.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-slate-700">System operator sign in</p>
        <p className="mt-1 text-center text-xs text-slate-500">
          Separate from workspace sign-in. Use your System operator account.
        </p>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Username or full name — e.g. SuperUser or Super User
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="system-username">
              Username
            </label>
            <input
              id="system-username"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="system-password">
              Password
            </label>
            <input
              id="system-password"
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
            {submitting ? "Opening System…" : "Continue to System"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          <Link href="/login" className="text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline">
            Back to workspace sign in
          </Link>
        </p>
      </div>
    </LoginBackdrop>
  );
}
