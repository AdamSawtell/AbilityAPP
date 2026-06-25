"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";

type AgencyPortalSessionView = {
  vendorBpId: string;
  email: string;
  displayName: string;
};

export function AgencyPortalGuard({
  children,
}: {
  children: (session: AgencyPortalSessionView) => React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AgencyPortalSessionView | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/agency-portal/auth/session", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          setSession(null);
          return;
        }
        const data = (await res.json()) as { session: AgencyPortalSessionView };
        setSession(data.session);
      })
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/agency-portal/login");
  }, [session, router]);

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  if (!session) return null;

  return <>{children(session)}</>;
}

export function AgencyPortalLogoutButton() {
  async function logout() {
    await fetch("/api/agency-portal/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/agency-portal/login";
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}

export function AgencyPortalHubPage() {
  return (
    <AgencyPortalGuard>
      {(session) => (
        <AgencyPortalShell
          title={`Hello, ${session.displayName}`}
          subtitle="Confirm shift coverage, view timesheets, and submit invoices"
          actions={<AgencyPortalLogoutButton />}
        >
          <AgencyPortalNav active="home" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/agency-portal/requests"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-slate-900">Shift requests</h2>
              <p className="mt-1 text-sm text-slate-600">
                Review sent shift packs and propose which agency worker will cover each shift.
              </p>
            </Link>
            <Link
              href="/agency-portal/timesheets"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-slate-900">Timesheets</h2>
              <p className="mt-1 text-sm text-slate-600">Approved agency timesheets ready for invoicing.</p>
            </Link>
            <Link
              href="/agency-portal/invoices"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-slate-900">Invoices</h2>
              <p className="mt-1 text-sm text-slate-600">Submit and track invoices against approved timesheets.</p>
            </Link>
            <Link
              href="/agency-portal/help"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-slate-900">How to use this portal</h2>
              <p className="mt-1 text-sm text-slate-600">
                Step-by-step portal help and escalation paths for shift, timesheet, invoice, and login support.
              </p>
            </Link>
          </div>
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
