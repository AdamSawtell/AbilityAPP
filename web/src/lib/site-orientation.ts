/** Site orientation gate (AB-0018) — employees and agency workers at a location. */
export type SiteOrientationWorkerType = "employee" | "agency";

export type SiteOrientationRecord = {
  id: string;
  workerType: SiteOrientationWorkerType;
  workerId: string;
  locationId: string;
  orientedAt: string;
  expiresAt: string;
  acknowledgedBy: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

/** Months without working at site before re-orientation is required. */
export const SITE_ORIENTATION_GAP_MONTHS = 1;

export const initialSiteOrientations: SiteOrientationRecord[] = [
  {
    id: "so-aw-jane-glenelg",
    workerType: "agency",
    workerId: "aw-sp-jane",
    locationId: "loc-glenelg-sil",
    orientedAt: "2025-09-01",
    expiresAt: "2026-09-01",
    acknowledgedBy: "Isla Robinson",
    notes: "Initial site orientation — fire exits and client routines.",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  },
];

export function normalizeSiteOrientation(record: SiteOrientationRecord): SiteOrientationRecord {
  return {
    ...record,
    workerType: (record.workerType === "employee" ? "employee" : "agency") as SiteOrientationWorkerType,
    workerId: record.workerId ?? "",
    locationId: record.locationId ?? "",
    orientedAt: record.orientedAt?.slice(0, 10) ?? "",
    expiresAt: record.expiresAt?.slice(0, 10) ?? "",
    acknowledgedBy: record.acknowledgedBy ?? "",
    notes: record.notes ?? "",
    createdBy: record.createdBy ?? "SuperUser",
    updatedBy: record.updatedBy ?? "SuperUser",
  };
}

function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function monthsBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export type SiteOrientationCheck = {
  ok: boolean;
  severity: "ok" | "warning" | "error";
  message: string;
};

export function latestOrientationForWorker(
  orientations: SiteOrientationRecord[],
  workerType: SiteOrientationWorkerType,
  workerId: string,
  locationId: string
): SiteOrientationRecord | undefined {
  const matches = orientations
    .filter((o) => o.workerType === workerType && o.workerId === workerId && o.locationId === locationId)
    .map(normalizeSiteOrientation)
    .sort((a, b) => b.orientedAt.localeCompare(a.orientedAt));
  return matches[0];
}

export function checkSiteOrientation(
  orientations: SiteOrientationRecord[],
  workerType: SiteOrientationWorkerType,
  workerId: string,
  locationId: string,
  shiftDate: string,
  lastWorkedAtLocation?: string
): SiteOrientationCheck {
  if (!locationId?.trim() || !workerId?.trim()) {
    return { ok: true, severity: "ok", message: "No location — orientation not required." };
  }

  const latest = latestOrientationForWorker(orientations, workerType, workerId, locationId);
  if (!latest?.orientedAt) {
    return {
      ok: false,
      severity: "error",
      message: "Site orientation required — no orientation on file for this location.",
    };
  }

  if (latest.expiresAt && shiftDate > latest.expiresAt) {
    return {
      ok: false,
      severity: "error",
      message: `Site orientation expired on ${latest.expiresAt}.`,
    };
  }

  if (lastWorkedAtLocation) {
    const gap = monthsBetween(lastWorkedAtLocation, shiftDate);
    if (gap >= SITE_ORIENTATION_GAP_MONTHS) {
      return {
        ok: false,
        severity: "warning",
        message: `Worker has not worked at this site for ${gap} month(s) — re-orientation recommended.`,
      };
    }
  }

  return { ok: true, severity: "ok", message: "Site orientation current." };
}

export function orientationValidUntil(orientedAt: string): string {
  return addMonthsIso(orientedAt, 12);
}
