"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentList } from "@/components/incident-list";
import { useData } from "@/lib/data-store";

function IncidentListFallback() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading incidents…</div>
  );
}

export default function IncidentsPage() {
  const { incidents } = useData();

  return (
    <AppShell
      title="Incident reports"
      subtitle="Track incidents, investigations, and NDIS reportable notifications with an audit-ready record."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Incident reports" }]}
      audit={{ moduleLabel: "Incident reports" }}
      actions={
        <Link
          href="/incidents/new"
          className="inline-flex items-center rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#b51266]"
        >
          Report incident
        </Link>
      }
    >
      <Suspense fallback={<IncidentListFallback />}>
        <IncidentList records={incidents} />
      </Suspense>
    </AppShell>
  );
}
