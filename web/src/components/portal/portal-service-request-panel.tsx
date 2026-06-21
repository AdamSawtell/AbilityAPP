"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parsePortalServiceRequestId, type PortalServiceRequestRecord } from "@/lib/portal/service-request";
import type { TaskRecord } from "@/lib/task";

export function PortalServiceRequestPanel({ task, canManage }: { task: TaskRecord; canManage: boolean }) {
  const router = useRouter();
  const requestId = parsePortalServiceRequestId(task.automationDedupeKey ?? "");
  const [request, setRequest] = useState<PortalServiceRequestRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(requestId));
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    if (!requestId) return;
    fetch(`/api/service-requests/${encodeURIComponent(requestId)}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { request: PortalServiceRequestRecord };
        setRequest(data.request);
      })
      .finally(() => setLoading(false));
  }, [requestId]);

  if (!requestId) return null;

  async function approve() {
    if (!requestId) return;
    setActing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/service-requests/${encodeURIComponent(requestId)}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        request?: PortalServiceRequestRecord;
        variation?: { id: string; searchKey: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Could not approve request.");
        return;
      }
      setRequest(data.request ?? null);
      setMessage(
        data.variation
          ? `Draft agreement variation ${data.variation.searchKey} created. Open Service agreements on the client record to finish it.`
          : "Request approved."
      );
      router.refresh();
    } catch {
      setError("Could not approve request.");
    } finally {
      setActing(false);
    }
  }

  async function decline() {
    if (!requestId) return;
    setActing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/service-requests/${encodeURIComponent(requestId)}/decline`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: declineReason }),
      });
      const data = (await res.json()) as { error?: string; request?: PortalServiceRequestRecord };
      if (!res.ok) {
        setError(data.error ?? "Could not decline request.");
        return;
      }
      setRequest(data.request ?? null);
      setMessage("Request declined. The participant will see the outcome on the portal.");
      router.refresh();
    } catch {
      setError("Could not decline request.");
    } finally {
      setActing(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#f9a8d4]/40 bg-[#fdf2f8]/50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Participant portal service request</h3>
      <p className="mt-1 text-sm text-slate-600">
        Submitted from the participant portal. Approve to create a draft service agreement variation stub.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Loading request…</p>
      ) : request ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Service</dt>
            <dd className="text-slate-800">{request.serviceCategory}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
            <dd className="text-slate-800">{request.status}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Description</dt>
            <dd className="whitespace-pre-wrap text-slate-700">{request.description}</dd>
          </div>
          {request.preferredSchedule ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Preferred schedule</dt>
              <dd className="text-slate-700">{request.preferredSchedule}</dd>
            </div>
          ) : null}
          {request.variationAgreementId ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Variation draft</dt>
              <dd>
                <Link
                  href={`/service-agreements/${request.variationAgreementId}`}
                  className="font-medium text-[#b51266] hover:underline"
                >
                  Open draft agreement variation
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Request details are not available.</p>
      )}

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {canManage && request && request.status !== "Approved" && request.status !== "Declined" ? (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#f9a8d4]/30 pt-4">
          <button
            type="button"
            disabled={acting}
            onClick={() => void approve()}
            className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
          >
            Approve and create variation draft
          </button>
          <label className="min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs text-slate-500">Decline reason (optional)</span>
            <input
              type="text"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Reason shown to participant"
            />
          </label>
          <button
            type="button"
            disabled={acting}
            onClick={() => void decline()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      ) : null}
    </section>
  );
}
