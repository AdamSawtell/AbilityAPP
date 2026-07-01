"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { captureGeolocation } from "@/lib/geolocation";
import {
  filterMyShiftsView,
  groupShiftsByDate,
  nextMyShiftAction,
} from "@/lib/my-shifts-grouping";
import { shiftsAssignedToWorker, shiftsForWorkerSchedule } from "@/lib/roster-shift-checkin";
import {
  DEFAULT_ORGANIZATION_TIMEZONE,
  organizationTodayIso,
} from "@/lib/system-timezone";
import { useSystemTimezoneOptional } from "@/lib/system-timezone-store";
import { defaultPayPeriodRange } from "@/lib/pay-period";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export function useMobileShifts() {
  const { session } = useAuth();
  const { employee } = useMyEmployee();
  const { clients, locations, rosterShifts, payPeriodInstances, checkInRosterShift, checkOutRosterShift } =
    useData();
  const timezoneCtx = useSystemTimezoneOptional();
  const timezone = timezoneCtx?.timezone ?? DEFAULT_ORGANIZATION_TIMEZONE;
  const orgToday = useMemo(() => organizationTodayIso(timezone), [timezone]);
  const employeeId = employee?.id?.trim() ?? session?.employeeBpId?.trim() ?? "";
  const updatedBy = session?.displayName ?? "Self-service";

  const scheduleShifts = useMemo(
    () => shiftsForWorkerSchedule(rosterShifts, employeeId, orgToday),
    [rosterShifts, employeeId, orgToday]
  );
  const allAssigned = useMemo(
    () => shiftsAssignedToWorker(rosterShifts, employeeId),
    [rosterShifts, employeeId]
  );

  const payPeriod = useMemo(
    () => defaultPayPeriodRange(payPeriodInstances, orgToday),
    [payPeriodInstances, orgToday]
  );

  const periodShifts = useMemo(() => {
    if (!employeeId) return [];
    return allAssigned.filter(
      (s) => s.shiftDate >= payPeriod.periodStart && s.shiftDate <= payPeriod.periodEnd && s.status !== "Cancelled"
    );
  }, [allAssigned, employeeId, payPeriod.periodEnd, payPeriod.periodStart]);

  const todayShifts = useMemo(
    () => filterMyShiftsView(scheduleShifts, "today", employeeId, orgToday),
    [scheduleShifts, employeeId, orgToday]
  );
  const todayGroups = useMemo(() => groupShiftsByDate(todayShifts, orgToday), [todayShifts, orgToday]);
  const periodGroups = useMemo(() => groupShiftsByDate(periodShifts, orgToday), [periodShifts, orgToday]);
  const actionShift = useMemo(
    () => nextMyShiftAction(scheduleShifts, employeeId, orgToday),
    [scheduleShifts, employeeId, orgToday]
  );

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notesByShift, setNotesByShift] = useState<Record<string, string>>({});

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const locationById = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  const handleCheckIn = useCallback(
    async (shiftId: string) => {
      setError("");
      setBusyId(shiftId);
      try {
        const geo = await captureGeolocation();
        const message = await checkInRosterShift(shiftId, employeeId, updatedBy, geo);
        if (message) setError(message);
      } finally {
        setBusyId(null);
      }
    },
    [checkInRosterShift, employeeId, updatedBy]
  );

  const handleCheckOut = useCallback(
    async (shiftId: string) => {
      setError("");
      setBusyId(shiftId);
      try {
        const geo = await captureGeolocation();
        const message = await checkOutRosterShift(
          shiftId,
          employeeId,
          updatedBy,
          notesByShift[shiftId] ?? "",
          geo
        );
        if (message) setError(message);
      } finally {
        setBusyId(null);
      }
    },
    [checkOutRosterShift, employeeId, notesByShift, updatedBy]
  );

  function shiftContext(shift: RosterShiftRecord) {
    return {
      client: clientById.get(shift.clientId),
      location: locationById.get(shift.locationId),
    };
  }

  return {
    employeeId,
    employee,
    orgToday,
    payPeriod,
    todayShifts,
    todayGroups,
    periodShifts,
    periodGroups,
    actionShift,
    busyId,
    error,
    setError,
    notesByShift,
    setNotesByShift,
    handleCheckIn,
    handleCheckOut,
    shiftContext,
  };
}
