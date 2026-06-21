"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/enquiry";
import {
  portalServiceRequestStatusLabel,
  portalServiceRequestStatusStyles,
  type PortalServiceRequestRecord,
} from "@/lib/portal/service-request";

export function ClientPortalRequestsPanel({ clientId }: { clientId: string }) {
  const [requests, setRequests] = useState<PortalServiceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(`/api/service-requests?clientId=${encodeURIComponent(clientId)}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Could not load portal requests.");
        }
        const data = (await res.json()) as { requests: PortalServiceRequestRecord[] };
        setRequests(data.requests ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load portal requests.");
        setRequests([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [clientId]);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Participant portal requests</h3>
        <p className="text-sm text-slate-500">
          Service requests submitted from the participant portal — open the linked review task to approve or decline.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading portal requests…</p>
      ) : error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : requests.length ? (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {requests.map((request) => (
            <div key={request.id} className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{request.serviceCategory}</p>
                  <p className="text-sm text-slate-600">
                    {request.supportBudget}
                    {request.preferredSchedule ? ` · ${request.preferredSchedule}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${portalServiceRequestStatusStyles(request.status)}`}
                >
                  {portalServiceRequestStatusLabel(request.status)}
                </span>
              </div>
              {request.description ? (
                <p className="text-sm text-slate-600 line-clamp-2">{request.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Submitted {formatDisplayDate(request.createdAt.slice(0, 10))}</span>
                {request.taskId ? (
                  <Link href={`/tasks/${request.taskId}`} className="font-medium text-[#b51266] hover:underline">
                    Open review task
                  </Link>
                ) : null}
                {request.variationAgreementId ? (
                  <Link
                    href={`/service-agreements/${request.variationAgreementId}`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    View variation draft
                  </Link>
                ) : null}
              </div>
              {request.status === "Declined" && request.declineReason ? (
                <p className="rounded-lg border border-rose-100 bg-rose-50/80 px-3 py-2 text-sm text-rose-950">
                  Decline reason: {request.declineReason}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          No participant portal service requests for this client yet.
        </p>
      )}
    </section>
  );
}
