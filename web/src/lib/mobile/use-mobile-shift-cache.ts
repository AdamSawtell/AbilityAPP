"use client";

import { useEffect } from "react";
import { addDaysIso } from "@/lib/roster-shift";
import { MOBILE_SHIFT_CACHE_HOURS } from "@/lib/mobile/constants";
import { idbPutShiftCacheMeta, idbPutShifts } from "@/lib/mobile/idb";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { shiftsAssignedToWorker } from "@/lib/roster-shift-checkin";

export function useMobileShiftCache(
  employeeId: string,
  rosterShifts: RosterShiftRecord[],
  orgToday: string,
  payPeriod?: { periodStart: string; periodEnd: string }
) {
  useEffect(() => {
    if (!employeeId || typeof indexedDB === "undefined") return;
    const assigned = shiftsAssignedToWorker(rosterShifts, employeeId);
    const past = addDaysIso(orgToday, -1);
    const horizon = addDaysIso(orgToday, Math.ceil(MOBILE_SHIFT_CACHE_HOURS / 24));
    const periodStart = payPeriod?.periodStart ?? past;
    const periodEnd = payPeriod?.periodEnd ?? horizon;
    const cacheFrom = periodStart < past ? periodStart : past;
    const cacheTo = periodEnd > horizon ? periodEnd : horizon;
    const bounded = assigned.filter((s) => s.shiftDate >= cacheFrom && s.shiftDate <= cacheTo);
    void idbPutShifts(bounded)
      .then(() =>
        idbPutShiftCacheMeta({
          key: "schedule",
          cachedAt: new Date().toISOString(),
          payPeriodStart: periodStart,
          payPeriodEnd: periodEnd,
          shiftCount: bounded.length,
        })
      )
      .catch(() => undefined);
  }, [employeeId, orgToday, payPeriod?.periodEnd, payPeriod?.periodStart, rosterShifts]);
}
