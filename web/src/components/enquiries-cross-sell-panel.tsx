"use client";

import { useMemo } from "react";
import Link from "next/link";
import { buildClientCrossSellOpportunities } from "@/lib/client-cross-sell";
import type { ClientRecord } from "@/lib/client";
import { ClientRecordLink } from "@/components/record-link";

function alertClass(severity: "warning" | "danger"): string {
  return severity === "danger"
    ? "border-rose-200 bg-rose-50 text-rose-950"
    : "border-amber-200 bg-amber-50 text-amber-950";
}

export function EnquiriesCrossSellPanel({ clients }: { clients: ClientRecord[] }) {
  const opportunities = useMemo(() => buildClientCrossSellOpportunities(clients), [clients]);

  if (!opportunities.length) {
    return null;
  }

  const preview = opportunities.slice(0, 5);

  return (
    <section className="mb-6 rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Cross-sell opportunities</h2>
          <p className="mt-1 text-sm text-slate-600">
            Active clients with underserviced funding or plan review signals — follow up while triaging
            enquiries.
          </p>
        </div>
        <Link
          href="/clients?lifecycle=active"
          className="text-sm font-medium text-[#b51266] hover:underline"
        >
          View all clients
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {preview.map((item) => (
          <li
            key={item.clientId}
            className={`rounded-lg border px-3 py-2 text-sm ${alertClass(
              item.primaryAlert.severity === "danger" ? "danger" : "warning"
            )}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ClientRecordLink
                id={item.clientId}
                searchKey={item.searchKey}
                name={item.clientName}
                className="font-medium hover:underline"
              />
              <span className="text-xs uppercase tracking-wide opacity-80">
                {item.primaryAlert.severity}
              </span>
            </div>
            <p className="mt-1">{item.primaryAlert.message}</p>
          </li>
        ))}
      </ul>
      {opportunities.length > preview.length ? (
        <p className="mt-3 text-xs text-slate-500">
          +{opportunities.length - preview.length} more active client
          {opportunities.length - preview.length === 1 ? "" : "s"} with cross-sell signals
        </p>
      ) : null}
    </section>
  );
}
