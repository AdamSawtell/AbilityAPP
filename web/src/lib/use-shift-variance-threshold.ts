"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SHIFT_HOURS_VARIANCE_THRESHOLD,
  type ShiftCheckinMonitoringSettings,
} from "@/lib/shift-checkin-monitoring";

/**
 * Client hook returning the centrally configured timesheet hours variance
 * threshold so verification display matches the server approval gate. Falls
 * back to the default until the setting loads.
 */
export function useShiftVarianceThreshold(): number {
  const [threshold, setThreshold] = useState(DEFAULT_SHIFT_HOURS_VARIANCE_THRESHOLD);

  useEffect(() => {
    let active = true;
    void fetch("/api/system/settings/shift-monitoring", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data: { settings?: ShiftCheckinMonitoringSettings } | null) => {
        if (!active || !data?.settings) return;
        const value = Number(data.settings.hoursVarianceThreshold);
        if (Number.isFinite(value) && value >= 0) setThreshold(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return threshold;
}
