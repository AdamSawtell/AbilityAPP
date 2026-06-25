"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PortalNav, PortalShell } from "@/components/portal/portal-shell";
import { formatDisplayDate } from "@/lib/enquiry";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import type { PortalBudgetView, PortalServiceItem } from "@/lib/portal/types";
import type { PortalServiceRequestRecord } from "@/lib/portal/service-request";

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

type HubIconName = "services" | "budget" | "requests" | "help" | "spark";

function HubIcon({ name, className }: { name: HubIconName; className?: string }) {
  const common = {
    className: className ?? "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.6,
  } as const;
  switch (name) {
    case "services":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      );
    case "budget":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 19.5h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
        </svg>
      );
    case "requests":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

type Tone = "pink" | "amber" | "emerald" | "slate";

function StatCard({ label, value, tone, hint }: { label: string; value: number | string; tone: Tone; hint?: string }) {
  const toneClass: Record<Tone, string> = {
    pink: "text-[#b51266]",
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
  badgeTone = "pink",
}: {
  href: string;
  icon: HubIconName;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: Tone;
}) {
  const badgeClass: Record<Tone, string> = {
    pink: "bg-[#fdf2f8] text-[#b51266]",
    amber: "bg-amber-100 text-amber-900",
    emerald: "bg-emerald-100 text-emerald-800",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4] hover:shadow-md"
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fdf2f8] text-[#b51266]">
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
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#b51266] group-hover:gap-1.5">
          Open
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </span>
    </Link>
  );
}

