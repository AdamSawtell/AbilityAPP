"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import type { MyWorkplaceSummary } from "@/lib/my-workplace/types";

type HubData = {
  employeeName: string;
  summary: MyWorkplaceSummary;
};

function HubTile({
  title,
  description,
  href,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {badge && badge > 0 ? (
          <span className="rounded-full bg-[#fdf2f8] px-2.5 py-0.5 text-xs font-semibold text-[#b51266] ring-1 ring-[#f9a8d4]/40">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#b51266] group-hover:gap-2">
        Open
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

export function MyWorkplaceHubPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/my", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load My workplace");
        return res.json() as Promise<HubData>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <MyWorkplaceGuard windowKey="my-workplace">
      <AppShell
        title="My workplace"
        subtitle={data ? `Signed in as ${data.employeeName}` : "Self-service for leave, profile, availability, and contracts"}
        breadcrumbs={myWorkplaceBreadcrumbs("Overview")}
        audit={{ moduleLabel: "My workplace" }}
      >
        <MyWorkplaceSubnav />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <HubTile
            title="Leave"
            description="Submit leave requests and track approval status."
            href="/my/leave"
            badge={data?.summary.pendingLeaveCount}
          />
          <HubTile
            title="About me"
            description="Update contact details and emergency contacts."
            href="/my/profile"
          />
          <HubTile
            title="Availability"
            description="Tell us when you are available to work."
            href="/my/availability"
            badge={data && !data.summary.availabilityConfigured ? 1 : 0}
          />
          <HubTile
            title="Contracts & policies"
            description="View employment documents and acknowledge required items."
            href="/my/contracts"
            badge={data?.summary.contractsToAcknowledge}
          />
        </div>
        <p className="mt-8 text-xs text-slate-500">
          Roster, timesheets, and pay slips will appear here in a future release.
        </p>
      </AppShell>
    </MyWorkplaceGuard>
  );
}
