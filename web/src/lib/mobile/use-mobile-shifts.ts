"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { captureMobileGeolocation } from "@/lib/mobile/geo-cache";
import { idbGetAllShifts } from "@/lib/mobile/idb";
import { enqueueOfflineWrite } from "@/lib/mobile/offline-sync";
import { useMobileOnline } from "@/lib/mobile/use-mobile-online";
import { useMobileShiftCache } from "@/lib/mobile/use-mobile-shift-cache";
import { useMobileSyncState } from "@/lib/mobile/use-mobile-sync";
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
  const online = useMobileOnline();
  const sync = useMobileSyncState();
  const timezoneCtx = useSystemTimezoneOptional();
  const timezone = timezoneCtx?.timezone ?? DEFAULT_ORGANIZATION_TIMEZONE;
  const orgToday = useMemo(() => organizationTodayIso(timezone), [timezone]);
  const employeeId = employee?.id?.trim() ?? session?.employeeBpId?.trim() ?? "";
  const updatedBy = session?.displayName ?? "Self-service";

  const [cachedShifts, setCachedShifts] = useState<RosterShiftRecord[]>([]);

  useEffect(() => {
    if (online) return;
    void idbGetAllShifts()
      .then(setCachedShifts)
      .catch(() => setCachedShifts([]));
  }, [online]);

  const sourceShifts = online && rosterShifts.length ? rosterShifts : cachedShifts.length ? cachedShifts : rosterShifts;

  useMobileShiftCache(employeeId, rosterShifts, orgToday);

  const scheduleShifts = useMemo(
    () => shiftsForWorkerSchedule(sourceShifts, employeeId, orgToday),
    [sourceShifts, employeeId, orgToday]
  );
  const allAssigned = useMemo(
    () => shiftsAssignedToWorker(sourceShifts, employeeId),
    [sourceShifts, employeeId]
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

  const runCheckIn = useCallback(
    async (shiftId: string) => {
      const geoResult = await captureMobileGeolocation(!online);
      const payload = {
        timestamp: new Date().toISOString(),
        latitude: geoResult.coords?.latitude,
        longitude: geoResult.coords?.longitude,
        geoApproximate: geoResult.approximate,
      };

      if (!online) {
        await enqueueOfflineWrite({
          shiftId,
          employeeId,
          actionType: "checkin",
          payload,
        });
        await sync.refreshPending();
        return;
      }

      const message = await checkInRosterShift(shiftId, employeeId, updatedBy, geoResult.coords);
      if (message) setError(message);
      await sync.syncNow();
    },
    [checkInRosterShift, employeeId, online, sync, updatedBy]
  );

  const runCheckOut = useCallback(
    async (shiftId: string) => {
      const geoResult = await captureMobileGeolocation(!online);
      const notes = notesByShift[shiftId] ?? "";
      const payload = {
        timestamp: new Date().toISOString(),
        latitude: geoResult.coords?.latitude,
        longitude: geoResult.coords?.longitude,
        notes,
        geoApproximate: geoResult.approximate,
      };

      if (!online) {
        await enqueueOfflineWrite({
          shiftId,
          employeeId,
          actionType: "checkout",
          payload,
        });
        await sync.refreshPending();
        return;
      }

      const message = await checkOutRosterShift(shiftId, employeeId, updatedBy, notes, geoResult.coords);
      if (message) setError(message);
      await sync.syncNow();
    },
    [checkOutRosterShift, employeeId, notesByShift, online, sync, updatedBy]
  );

  const handleCheckIn = useCallback(
    async (shiftId: string) => {
      setError("");
      setBusyId(shiftId);
      try {
        await runCheckIn(shiftId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check-in failed");
      } finally {
        setBusyId(null);
      }
    },
    [runCheckIn]
  );

  const handleCheckOut = useCallback(
    async (shiftId: string) => {
      setError("");
      setBusyId(shiftId);
      try {
        await runCheckOut(shiftId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check-out failed");
      } finally {
        setBusyId(null);
      }
    },
    [runCheckOut]
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
    online,
    sync,
  };
}
