"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MyWorkplaceServicesAdvisoryPanel } from "@/components/my-workplace/my-workplace-services-advisory-panel";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { useData } from "@/lib/data-store";
import { buildMyWorkplaceServicesAdvisory } from "@/lib/my-workplace/services-advisory";
import {
  DEFAULT_ORGANIZATION_TIMEZONE,
  organizationTodayIso,
} from "@/lib/system-timezone";
import { useSystemTimezoneOptional } from "@/lib/system-timezone-store";

export function MobileServicesPage() {
  const { employee, linked } = useMyEmployee();
  const { locations, siteOrientations, allRosterShifts } = useData();
  const timezoneCtx = useSystemTimezoneOptional();
  const timezone = timezoneCtx?.timezone ?? DEFAULT_ORGANIZATION_TIMEZONE;
  const orgToday = useMemo(() => organizationTodayIso(timezone), [timezone]);

  const advisory = useMemo(() => {
    if (!employee) return null;
    return buildMyWorkplaceServicesAdvisory({
      employee,
      locations,
      siteOrientations,
      rosterShifts: allRosterShifts,
      today: orgToday,
    });
  }, [allRosterShifts, employee, locations, orgToday, siteOrientations]);

  return (
    <MobileAuthGuard windowKey="my-workplace">
      <MobileEmployeeShell title="Services I can work at" subtitle="Qualified sites and high-demand advisory">
        {!linked || !employee ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your login is not linked to an employee record.
          </p>
        ) : advisory?.sites.length ? (
          <MyWorkplaceServicesAdvisoryPanel advisory={advisory} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-700">
            <p className="font-medium text-slate-900">No qualified services yet</p>
            <p className="mt-2">
              Sites appear here when you have an active location assignment, current mandatory credentials (Working with
              Children Check and NDIS Worker Screening), and a valid site orientation.
            </p>
            <p className="mt-3">
              Need a new service?{" "}
              <Link href="/m/messages" className="font-semibold text-[#b51266] underline">
                Contact rostering
              </Link>{" "}
              — you cannot assign yourself from this list.
            </p>
          </div>
        )}
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
