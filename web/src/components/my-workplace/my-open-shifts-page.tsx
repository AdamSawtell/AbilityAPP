"use client";

import { useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { OpenShiftsMarketplacePanel } from "@/components/open-shifts-marketplace-panel";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { normalizeRosterShift } from "@/lib/roster-shift";

export function MyOpenShiftsPage() {
  const { session } = useAuth();
  const { clients, employees, locations, serviceBookings, rosterShifts, claimOpenRosterShift } = useData();
  const employeeId = session?.employeeBpId?.trim() ?? "";

  const handleClaim = useCallback(
    async (shift: ReturnType<typeof normalizeRosterShift>) => {
      return claimOpenRosterShift(shift.id, employeeId, session?.displayName ?? "Self-service");
    },
    [claimOpenRosterShift, employeeId, session?.displayName]
  );

  return (
    <MyWorkplaceGuard windowKey="my-open-shifts">
      <AppShell
        title="Open shifts"
        subtitle="Browse vacant shifts posted by rostering and claim cover when you are available."
        breadcrumbs={myWorkplaceBreadcrumbs("Open shifts")}
        audit={{ moduleLabel: "Open shifts" }}
      >
        <MyWorkplaceSubnav />
        {!employeeId ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your login is not linked to an employee record. Ask HR to link your user on the employee System access tab.
          </p>
        ) : null}
        <OpenShiftsMarketplacePanel
          rosterShifts={rosterShifts}
          clients={clients}
          employees={employees}
          locations={locations}
          serviceBookings={serviceBookings}
          mode="worker"
          currentEmployeeId={employeeId}
          onClaim={handleClaim}
        />
      </AppShell>
    </MyWorkplaceGuard>
  );
}
