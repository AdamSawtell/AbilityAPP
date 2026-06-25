"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LoginBackdrop, OrgLogo } from "@/components/organization-landing";
import {
  organizationAddressLine,
  organizationDisplayName,
} from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";

export type PortalAuthConfig = {
  /** Short label above the heading, e.g. "Participant portal". */
  portalLabel: string;
  /** One-line description of what the portal is for. */
  intro: string;
  /** Magic-link request endpoint. */
  requestUrl: string;
  /** Help/how-to route inside the portal. */
  helpHref: string;
  /** Which email to use, e.g. "the email on your participant record". */
  recordHint: string;
  /** Label shown on the demo sign-in link. */
  openLinkLabel: string;
  /** Pre-filled email (demo convenience). */
  defaultEmail?: string;
  /** Placeholder for the email field. */
  emailPlaceholder?: string;
};

function ContactItem({ icon, children, href }: { icon: React.ReactNode; children: React.ReactNode; href?: string }) {
  const content = (
    <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
      <span className="text-white/60">{icon}</span>
      {children}
    </span>
  );
  if (href) {
    return (
      <a href={href} className="transition hover:text-white">
        {content}
      </a>
    );
  }
  return content;
}

function PortalAuthForm({ config }: { config: PortalAuthConfig }) {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? config.defaultEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signInLink, setSignInLink] = useState<string | null>(null);
  const error = searchParams.get("error");

  const orgName = organizationDisplayName(organization);
  const showLegalName =
    organization.legalName.trim() && organization.legalName.trim().toLowerCase() !== orgName.trim().toLowerCase();
  const locationLine = organizationAddressLine(organization);
  const websiteHref = organization.website?.trim()
    ? /^https?:\/\//i.test(organization.website.trim())
      ? organization.website.trim()
      : `https://${organization.website.trim()}`
    : "";
  const websiteLabel = organization.website?.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const publicEmail = organization.email?.trim();
  const showEmail = publicEmail && !publicEmail.toLowerCase().endsWith(".local");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setSignInLink(null);
    try {
      const res = await fetch(config.requestUrl, {
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
    <LoginBackdrop>
      <div className="text-center">
        <div className="mx-auto flex justify-center">
          <OrgLogo organization={organization} size="lg" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{orgName}</h1>
        {showLegalName ? <p className="mt-1 text-sm text-white/65">{organization.legalName}</p> : null}
        {locationLine ? <p className="mt-2 text-sm text-white/50">{locationLine}</p> : null}
        <p className="mt-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/85">
          {config.portalLabel}
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/75">{config.intro}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <p className="text-center text-sm font-medium text-slate-700">Sign in</p>
        <p className="mt-1 text-center text-xs text-slate-500">Sign in with {config.recordHint}.</p>

        {error === "invalid" ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            That sign-in link has expired or is invalid. Request a new one below.
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="portal-email">
              Email
            </label>
            <input
              id="portal-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
              placeholder={config.emailPlaceholder ?? "you@example.com"}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-lg bg-[#d4147a] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>

        {message ? <p className="mt-4 text-center text-sm text-slate-600">{message}</p> : null}
        {signInLink ? (
          <p className="mt-2 text-center text-sm">
            <span className="text-slate-500">Demo sign-in link: </span>
            <Link href={signInLink} className="font-semibold text-[#b51266] hover:underline">
              {config.openLinkLabel}
            </Link>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-5 text-center">
          <Link href={config.helpHref} className="text-xs font-medium text-[#b51266] underline-offset-2 hover:underline">
            How to use this portal
          </Link>
          <Link href="/login" className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline">
            Staff sign in
          </Link>
        </div>
      </div>

      {organization.phone || showEmail || websiteHref ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {organization.phone ? (
            <ContactItem
              href={`tel:${organization.phone.replace(/\s+/g, "")}`}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              }
            >
              {organization.phone}
            </ContactItem>
          ) : null}
          {showEmail ? (
            <ContactItem
              href={`mailto:${publicEmail}`}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              }
            >
              {publicEmail}
            </ContactItem>
          ) : null}
          {websiteHref ? (
            <ContactItem
              href={websiteHref}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 4.951-1.488A3.987 3.987 0 0 0 13 16h-2a4 4 0 0 1-4-4 .985.985 0 0 0-.564-.901A9 9 0 0 0 12 21Zm8.184-5.252A4 4 0 0 0 16 13h-1a3 3 0 0 1-3-3 2 2 0 0 0-2-2 8.99 8.99 0 0 1 9.962 1.252" />
                </svg>
              }
            >
              {websiteLabel}
            </ContactItem>
          ) : null}
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-white/40">
        Powered by <span className="font-medium text-white/55">AbilityVua</span>
      </p>
    </LoginBackdrop>
  );
}

export function PortalAuthLanding({ config }: { config: PortalAuthConfig }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>}>
      <PortalAuthForm config={config} />
    </Suspense>
  );
}
