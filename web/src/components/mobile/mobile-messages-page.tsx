"use client";

import { useMemo } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { RosteringCommunicationPanel } from "@/components/my-workplace/rostering-communication-panel";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { isVacantShift } from "@/lib/roster-gap-analysis";
import { requestsForEmployee } from "@/lib/roster-shift-request";
import { shiftsAssignedToWorker } from "@/lib/roster-shift-checkin";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export function MobileMessagesPage() {
  const { session } = useAuth();
  const { employees, clients, locations, rosterShifts, allRosterShifts, rosterShiftRequests } = useData();
  const employeeId = session?.employeeBpId?.trim() ?? "";
  const employeeName = employees.find((e) => e.id === employeeId)?.name ?? session?.displayName ?? "Employee";

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

  return (
    <MobileAuthGuard windowKey="my-open-shifts">
      <MobileEmployeeShell title="Messages" subtitle="Contact rostering about shifts">
        {!employeeId ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your login is not linked to an employee record.
          </p>
        ) : (
          <RosteringCommunicationPanel
            employeeId={employeeId}
            employeeName={employeeName}
            relatedShifts={relatedCommunicationShifts}
            clients={clients}
            locations={locations}
          />
        )}
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