function daysUntil(dateIso: string): number | null {
  if (!dateIso) return null;
  const target = new Date(`${dateIso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function HubContent({ session }: { session: PortalSessionView }) {
  const [services, setServices] = useState<PortalServiceItem[] | null>(null);
  const [budget, setBudget] = useState<PortalBudgetView | null>(null);
  const [requests, setRequests] = useState<PortalServiceRequestRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/portal/services", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("services");
        return r.json() as Promise<{ services: PortalServiceItem[] }>;
      }),
      fetch("/api/portal/budget", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("budget");
        return r.json() as Promise<{ budget: PortalBudgetView }>;
      }),
      fetch("/api/portal/requests", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("requests");
        return r.json() as Promise<{ requests: PortalServiceRequestRecord[] }>;
      }),
    ])
      .then(([svc, bud, req]) => {
        if (!active) return;
        setServices(svc.services ?? []);
        setBudget(bud.budget ?? null);
        setRequests(req.requests ?? []);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const loading = !loadError && (services === null || budget === null || requests === null);
  const statsReady = !loading && !loadError;

  const nextService = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowHm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const upcoming = (services ?? []).filter((s) => {
      const day = s.shiftDate.slice(0, 10);
      if (day > todayIso) return true;
      if (day < todayIso) return false;
      // Same day: keep only supports that have not finished yet.
      return (s.endTime || s.startTime || "") >= nowHm;
    });
    upcoming.sort((a, b) => `${a.shiftDate}T${a.startTime}`.localeCompare(`${b.shiftDate}T${b.startTime}`));
    return upcoming[0] ?? null;
  }, [services]);

  const stats = useMemo(() => {
    const upcomingServices = (services ?? []).length;
    const remaining = budget?.overall.remaining ?? null;
    const requestsInReview = (requests ?? []).filter(
      (r) => r.status === "Submitted" || r.status === "Under review"
    ).length;
    return { upcomingServices, remaining, requestsInReview };
  }, [services, budget, requests]);

  const planReviewDays = daysUntil(session.planReviewDueDate);

  const nextStep = useMemo(() => {
    if (loading || loadError) return null;
    if (stats.requestsInReview > 0) {
      return {
        tone: "amber" as Tone,
        title: `${stats.requestsInReview} service ${stats.requestsInReview === 1 ? "request is" : "requests are"} under review`,
        body: "Your coordinator is reviewing your request. You'll see the status change to Approved or Declined, with any reason explained.",
        href: "/portal/requests",
        cta: "Track your requests",
      };
    }
    if (planReviewDays !== null && planReviewDays < 0) {
      return {
        tone: "amber" as Tone,
        title: "Your plan review date has passed",
        body: "Talk to your coordinator about your next plan, and check your remaining funding.",
        href: "/portal/budget",
        cta: "View my funding",
      };
    }
    if (nextService) {
      return {
        tone: "pink" as Tone,
        title: `Your next support is ${formatDisplayDate(nextService.shiftDate)}`,
        body: `${nextService.startTime} – ${nextService.endTime} · ${nextService.shiftType}${nextService.workerName ? ` with ${nextService.workerName}` : ""}. Open My services to see your full week.`,
        href: "/portal/services",
        cta: "View my services",
      };
    }
    if (planReviewDays !== null && planReviewDays <= 60) {
      return {
        tone: "slate" as Tone,
        title: `Plan review due ${formatDisplayDate(session.planReviewDueDate)}`,
        body: "Check your funding and talk to your coordinator about your next plan.",
        href: "/portal/budget",
        cta: "View my funding",
      };
    }
    return {
      tone: "emerald" as Tone,
      title: "You're all set",
      body: "There's nothing needing your attention right now. New supports and updates will appear here.",
      href: "/portal/help",
      cta: "How to use your portal",
    };
  }, [loading, loadError, stats.requestsInReview, nextService, planReviewDays, session.planReviewDueDate]);

  const bannerTone: Record<Tone, string> = {
    pink: "border-[#f9a8d4] bg-[#fdf2f8]",
    amber: "border-amber-200 bg-amber-50",
    slate: "border-slate-200 bg-slate-50",
    emerald: "border-emerald-200 bg-emerald-50",
  };

  return (
    <>
      <PortalNav active="home" />

      {loadError ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          Could not load your latest portal activity. You can still use the links below.
        </p>
      ) : null}

      {nextStep ? (
        <section className={`mb-6 rounded-2xl border p-5 ${bannerTone[nextStep.tone]}`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-[#b51266]">
              <HubIcon name="spark" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your next step</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{nextStep.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{nextStep.body}</p>
              <Link
                href={nextStep.href}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#d4147a] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#b51266]"
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
          label="Upcoming supports"
          value={statsReady ? stats.upcomingServices : "—"}
          tone="pink"
          hint="Next eight weeks"
        />
        <StatCard
          label="Funding remaining"
          value={statsReady && stats.remaining !== null ? formatPlanBudgetCurrency(stats.remaining) : "—"}
          tone="emerald"
          hint="Across your plan"
        />
        <StatCard
          label="Requests in review"
          value={statsReady ? stats.requestsInReview : "—"}
          tone="amber"
          hint="Awaiting your coordinator"
        />
        <StatCard
          label="Plan review"
          value={session.planReviewDueDate ? formatDisplayDate(session.planReviewDueDate) : "—"}
          tone="slate"
          hint="Plan end date"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Explore your portal</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          href="/portal/services"
          icon="services"
          title="My services"
          description="Week calendar and list of upcoming supports, workers, and locations."
          badge={statsReady && stats.upcomingServices > 0 ? `${stats.upcomingServices} upcoming` : undefined}
          badgeTone="pink"
        />
        <ActionCard
          href="/portal/budget"
          icon="budget"
          title="My funding"
          description="Plan budget summary with allocated, used, and remaining by support category."
        />
        <ActionCard
          href="/portal/requests"
          icon="requests"
          title="Request a service"
          description="Ask for new or changed supports and track status through to approval."
          badge={statsReady && stats.requestsInReview > 0 ? `${stats.requestsInReview} in review` : undefined}
          badgeTone="amber"
        />
        <ActionCard
          href="/portal/help"
          icon="help"
          title="How to use your portal"
          description="Step-by-step help for services, funding, and requests, plus who to contact."
        />
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{session.email}</span>. For help, see{" "}
        <Link href="/portal/help" className="font-medium text-[#b51266] hover:underline">
          How to use your portal
        </Link>
        . In an emergency, call 000.
      </p>
    </>
  );
}

export function PortalHubPage() {
  return (
    <PortalGuard>
      {(session) => (
        <PortalShell
          title={`Welcome, ${session.displayName}`}
          subtitle="Your supports, funding, and service requests in one place"
          actions={<PortalLogoutButton />}
        >
          <HubContent session={session} />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
