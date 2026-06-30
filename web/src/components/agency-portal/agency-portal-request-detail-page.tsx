"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AgencyPortalGuard,
  AgencyPortalLogoutButton,
} from "@/components/agency-portal/agency-portal-hub-page";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";
import { formatDayHeading, formatShiftTimeRange } from "@/lib/roster-shift";
import type { AgencyPortalRequestItem } from "@/lib/agency-portal/types";
import { ClientDetailSkeleton } from "@/components/ui/page-skeletons";

export function AgencyPortalRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = String(params.id ?? "");

  const [request, setRequest] = useState<AgencyPortalRequestItem | null>(null);
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([]);
  const [agencyWorkerId, setAgencyWorkerId] = useState("");
  const [continuityNotes, setContinuityNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    fetch(`/api/agency-portal/requests/${requestId}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const data = (await res.json()) as {
          request: AgencyPortalRequestItem;
          workers: { id: string; name: string }[];
        };
        setRequest(data.request);
        setWorkers(data.workers);
        setContinuityNotes(data.request.continuityNotes ?? "");
        if (data.request.agencyWorkerId) setAgencyWorkerId(data.request.agencyWorkerId);
      })
      .catch(() => setError("Shift request not found."))
      .finally(() => setLoading(false));
  }, [requestId]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!request?.canConfirm) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/agency-portal/requests/${requestId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyWorkerId, continuityNotes }),
      });
      const data = (await res.json()) as { request?: AgencyPortalRequestItem; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not confirm coverage.");
        return;
      }
      if (data.request) setRequest(data.request);
      setMessage("Coverage confirmed. The provider will review and confirm on roster.");
      router.refresh();
    } catch {
      setError("Could not confirm coverage.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AgencyPortalGuard>
      {() => (
        <AgencyPortalShell
          title={request?.documentNo ?? "Shift request"}
          subtitle="Propose who will cover this shift"
          actions={<AgencyPortalLogoutButton />}
        >
          <AgencyPortalNav active="requests" />

          <p className="mb-4 text-sm">
            <Link href="/agency-portal/requests" className="text-sky-700 hover:underline">
              ← All shift requests
            </Link>
          </p>

          {loading ? (
            <ClientDetailSkeleton />
          ) : error && !request ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : request ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600">
                  {request.clientLabel} · {request.locationName}
                </p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {formatDayHeading(request.shiftDate)}{" "}
                  {formatShiftTimeRange(request.startTime, request.endTime)}
                </p>
                <p className="mt-1 text-sm text-slate-500">Ref {request.shiftRef}</p>
                {request.skillsRequired ? (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Skills: </span>
                    {request.skillsRequired}
                  </p>
                ) : null}
                <p className="mt-3 text-sm">
                  <span className="font-medium text-slate-800">Status: </span>
                  {request.status}
                </p>
              </div>

              {request.canConfirm ? (
                <form onSubmit={handleConfirm} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-800">Confirm coverage</h2>
                  <p className="text-sm text-slate-600">
                    Select the agency worker who will attend. The provider confirms on roster after site orientation
                    checks.
                  </p>
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Agency worker
                    </span>
                    <select
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                      value={agencyWorkerId}
                      onChange={(e) => setAgencyWorkerId(e.target.value)}
                    >
                      <option value="">Select worker…</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Continuity notes
                    </span>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                      rows={3}
                      value={continuityNotes}
                      onChange={(e) => setContinuityNotes(e.target.value)}
                      placeholder="Any handover or continuity information for the provider"
                    />
                  </label>
                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                  {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Confirm coverage"}
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  {request.status === "Sent"
                    ? "This request cannot be confirmed."
                    : request.agencyWorkerName
                      ? `Worker proposed: ${request.agencyWorkerName}. Waiting for provider confirmation on roster.`
                      : "Waiting for provider next steps."}
                </div>
              )}
            </div>
          ) : null}
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
