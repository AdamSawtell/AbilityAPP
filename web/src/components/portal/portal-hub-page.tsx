"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalNav, PortalShell } from "@/components/portal/portal-shell";
import { formatDisplayDate } from "@/lib/enquiry";

type PortalSessionView = {
  clientId: string;
  email: string;
  displayName: string;
  planReviewDueDate: string;
};

export function PortalGuard({
  children,
}: {
  children: (session: PortalSessionView) => React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<PortalSessionView | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/portal/auth/session", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          setSession(null);
          return;
        }
        const data = (await res.json()) as { session: PortalSessionView };
        setSession(data.session);
      })
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/portal/login");
  }, [session, router]);

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  if (!session) return null;

  return <>{children(session)}</>;
}

export function PortalLogoutButton() {
  async function logout() {
    await fetch("/api/portal/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/portal/login";
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

export function PortalHubPage() {
  return (
    <PortalGuard>
      {(session) => (
        <PortalShell
          title={`Hello, ${session.displayName}`}
          subtitle="View your upcoming services and plan funding"
          actions={<PortalLogoutButton />}
        >
          <PortalNav active="home" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/portal/services"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4]/60 hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-slate-900">My services</h2>
              <p className="mt-1 text-sm text-slate-600">Upcoming supports, times, workers, and locations.</p>
            </Link>
            <Link
              href="/portal/budget"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4]/60 hover:shadow-md"
            >
              <h2 className="text-base font-semibold text-slate-900">My funding</h2>
              <p className="mt-1 text-sm text-slate-600">Plan budget summary by support category.</p>
            </Link>
          </div>

          {session.planReviewDueDate ? (
            <p className="mt-6 text-sm text-slate-600">
              Plan review due: <strong>{formatDisplayDate(session.planReviewDueDate)}</strong>
            </p>
          ) : null}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
