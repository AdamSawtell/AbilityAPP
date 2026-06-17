"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OrgChart, OrgPositionEditor } from "@/components/workforce/org-chart";
import { WorkforcePlanningSubnav } from "@/components/workforce/workforce-planning-subnav";
import { useAuth } from "@/lib/auth-store";
import { useOrgStructure } from "@/lib/org-structure-store";

export function OrganisationStructurePage() {
  const { canWindow } = useAuth();
  const { hydrated } = useOrgStructure();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canView = canWindow("workforce-organisation") || canWindow("workforce-planning");

  if (!canView) {
    return (
      <AppShell
        title="Organisation structure"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Workforce planning", href: "/workforce-planning" },
          { label: "Organisation structure" },
        ]}
        audit={{ moduleLabel: "Organisation structure" }}
      >
        <p className="text-sm text-slate-600">You do not have access to view the organisation structure.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Organisation structure"
      subtitle="Position tree, holders, and vacant-role escalation to parent managers."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Workforce planning", href: "/workforce-planning" },
        { label: "Organisation structure" },
      ]}
      audit={{ moduleLabel: "Organisation structure" }}
    >
      <WorkforcePlanningSubnav />

      {!hydrated ? (
        <p className="text-sm text-slate-500">Loading organisation structure…</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <OrgChart selectedId={selectedId} onSelect={setSelectedId} />
          <OrgPositionEditor
            positionId={selectedId}
            onClose={() => setSelectedId(null)}
            onCreated={setSelectedId}
          />
        </div>
      )}
    </AppShell>
  );
}
