"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";

function PortalLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signInLink, setSignInLink] = useState<string | null>(null);
  const error = searchParams.get("error");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setSignInLink(null);
    try {
      const res = await fetch("/api/portal/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; signInLink?: string; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not request sign-in link.");
        return;
      }
      setMessage(data.message ?? "Check your email for a sign-in link.");
      if (data.signInLink) setSignInLink(data.signInLink);
    } catch {
      setMessage("Could not request sign-in link. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalShell title="Participant portal" subtitle="Sign in with the email address on your participant record">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error === "invalid" ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            That sign-in link has expired or is invalid. Request a new one below.
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:opacity-50"
          >
            {loading ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        {signInLink ? (
          <p className="mt-3 text-sm">
            <span className="text-slate-600">Demo sign-in link: </span>
            <Link href={signInLink} className="font-medium text-[#b51266] hover:underline">
              Open portal
            </Link>
          </p>
        ) : null}

        <p className="mt-6 text-xs text-slate-500">
          Staff use the main app at{" "}
          <Link href="/login" className="text-[#b51266] hover:underline">
            /login
          </Link>
          .
        </p>
      </div>
    </PortalShell>
  );
}

export function PortalLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading…</div>}>
      <PortalLoginForm />
    </Suspense>
  );
}
