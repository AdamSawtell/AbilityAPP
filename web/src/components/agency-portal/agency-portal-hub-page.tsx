"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";
import type {
  AgencyPortalInvoiceItem,
  AgencyPortalRequestItem,
  AgencyPortalTimesheetItem,
} from "@/lib/agency-portal/types";
import { PortalGuardSkeleton } from "@/components/ui/page-skeletons";

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
    return <PortalGuardSkeleton />;
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

type HubIconName = "requests" | "timesheets" | "invoices" | "help" | "spark";

function HubIcon({ name, className }: { name: HubIconName; className?: string }) {
  const common = {
    className: className ?? "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.6,
  } as const;
  switch (name) {
    case "requests":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "timesheets":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "invoices":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l2.25 2.25L15 9.75M9 8.25V6a2.25 2.25 0 0 1 4.5 0v2.25m-4.5 0h4.5" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      );
  }
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number | string;
  tone: "sky" | "amber" | "emerald" | "slate";
  hint?: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    sky: "text-sky-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    slate: "text-slate-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass[tone]}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  badge,
  badgeTone = "sky",
}: {
  href: string;
  icon: HubIconName;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: "sky" | "amber" | "emerald" | "slate";
}) {
  const badgeClass: Record<NonNullable<typeof badgeTone>, string> = {
    sky: "bg-sky-100 text-sky-800",
    amber: "bg-amber-100 text-amber-900",
    emerald: "bg-emerald-100 text-emerald-800",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
        <HubIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-slate-900">{title}</span>
          {badge ? (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass[badgeTone]}`}>
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-sm text-slate-600">{description}</span>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-700 group-hover:gap-1.5">
          Open
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </span>
    </Link>
  );
}

function HubContent({ session }: { session: AgencyPortalSessionView }) {
  const [requests, setRequests] = useState<AgencyPortalRequestItem[] | null>(null);
  const [timesheets, setTimesheets] = useState<AgencyPortalTimesheetItem[] | null>(null);
  const [invoices, setInvoices] = useState<AgencyPortalInvoiceItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/agency-portal/requests", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("requests");
        return r.json() as Promise<{ requests: AgencyPortalRequestItem[] }>;
      }),
      fetch("/api/agency-portal/timesheets", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("timesheets");
        return r.json() as Promise<{ timesheets: AgencyPortalTimesheetItem[] }>;
      }),
      fetch("/api/agency-portal/invoices", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("invoices");
        return r.json() as Promise<{ invoices: AgencyPortalInvoiceItem[] }>;
      }),
    ])
      .then(([req, ts, inv]) => {
        if (!active) return;
        setRequests(req.requests);
        setTimesheets(ts.timesheets);
        setInvoices(inv.invoices);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const loading = !loadError && (requests === null || timesheets === null || invoices === null);

  const stats = useMemo(() => {
    const awaitingResponse = (requests ?? []).filter((r) => r.status === "Sent").length;
    const readyToInvoice = (timesheets ?? []).filter((t) => !t.hasInvoice).length;
    const awaitingPayment = (invoices ?? []).filter(
      (i) => i.status === "Submitted" || i.status === "Approved"
    ).length;
    const paidInvoices = (invoices ?? []).filter((i) => i.status === "Paid").length;
    return { awaitingResponse, readyToInvoice, awaitingPayment, paidInvoices };
  }, [requests, timesheets, invoices]);

  const statsReady = !loading && !loadError;

  const nextStep = useMemo(() => {
    if (loading || loadError) return null;
    if (stats.awaitingResponse > 0) {
      return {
        tone: "amber" as const,
        title: `${stats.awaitingResponse} shift ${stats.awaitingResponse === 1 ? "request needs" : "requests need"} a worker`,
        body: "Open Shift requests, choose the worker who will attend, and confirm coverage so the provider can finalise the roster.",
        href: "/agency-portal/requests",
        cta: "Review shift requests",
      };
    }
    if (stats.readyToInvoice > 0) {
      return {
        tone: "sky" as const,
        title: `${stats.readyToInvoice} approved ${stats.readyToInvoice === 1 ? "timesheet is" : "timesheets are"} ready to invoice`,
        body: "Submit an invoice with your PDF or image attached so the provider's finance team can process payment.",
        href: "/agency-portal/invoices",
        cta: "Submit an invoice",
      };
    }
    if (stats.awaitingPayment > 0) {
      return {
        tone: "slate" as const,
        title: `${stats.awaitingPayment} ${stats.awaitingPayment === 1 ? "invoice is" : "invoices are"} with finance`,
        body: "Your submitted invoices are awaiting provider review and payment. You'll see the status move to Approved, then Paid.",
        href: "/agency-portal/invoices",
        cta: "Track invoices",
      };
    }
    return {
      tone: "emerald" as const,
      title: "You're all caught up",
      body: "There's nothing waiting on you right now. New shift packs and approved timesheets will appear here.",
      href: "/agency-portal/help",
      cta: "How to use this portal",
    };
  }, [loading, stats]);

  const bannerTone: Record<"amber" | "sky" | "slate" | "emerald", string> = {
    amber: "border-amber-200 bg-amber-50",
    sky: "border-sky-200 bg-sky-50",
    slate: "border-slate-200 bg-slate-50",
    emerald: "border-emerald-200 bg-emerald-50",
  };

  return (
    <>
      <AgencyPortalNav active="home" />

      {loadError ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          Could not load your latest portal activity. You can still use the links below.
        </p>
      ) : null}

      {nextStep ? (
        <section className={`mb-6 rounded-2xl border p-5 ${bannerTone[nextStep.tone]}`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-sky-700">
              <HubIcon name="spark" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your next step</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{nextStep.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{nextStep.body}</p>
              <Link
                href={nextStep.href}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800"
              >
                {nextStep.cta}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      ) : loadError ? null : (
        <div className="mb-6 h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Awaiting you"
          value={statsReady ? stats.awaitingResponse : "—"}
          tone="amber"
          hint="Shift requests to action"
        />
        <StatCard
          label="Ready to invoice"
          value={statsReady ? stats.readyToInvoice : "—"}
          tone="sky"
          hint="Approved timesheets"
        />
        <StatCard
          label="With finance"
          value={statsReady ? stats.awaitingPayment : "—"}
          tone="slate"
          hint="Invoices awaiting payment"
        />
        <StatCard label="Paid" value={statsReady ? stats.paidInvoices : "—"} tone="emerald" hint="Invoices settled" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Manage your work</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          href="/agency-portal/requests"
          icon="requests"
          title="Shift requests"
          description="Review sent shift packs and propose which agency worker will cover each shift."
          badge={statsReady && stats.awaitingResponse > 0 ? `${stats.awaitingResponse} to action` : undefined}
          badgeTone="amber"
        />
        <ActionCard
          href="/agency-portal/timesheets"
          icon="timesheets"
          title="Timesheets"
          description="Approved agency timesheets, with hours and vendor cost, ready for invoicing."
          badge={statsReady && stats.readyToInvoice > 0 ? `${stats.readyToInvoice} ready` : undefined}
          badgeTone="sky"
        />
        <ActionCard
          href="/agency-portal/invoices"
          icon="invoices"
          title="Invoices"
          description="Submit invoices with a PDF or image attached, and track approval and payment status."
          badge={statsReady && stats.awaitingPayment > 0 ? `${stats.awaitingPayment} in review` : undefined}
          badgeTone="slate"
        />
        <ActionCard
          href="/agency-portal/help"
          icon="help"
          title="How to use this portal"
          description="Step-by-step help and escalation paths for shift, timesheet, invoice, and login support."
        />
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{session.email}</span>. Keep participant details inside
        the portal. For urgent issues, use the escalation paths in{" "}
        <Link href="/agency-portal/help" className="font-medium text-sky-700 hover:underline">
          How to use this portal
        </Link>
        .
      </p>
    </>
  );
}

export function AgencyPortalHubPage() {
  return (
    <AgencyPortalGuard>
      {(session) => (
        <AgencyPortalShell
          title={`Welcome, ${session.displayName}`}
          subtitle="Confirm shift coverage, review timesheets, and submit invoices"
          actions={<AgencyPortalLogoutButton />}
        >
          <HubContent session={session} />
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
