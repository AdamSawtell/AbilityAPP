"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { agencyWorkerDisplayName } from "@/lib/agency-worker";
import { useData } from "@/lib/data-store";
import {
  checkSiteOrientation,
  createSiteOrientation,
  orientationsForLocation,
  orientationsForWorker,
  SITE_ORIENTATION_GAP_MONTHS,
  type SiteOrientationRecord,
  type SiteOrientationWorkerType,
} from "@/lib/site-orientation";

type SiteOrientationPanelProps = {
  locationId?: string;
  workerType?: SiteOrientationWorkerType;
  workerId?: string;
  readOnly?: boolean;
  actor?: string;
  /** Pre-fill add form when recording from agency drawer */
  defaultWorkerType?: SiteOrientationWorkerType;
  defaultWorkerId?: string;
  defaultLocationId?: string;
  shiftDate?: string;
  lastWorkedAtLocation?: string;
};

function workerLabel(
  row: SiteOrientationRecord,
  agencyWorkers: ReturnType<typeof useData>["agencyWorkers"],
  employees: ReturnType<typeof useData>["employees"]
): string {
  if (row.workerType === "agency") {
    const w = agencyWorkers.find((a) => a.id === row.workerId);
    return w ? agencyWorkerDisplayName(w) : row.workerId;
  }
  const e = employees.find((x) => x.id === row.workerId);
  return e?.name || e?.searchKey || row.workerId;
}

export function SiteOrientationPanel({
  locationId,
  workerType,
  workerId,
  readOnly = false,
  actor = "SuperUser",
  defaultWorkerType = "agency",
  defaultWorkerId = "",
  defaultLocationId = "",
  shiftDate,
  lastWorkedAtLocation,
}: SiteOrientationPanelProps) {
  const { siteOrientations, agencyWorkers, employees, locations, upsertSiteOrientation } = useData();

  const rows = useMemo(() => {
    if (locationId) return orientationsForLocation(siteOrientations, locationId);
    if (workerType && workerId) return orientationsForWorker(siteOrientations, workerType, workerId);
    return [];
  }, [siteOrientations, locationId, workerType, workerId]);

  const [formWorkerType, setFormWorkerType] = useState<SiteOrientationWorkerType>(
    workerType ?? defaultWorkerType
  );
  const [formWorkerId, setFormWorkerId] = useState(workerId ?? defaultWorkerId);
  const [formLocationId, setFormLocationId] = useState(locationId ?? defaultLocationId);
  const [orientedAt, setOrientedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (workerType) setFormWorkerType(workerType);
    if (workerId) setFormWorkerId(workerId);
    else if (defaultWorkerId) setFormWorkerId(defaultWorkerId);
    if (locationId) setFormLocationId(locationId);
    else if (defaultLocationId) setFormLocationId(defaultLocationId);
    if (defaultWorkerType && !workerType) setFormWorkerType(defaultWorkerType);
  }, [workerType, workerId, locationId, defaultWorkerId, defaultLocationId, defaultWorkerType]);

  const baseInput =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50";

  const previewCheck = useMemo(() => {
    if (!formWorkerId?.trim() || !formLocationId?.trim()) return null;
    return checkSiteOrientation(
      siteOrientations,
      formWorkerType,
      formWorkerId,
      formLocationId,
      shiftDate ?? orientedAt,
      lastWorkedAtLocation
    );
  }, [
    siteOrientations,
    formWorkerType,
    formWorkerId,
    formLocationId,
    shiftDate,
    orientedAt,
    lastWorkedAtLocation,
  ]);

  function handleSave() {
    if (!formWorkerId?.trim() || !formLocationId?.trim() || !orientedAt?.trim()) {
      setFormError("Worker, location, and orientation date are required.");
      return;
    }
    if (!acknowledgedBy.trim()) {
      setFormError("Acknowledged by is required.");
      return;
    }
    const record = createSiteOrientation(
      {
        workerType: formWorkerType,
        workerId: formWorkerId,
        locationId: formLocationId,
        orientedAt,
        acknowledgedBy: acknowledgedBy.trim(),
        notes: notes.trim(),
        createdBy: actor,
        updatedBy: actor,
      },
      siteOrientations
    );
    const err = upsertSiteOrientation(record);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setMessage("Site orientation saved.");
    setNotes("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
        Record who was oriented to which site and when. Agency shift confirm is blocked when orientation is missing,
        expired, or the worker has not worked at the site for {SITE_ORIENTATION_GAP_MONTHS}+ month(s).
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {!locationId ? <th className="px-4 py-3">Location</th> : null}
              {!workerId ? <th className="px-4 py-3">Worker</th> : null}
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Oriented</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Acknowledged by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const loc = locations.find((l) => l.id === row.locationId);
              return (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  {!locationId ? (
                    <td className="px-4 py-3">
                      {loc ? (
                        <Link
                          href={`/locations/${loc.id}?tab=${encodeURIComponent("Site orientation")}`}
                          className="text-[#b51266] hover:underline"
                        >
                          {loc.name}
                        </Link>
                      ) : (
                        row.locationId
                      )}
                    </td>
                  ) : null}
                  {!workerId ? (
                    <td className="px-4 py-3">
                      {row.workerType === "agency" ? (
                        <Link href={`/agency-workers/${row.workerId}`} className="text-[#b51266] hover:underline">
                          {workerLabel(row, agencyWorkers, employees)}
                        </Link>
                      ) : (
                        <Link href={`/employees/${row.workerId}`} className="text-[#b51266] hover:underline">
                          {workerLabel(row, agencyWorkers, employees)}
                        </Link>
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 capitalize text-slate-600">{row.workerType}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.orientedAt}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.expiresAt || "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{row.acknowledgedBy || "—"}</td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td
                  colSpan={(locationId ? 0 : 1) + (workerId ? 0 : 1) + 4}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No site orientations on file yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!readOnly ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <h4 className="text-sm font-semibold text-slate-900">Record site orientation</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {!workerId ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Worker type</span>
                  <select
                    className={baseInput}
                    value={formWorkerType}
                    onChange={(e) => {
                      setFormWorkerType(e.target.value as SiteOrientationWorkerType);
                      setFormWorkerId("");
                    }}
                  >
                    <option value="agency">Agency worker</option>
                    <option value="employee">Employee</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Worker</span>
                  <select
                    className={baseInput}
                    value={formWorkerId}
                    onChange={(e) => setFormWorkerId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {(formWorkerType === "agency" ? agencyWorkers : employees).map((w) => (
                      <option key={w.id} value={w.id}>
                        {"name" in w && w.name ? w.name : w.searchKey}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            {!locationId ? (
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Location</span>
                <select
                  className={baseInput}
                  value={formLocationId}
                  onChange={(e) => setFormLocationId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Orientation date</span>
              <input
                type="date"
                className={baseInput}
                value={orientedAt}
                onChange={(e) => setOrientedAt(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Acknowledged by</span>
              <input
                className={baseInput}
                value={acknowledgedBy}
                onChange={(e) => setAcknowledgedBy(e.target.value)}
                placeholder="Coordinator or site lead"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">Notes</span>
              <textarea
                className={`${baseInput} min-h-[72px] resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fire exits, client routines, risks…"
              />
            </label>
          </div>
          {previewCheck && !previewCheck.ok ? (
            <p className="mt-3 text-sm text-amber-800">Before save (shift gate): {previewCheck.message}</p>
          ) : null}
          {formError ? <p className="mt-3 text-sm text-red-700">{formError}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Save orientation
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
