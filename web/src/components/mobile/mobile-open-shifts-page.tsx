"use client";

import { useCallback, useEffect, useState } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MobileMyShiftRequestsPanel } from "@/components/mobile/mobile-my-shift-requests-panel";
import { OpenShiftsMarketplacePanel } from "@/components/open-shifts-marketplace-panel";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { ShiftRequestResponseType } from "@/lib/roster-shift-request";
import { normalizeRosterShift } from "@/lib/roster-shift";
import type { EmployeeAvailabilityRow } from "@/lib/employee";

export function MobileOpenShiftsPage() {
  const { session } = useAuth();
  const {
    clients,
    clientCatalog,
    employees,
    locations,
    locationCatalog,
    serviceBookings,
    rosterShifts,
    allRosterShifts,
    rosterShiftRequests,
    locationScope,
    submitShiftRequest,
    withdrawShiftRequest,
  } = useData();
  const employeeId = session?.employeeBpId?.trim() ?? "";
  const actor = session?.displayName ?? "Self-service";
  const [availability, setAvailability] = useState<EmployeeAvailabilityRow[]>([]);
  const [availabilityReady, setAvailabilityReady] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/my/availability", { credentials: "include" })
      .then((res) =>
        res.ok ? (res.json() as Promise<{ rows: EmployeeAvailabilityRow[]; configured?: boolean }>) : null
      )
      .then((data) => {
        if (!active) return;
        setAvailability(data?.configured ? data.rows ?? [] : []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setAvailabilityReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmitRequest = useCallback(
    async (shift: ReturnType<typeof normalizeRosterShift>, responseType: ShiftRequestResponseType) => {
      return submitShiftRequest(shift.id, employeeId, responseType, actor);
    },
    [submitShiftRequest, employeeId, actor]
  );

  const handleWithdraw = useCallback(
    async (requestId: string) => withdrawShiftRequest(requestId, actor),
    [withdrawShiftRequest, actor]
  );

  return (
    <MobileAuthGuard windowKey="my-open-shifts">
      <MobileEmployeeShell title="Open shifts" subtitle="Browse vacant shifts and apply">
        {!employeeId ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your login is not linked to an employee record.
          </p>
        ) : null}
        {employeeId ? (
          <MobileMyShiftRequestsPanel
            employeeId={employeeId}
            requests={rosterShiftRequests}
            shifts={allRosterShifts}
            locations={locations}
            clients={clients}
          />
        ) : null}
        <OpenShiftsMarketplacePanel
          rosterShifts={rosterShifts}
          allRosterShifts={allRosterShifts}
          rosterShiftRequests={rosterShiftRequests}
          locationScope={locationScope}
          clients={clients}
          clientCatalog={clientCatalog}
          employees={employees}
          locations={locations}
          locationCatalog={locationCatalog}
          serviceBookings={serviceBookings}
          mode="worker"
          currentEmployeeId={employeeId}
          availability={availability}
          availabilityReady={availabilityReady}
          onSubmitRequest={handleSubmitRequest}
          onWithdrawRequest={handleWithdraw}
        />
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
