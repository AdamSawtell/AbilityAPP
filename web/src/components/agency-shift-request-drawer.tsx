"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { SiteOrientationPanel } from "@/components/site-orientation-panel";
import {
  buildAgencyShiftPack,
  completeAgencyShift,
  confirmAgencyShift,
  lastAgencyWorkedAtLocation,
  requestAgencyCoverage,
  sendAgencyShiftPack,
} from "@/lib/agency-shift-workflow";
import { openAgencyRequestForShift, type AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import { agencyWorkerDisplayName, isAgencyVendorPartner } from "@/lib/agency-worker";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatDayHeading, formatShiftTimeRange, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { checkSiteOrientation } from "@/lib/site-orientation";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { auditDocumentProcess } from "@/lib/document-print-audit";

export function AgencyShiftRequestDrawer({
  shift,
  onClose,
  actor = "SuperUser",
}: {
  shift: RosterShiftRecord;
  onClose: () => void;
  actor?: string;
}) {
  const {
    businessPartners,
    agencyWorkers,
    agencyShiftRequests,
    siteOrientations,
    rosterShifts,
    clients,
    locations,
    upsertAgencyShiftRequest,
    upsertRosterShift,
  } = useData();
  const { canProcess } = useAuth();

  const normalizedShift = normalizeRosterShift(shift);
  const [vendorBpId, setVendorBpId] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mailtoUrl, setMailtoUrl] = useState<string | undefined>();
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [showOrientationForm, setShowOrientationForm] = useState(false);

  const vendors = useMemo(
    () => businessPartners.filter((p) => isAgencyVendorPartner(p.partnerType) && p.status === "Active"),
    [businessPartners]
  );

  const request = useMemo(
    () => openAgencyRequestForShift(agencyShiftRequests, normalizedShift.id),
    [agencyShiftRequests, normalizedShift.id]
  );

  const activeRequest = request;
  const effectiveVendorId = activeRequest?.vendorBpId || vendorBpId;
  const vendor = businessPartners.find((p) => p.id === effectiveVendorId);
  const client = clients.find((c) => c.id === normalizedShift.clientId);
  const location = locations.find((l) => l.id === normalizedShift.locationId);

  const canRequest = canProcess("request-agency-coverage");
  const canSend = canProcess("send-agency-shift-pack");
  const canConfirm = canProcess("confirm-agency-shift");
  const canComplete = canProcess("complete-agency-shift");

  const proposedWorker = activeRequest?.agencyWorkerId
    ? agencyWorkers.find((w) => w.id === activeRequest.agencyWorkerId)
    : undefined;

  const orientationPreview = useMemo(() => {
    if (!proposedWorker || !normalizedShift.locationId?.trim()) return null;
    const lastWorked = lastAgencyWorkedAtLocation(
      rosterShifts,
      proposedWorker.id,
      normalizedShift.locationId,
      normalizedShift.shiftDate
    );
    return {
      check: checkSiteOrientation(
        siteOrientations,
        "agency",
        proposedWorker.id,
        normalizedShift.locationId,
        normalizedShift.shiftDate,
        lastWorked
      ),
      lastWorked,
    };
  }, [
    proposedWorker,
    normalizedShift.locationId,
    normalizedShift.shiftDate,
    rosterShifts,
    siteOrientations,
  ]);

  function persistRequest(next: AgencyShiftRequestRecord) {
    const err = upsertAgencyShiftRequest(next);
    if (err) {
      setError(err);
      return false;
    }
    setError(null);
    return true;
  }

  function handleCreateRequest() {
    if (!vendorBpId) {
      setError("Select an agency vendor.");
      return;
    }
    const created = requestAgencyCoverage({
      shift: normalizedShift,
      vendorBpId,
      skillsRequired,
      actor,
      existingRequests: agencyShiftRequests,
    });
    if (!persistRequest(created)) return;
    setMessage(`Agency request ${created.documentNo} created.`);
  }

  function handleSendPack() {
    if (!activeRequest || !vendor) {
      setError("Request or vendor missing.");
      return;
    }
    const pack = buildAgencyShiftPack({
      request: activeRequest,
      shift: normalizedShift,
      vendor,
      client,
      location,
      worker: proposedWorker,
    });
    const next = sendAgencyShiftPack({ request: activeRequest, actor });
    if (!persistRequest(next)) return;
    setMailtoUrl(pack.mailtoUrl);
    setMessage("Shift pack ready — open the email draft to send to the agency.");
    void auditDocumentProcess({
      processId: DOCUMENT_PRINT_PROCESSES.sendAgencyShiftPack,
      entityType: "agency-shift-request",
      entityId: activeRequest.id,
      entityLabel: activeRequest.documentNo,
      detail: "Agency shift pack email draft",
    });
    setHistoryRefresh((n) => n + 1);
  }

  function handleConfirm() {
    if (!activeRequest) return;
    const worker = proposedWorker;
    if (!worker) {
      setError("The agency vendor must propose a worker in the agency portal before you can confirm.");
      return;
    }
    const result = confirmAgencyShift({
      request: activeRequest,
      shift: normalizedShift,
      agencyWorker: worker,
      orientations: siteOrientations,
      allShifts: rosterShifts,
      actor,
      blockOnOrientation: true,
    });
    if (!result.ok || !result.result) {
      setError(result.error ?? "Could not confirm agency shift.");
      if (orientationPreview && !orientationPreview.check.ok) {
        setShowOrientationForm(true);
      }
      return;
    }
    if (!persistRequest(result.result.request)) return;
    const shiftErr = upsertRosterShift(result.result.shift);
    if (shiftErr) {
      setError(shiftErr);
      return;
    }
    setMessage("Agency worker confirmed on shift.");
    setShowOrientationForm(false);
    setError(null);
  }

  function handleComplete() {
    if (!activeRequest) return;
    const { request: nextRequest, shift: nextShift } = completeAgencyShift({
      request: activeRequest,
      shift: normalizedShift,
      actor,
    });
    if (!persistRequest(nextRequest)) return;
    const shiftErr = upsertRosterShift(nextShift);
    if (shiftErr) {
      setError(shiftErr);
      return;
    }
    setMessage("Agency shift marked completed.");
    setError(null);
  }

  const status = activeRequest?.status ?? "Not started";
  const awaitingPortal = status === "Sent" && !activeRequest?.agencyWorkerId?.trim();
  const workerProposed =
    status === "Worker proposed" || (status === "Sent" && Boolean(activeRequest?.agencyWorkerId?.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agency coverage</p>
            <h2 className="text-lg font-semibold text-slate-900">
              {client?.name ?? "Shift"} · {formatDayHeading(normalizedShift.shiftDate)}{" "}
              {formatShiftTimeRange(normalizedShift.startTime, normalizedShift.endTime)}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ref {normalizedShift.shiftRef}
              {location ? ` · ${location.name}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>
          ) : null}
          {message ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800">Status: {status}</span>
            {activeRequest ? (
              <span className="rounded-full bg-fuchsia-100 px-3 py-1 font-medium text-fuchsia-900">
                {activeRequest.documentNo}
              </span>
            ) : null}
            {normalizeRosterShift(normalizedShift).coverageSource === "agency" ? (
              <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-900">Agency staffed</span>
            ) : null}
          </div>

          {!activeRequest && canRequest ? (
            <section className="space-y-3 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800">1. Request agency coverage</h3>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Agency vendor
                </span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={vendorBpId}
                  onChange={(e) => setVendorBpId(e.target.value)}
                >
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Skills required
                </span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={skillsRequired}
                  onChange={(e) => setSkillsRequired(e.target.value)}
                  placeholder="e.g. SIL, manual handling"
                />
              </label>
              <button
                type="button"
                onClick={handleCreateRequest}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                Create agency request
              </button>
            </section>
          ) : null}

          {activeRequest && status !== "Completed" && status !== "Cancelled" ? (
            <>
              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">2. Send shift pack</h3>
                <p className="text-sm text-slate-600">
                  Vendor:{" "}
                  {vendor ? (
                    <Link href={`/business-partners/${vendor.id}`} className="text-[#b51266] hover:underline">
                      {vendor.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-sm text-slate-600">
                  Email the shift pack to the agency. The vendor confirms coverage and proposes a worker in the{" "}
                  <Link href="/agency-portal/login" className="text-sky-700 hover:underline">
                    agency portal
                  </Link>
                  .
                </p>
                {canSend ? (
                  <button
                    type="button"
                    onClick={handleSendPack}
                    className="rounded-lg border border-[#d4147a]/30 bg-[#fdf2f8] px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fce7f3]"
                  >
                    Prepare shift pack email
                  </button>
                ) : null}
              </section>

              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">3. Agency portal confirmation</h3>
                {awaitingPortal ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    Waiting for {vendor?.name ?? "the agency"} to confirm in the agency portal after receiving the shift
                    pack email.
                  </p>
                ) : workerProposed && proposedWorker ? (
                  <div className="space-y-2 text-sm text-slate-700">
                    <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sky-950">
                      Worker proposed: <strong>{agencyWorkerDisplayName(proposedWorker)}</strong>
                      {activeRequest.vendorConfirmedAt
                        ? ` · confirmed ${new Date(activeRequest.vendorConfirmedAt).toLocaleString()}`
                        : ""}
                    </p>
                    {activeRequest.continuityNotes ? (
                      <p>
                        <span className="font-medium text-slate-800">Continuity notes: </span>
                        {activeRequest.continuityNotes}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No portal confirmation yet.</p>
                )}
              </section>

              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">4. Confirm and complete</h3>
                <p className="text-sm text-slate-600">
                  Site orientation is checked before confirmation. Workers without current orientation cannot be
                  confirmed — record orientation below when blocked.
                </p>
                {orientationPreview && proposedWorker ? (
                  <p
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      orientationPreview.check.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-950"
                    }`}
                  >
                    {orientationPreview.check.message}
                  </p>
                ) : null}
                {(!orientationPreview?.check.ok && proposedWorker) || showOrientationForm ? (
                  <SiteOrientationPanel
                    defaultWorkerType="agency"
                    defaultWorkerId={proposedWorker?.id ?? ""}
                    defaultLocationId={normalizedShift.locationId}
                    shiftDate={normalizedShift.shiftDate}
                    lastWorkedAtLocation={orientationPreview?.lastWorked}
                    actor={actor}
                  />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {canConfirm && workerProposed ? (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
                    >
                      Confirm agency worker
                    </button>
                  ) : null}
                  {canComplete && status === "Confirmed" ? (
                    <button
                      type="button"
                      onClick={handleComplete}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Mark shift completed
                    </button>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}

          {activeRequest ? (
            <RecordDocumentsSection
              entityType="agency-shift-request"
              entityId={activeRequest.id}
              refreshKey={historyRefresh}
              error={error ?? undefined}
              message={message ?? undefined}
              mailtoUrl={mailtoUrl}
              mailtoReady={Boolean(mailtoUrl)}
              actions={
                canSend
                  ? [
                      {
                        processId: DOCUMENT_PRINT_PROCESSES.sendAgencyShiftPack,
                        label: "Send via Email",
                        onClick: handleSendPack,
                        variant: "primary" as const,
                      },
                    ]
                  : []
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
