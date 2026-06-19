"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentList } from "@/components/incident-list";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";

function IncidentListFallback() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading incidents…</div>
  );
}

export default function IncidentsPage() {
  const { incidents } = useData();
  const { canWriteWindow } = useAuth();
  const canCreateIncident = canWriteWindow("incidents");

  return (
    <AppShell
      title="Incident reports"
      subtitle="Track incidents, investigations, and NDIS reportable notifications with an audit-ready record."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Incident reports" }]}
      audit={{ moduleLabel: "Incident reports" }}
      actions={
        <>
          <Link
            href="/incidents/compliance"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-100"
          >
            NDIS compliance
          </Link>
          {canCreateIncident ? (
            <Link
              href="/incidents/new"
              className="inline-flex items-center rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#b51266]"
            >
              Report incident
            </Link>
          ) : null}
        </>
      }
    >
      <Suspense fallback={<IncidentListFallback />}>
        <IncidentList records={incidents} />
      </Suspense>
    </AppShell>
  );
}
