"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AgencyPortalGuard,
  AgencyPortalLogoutButton,
} from "@/components/agency-portal/agency-portal-hub-page";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";
import { formatDayHeading, formatShiftTimeRange } from "@/lib/roster-shift";
import type { AgencyPortalRequestItem } from "@/lib/agency-portal/types";
import { SkeletonTable } from "@/components/ui/skeleton";

const statusTone: Record<string, string> = {
  Sent: "bg-amber-100 text-amber-900",
  "Worker proposed": "bg-sky-100 text-sky-900",
  Confirmed: "bg-emerald-100 text-emerald-800",
  Completed: "bg-slate-100 text-slate-700",
};

export function AgencyPortalRequestsPage() {
  const [requests, setRequests] = useState<AgencyPortalRequestItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agency-portal/requests", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load requests");
        const data = (await res.json()) as { requests: AgencyPortalRequestItem[] };
        setRequests(data.requests);
      })
      .catch(() => setError("Could not load shift requests."));
  }, []);

  return (
    <AgencyPortalGuard>
      {(session) => (
        <AgencyPortalShell
          title="Shift requests"
          subtitle="Confirm coverage after receiving a shift pack email from the provider"
          actions={<AgencyPortalLogoutButton />}
        >
          <AgencyPortalNav active="requests" />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {!requests ? (
            <SkeletonTable rows={4} columns={4} />
          ) : requests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
              No shift requests yet. Your provider will email a shift pack when coverage is needed.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/agency-portal/requests/${request.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{request.documentNo}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {request.clientLabel} · {request.locationName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatDayHeading(request.shiftDate)}{" "}
                        {formatShiftTimeRange(request.startTime, request.endTime)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[request.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {request.agencyWorkerName ? (
                    <p className="mt-2 text-sm text-slate-600">Worker: {request.agencyWorkerName}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
