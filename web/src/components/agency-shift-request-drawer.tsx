"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import {
  buildAgencyShiftPack,
  completeAgencyShift,
  confirmAgencyShift,
  proposeAgencyWorker,
  requestAgencyCoverage,
  sendAgencyShiftPack,
} from "@/lib/agency-shift-workflow";
import { openAgencyRequestForShift, type AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import { agencyWorkerDisplayName, agencyWorkersForVendor, isAgencyVendorPartner } from "@/lib/agency-worker";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatDayHeading, formatShiftTimeRange, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
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
  const [agencyWorkerId, setAgencyWorkerId] = useState("");
  const [continuityNotes, setContinuityNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mailtoUrl, setMailtoUrl] = useState<string | undefined>();
  const [historyRefresh, setHistoryRefresh] = useState(0);

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

  const vendorWorkers = useMemo(
    () => (effectiveVendorId ? agencyWorkersForVendor(agencyWorkers, effectiveVendorId) : []),
    [agencyWorkers, effectiveVendorId]
  );

  const canRequest = canProcess("request-agency-coverage");
  const canSend = canProcess("send-agency-shift-pack");
  const canConfirm = canProcess("confirm-agency-shift");
  const canComplete = canProcess("complete-agency-shift");

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

  function handleProposeWorker() {
    if (!activeRequest || !agencyWorkerId) {
      setError("Select an agency worker.");
      return;
    }
    const next = proposeAgencyWorker({ request: activeRequest, agencyWorkerId, actor });
    if (!persistRequest(next)) return;
    setMessage("Agency worker proposed.");
  }

  function handleSendPack() {
    if (!activeRequest || !vendor) {
      setError("Request or vendor missing.");
      return;
    }
    const worker = agencyWorkers.find((w) => w.id === (activeRequest.agencyWorkerId || agencyWorkerId));
    const pack = buildAgencyShiftPack({
      request: activeRequest,
      shift: normalizedShift,
      vendor,
      client,
      location,
      worker,
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
    const workerId = activeRequest.agencyWorkerId || agencyWorkerId;
    const worker = agencyWorkers.find((w) => w.id === workerId);
    if (!worker) {
      setError("Select and propose an agency worker before confirming.");
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
      return;
    }
    if (!persistRequest(result.result.request)) return;
    const shiftErr = upsertRosterShift(result.result.shift);
    if (shiftErr) {
      setError(shiftErr);
      return;
    }
    if (result.result.orientation.severity === "warning") {
      setMessage(`Confirmed with warning: ${result.result.orientation.message}`);
    } else {
      setMessage("Agency worker confirmed on shift.");
    }
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
                <h3 className="text-sm font-semibold text-slate-800">2. Propose agency worker</h3>
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
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Agency worker
                  </span>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={agencyWorkerId || activeRequest.agencyWorkerId}
                    onChange={(e) => setAgencyWorkerId(e.target.value)}
                    disabled={!canConfirm && !canSend}
                  >
                    <option value="">Select worker…</option>
                    {vendorWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {agencyWorkerDisplayName(w)}
                      </option>
                    ))}
                  </select>
                </label>
                <Link href="/agency-workers/new" className="text-xs text-[#b51266] hover:underline">
                  Register new agency worker
                </Link>
                {canConfirm ? (
                  <button
                    type="button"
                    onClick={handleProposeWorker}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Propose worker
                  </button>
                ) : null}
              </section>

              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">3. Send shift pack</h3>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Continuity notes
                  </span>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    rows={2}
                    value={continuityNotes}
                    onChange={(e) => setContinuityNotes(e.target.value)}
                  />
                </label>
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
                <h3 className="text-sm font-semibold text-slate-800">4. Confirm and complete</h3>
                <p className="text-sm text-slate-600">
                  Site orientation is checked before confirmation. Workers without current orientation cannot be
                  confirmed.
                </p>
                <div className="flex flex-wrap gap-2">
                  {canConfirm ? (
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
