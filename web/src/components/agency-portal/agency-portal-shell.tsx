"use client";

import Link from "next/link";
import { useOrganization } from "@/lib/organization-store";
import { RecordAuditFooter } from "@/components/record-audit-footer";

export function AgencyPortalShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { organization } = useOrganization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/40">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Agency vendor portal</p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
        <RecordAuditFooter moduleLabel="Agency vendor portal" />
        <p className="mt-3 text-center text-xs text-slate-400">
          Need help?{" "}
          <Link href="/agency-portal/help" className="font-medium text-sky-700 hover:underline">
            How to use this portal
          </Link>{" "}
          · Contact {organization.phone || organization.email || "your provider"} for support or escalation.
        </p>
      </footer>
    </div>
  );
}

export function AgencyPortalNav({ active }: { active: "home" | "requests" | "timesheets" | "invoices" | "help" }) {
  const linkClass = (key: typeof active) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${
      active === key ? "bg-sky-50 text-sky-800" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      <Link href="/agency-portal" className={linkClass("home")}>
        Home
      </Link>
      <Link href="/agency-portal/requests" className={linkClass("requests")}>
        Shift requests
      </Link>
      <Link href="/agency-portal/timesheets" className={linkClass("timesheets")}>
        Timesheets
      </Link>
      <Link href="/agency-portal/invoices" className={linkClass("invoices")}>
        Invoices
      </Link>
      <Link href="/agency-portal/help" className={linkClass("help")}>
        How to use this portal
      </Link>
    </nav>
  );
}
