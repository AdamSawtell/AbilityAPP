"use client";

import { useEffect } from "react";
import { addDaysIso } from "@/lib/roster-shift";
import { MOBILE_SHIFT_CACHE_HOURS } from "@/lib/mobile/constants";
import { idbPutShifts } from "@/lib/mobile/idb";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { shiftsAssignedToWorker } from "@/lib/roster-shift-checkin";

export function useMobileShiftCache(employeeId: string, rosterShifts: RosterShiftRecord[], orgToday: string) {
  useEffect(() => {
    if (!employeeId || typeof indexedDB === "undefined") return;
    const assigned = shiftsAssignedToWorker(rosterShifts, employeeId);
    const horizon = addDaysIso(orgToday, Math.ceil(MOBILE_SHIFT_CACHE_HOURS / 24));
    const past = addDaysIso(orgToday, -1);
    const bounded = assigned.filter((s) => s.shiftDate >= past && s.shiftDate <= horizon);
    void idbPutShifts(bounded).catch(() => undefined);
  }, [employeeId, rosterShifts, orgToday]);
}
