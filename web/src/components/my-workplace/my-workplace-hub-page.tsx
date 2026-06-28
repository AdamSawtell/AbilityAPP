"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceActionList } from "@/components/my-workplace/my-workplace-action-list";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { MyWorkplaceServicesAdvisoryPanel } from "@/components/my-workplace/my-workplace-services-advisory-panel";
import { RosteringCommunicationPanel } from "@/components/my-workplace/rostering-communication-panel";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { MyActionItem, MyProfileGap } from "@/lib/my-workplace/compliance-dashboard";
import type { MyWorkplaceServicesAdvisory } from "@/lib/my-workplace/services-advisory";
import type { MyWorkplaceSummary } from "@/lib/my-workplace/types";
import { isVacantShift } from "@/lib/roster-gap-analysis";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { shiftsAssignedToWorker } from "@/lib/roster-shift-checkin";
import { requestsForEmployee } from "@/lib/roster-shift-request";

type HubData = {
  employeeName: string;
  summary: MyWorkplaceSummary;
  actionItems: MyActionItem[];
  profileGaps: MyProfileGap[];
  servicesAdvisory?: MyWorkplaceServicesAdvisory;
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
  const { session } = useAuth();
  const { clients, locations, rosterShifts, allRosterShifts, rosterShiftRequests } = useData();
  const [data, setData] = useState<HubData | null>(null);
  const [error, setError] = useState("");
  const employeeId = session?.employeeBpId?.trim() ?? "";
  const employeeName = data?.employeeName ?? session?.displayName ?? "Employee";

  const relatedCommunicationShifts = useMemo(() => {
    const byId = new Map<string, RosterShiftRecord>();
    for (const shift of rosterShifts) {
      if (isVacantShift(shift)) byId.set(shift.id, shift);
    }
    for (const shift of shiftsAssignedToWorker(allRosterShifts, employeeId)) {
      byId.set(shift.id, shift);
    }
    for (const request of requestsForEmployee(rosterShiftRequests, employeeId)) {
      const shift = allRosterShifts.find((row) => row.id === request.rosterShiftId);
      if (shift) byId.set(shift.id, shift);
    }
    return [...byId.values()];
  }, [allRosterShifts, rosterShifts, rosterShiftRequests, employeeId]);

  useEffect(() => {
    void fetch("/api/my", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load My workplace");
        return res.json() as Promise<HubData>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const summary = data?.summary;
  const actionCount = summary?.actionItemsCount ?? 0;

  return (
    <MyWorkplaceGuard windowKey="my-workplace">
      <AppShell
        title="My workplace"
        subtitle={data ? `Signed in as ${data.employeeName}` : "Self-service for profile, credentials, leave, and contracts"}
        breadcrumbs={myWorkplaceBreadcrumbs("Overview")}
        audit={{ moduleLabel: "My workplace" }}
      >
        <MyWorkplaceSubnav />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {data?.servicesAdvisory ? (
          <MyWorkplaceServicesAdvisoryPanel advisory={data.servicesAdvisory} />
        ) : null}

        {employeeId ? (
          <RosteringCommunicationPanel
            employeeId={employeeId}
            employeeName={employeeName}
            relatedShifts={relatedCommunicationShifts}
            clients={clients}
            locations={locations}
          />
        ) : null}

        {data ? (
          <section className="mb-8 rounded-2xl border border-[#f9a8d4]/30 bg-gradient-to-br from-[#fdf2f8]/80 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Your dashboard</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Credentials, documents, and profile items that need your attention.
                </p>
              </div>
              {summary ? (
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  {summary.overdueCount > 0 ? (
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800">{summary.overdueCount} overdue</span>
                  ) : null}
                  {summary.dueSoonCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{summary.dueSoonCount} due in 30 days</span>
                  ) : null}
                  {summary.profileGapsCount > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{summary.profileGapsCount} profile gaps</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              <MyWorkplaceActionList items={data.actionItems} limit={8} />
            </div>
            {actionCount > 8 ? (
              <p className="mt-3 text-xs text-slate-500">Showing 8 of {actionCount} items. Open a section below to see more detail.</p>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <HubTile
            title="Credentials"
            description="Add licences and checks with evidence. Track HR review and expiry."
            href="/my/credentials"
            badge={(summary?.overdueCount ?? 0) + (summary?.dueSoonCount ?? 0) + (summary?.credentialsPendingReview ?? 0) || undefined}
          />
          <HubTile
            title="About me"
            description="Contact details, emergency contacts, and home address."
            href="/my/profile"
            badge={summary?.profileGapsCount}
          />
          <HubTile
            title="Leave"
            description="Submit leave requests and track approval status."
            href="/my/leave"
            badge={summary?.pendingLeaveCount}
          />
          <HubTile
            title="Availability"
            description="Tell us when you are available to work."
            href="/my/availability"
            badge={summary && !summary.availabilityConfigured ? 1 : 0}
          />
          <HubTile
            title="My shifts"
            description="Check in and out of roster shifts assigned to you."
            href="/my/shifts"
          />
          <HubTile
            title="Contracts & policies"
            description="View employment documents and acknowledge required items."
            href="/my/contracts"
            badge={summary?.contractsToAcknowledge}
          />
        </div>
      </AppShell>
    </MyWorkplaceGuard>
  );
}
