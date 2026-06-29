"use client";

import { useCallback, useEffect, useState } from "react";

type PendingRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  weeklyHours: number;
  maxWeeklyHours: number;
  status: string;
  requestedAt: string;
};

export function WorkforceAvailabilityOverMaxPanel() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workforce/availability-over-max", { credentials: "include" });
      if (res.status === 403) {
        setRequests([]);
        return;
      }
      if (!res.ok) throw new Error("Could not load over-maximum availability requests.");
      const data = (await res.json()) as { requests?: PendingRequest[] };
      setRequests(data.requests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(requestId: string, decision: "approved" | "declined") {
    setBusyId(requestId);
    setError("");
    try {
      const res = await fetch("/api/workforce/availability-over-max", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Review failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return null;
  if (!requests.length && !error) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Availability above maximum</h2>
      <p className="mt-1 text-sm text-slate-600">
        Staff who submitted weekly availability above the organisation maximum are waiting for approval.
      </p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-4 space-y-3">
        {requests.map((request) => (
          <li key={request.id} className="rounded-xl border border-amber-100 bg-white px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{request.employeeName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {request.weeklyHours}h/week submitted — organisation maximum {request.maxWeeklyHours}h/week
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === request.id}
                  onClick={() => void review(request.id, "approved")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === request.id}
                  onClick={() => void review(request.id, "declined")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
