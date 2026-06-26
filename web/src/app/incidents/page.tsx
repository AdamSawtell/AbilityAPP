"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentList } from "@/components/incident-list";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { canSeeAllIncidents, visibleIncidentsForSession } from "@/lib/incident-list-access";

function IncidentListFallback() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading incidents…</div>
  );
}

export default function IncidentsPage() {
  const { incidents } = useData();
  const { canWriteWindow, canWindow, session } = useAuth();
  const canCreateIncident = canWriteWindow("incidents");
  const seeAll = canSeeAllIncidents(canWindow);

  const visibleIncidents = useMemo(() => {
    if (!session) return [];
    return visibleIncidentsForSession(incidents, session, seeAll);
  }, [incidents, session, seeAll]);

  return (
    <AppShell
      title="Incidents"
      subtitle={
        seeAll
          ? "Track incidents, investigations, and NDIS reportable notifications with an audit-ready record."
          : "Submit new incidents here and follow up on your open reports."
      }
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Incidents" }]}
      audit={{ moduleLabel: "Incidents" }}
    >
      <Suspense fallback={<IncidentListFallback />}>
        <IncidentList
          records={visibleIncidents}
          seeAll={seeAll}
          canCreate={canCreateIncident}
          submitHref="/incidents/new"
        />
      </Suspense>
    </AppShell>
  );
}
