"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OrgChart, OrgPositionEditor } from "@/components/workforce/org-chart";
import { WorkforcePlanningSubnav } from "@/components/workforce/workforce-planning-subnav";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { ORG_BUSINESS_AREAS } from "@/lib/org-structure";
import type { OrgChartFilters } from "@/lib/org-structure-tree";
import { useOrgStructure } from "@/lib/org-structure-store";

export function OrganisationStructurePage() {
  const { canWindow } = useAuth();
  const { locations } = useData();
  const { hydrated } = useOrgStructure();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [businessArea, setBusinessArea] = useState("");
  const [locationId, setLocationId] = useState("");

  const filters = useMemo<OrgChartFilters>(
    () => ({
      businessArea: businessArea || undefined,
      locationId: locationId || undefined,
    }),
    [businessArea, locationId]
  );

  const filterActive = Boolean(businessArea || locationId);

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
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-xs font-medium text-slate-700">
              Business area
              <select
                value={businessArea}
                onChange={(e) => setBusinessArea(e.target.value)}
                className="mt-1 block min-w-[10rem] rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">All areas</option>
                {ORG_BUSINESS_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Location
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="mt-1 block min-w-[12rem] rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            {filterActive ? (
              <button
                type="button"
                onClick={() => {
                  setBusinessArea("");
                  setLocationId("");
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <OrgChart selectedId={selectedId} onSelect={setSelectedId} filters={filters} />
            <OrgPositionEditor
              positionId={selectedId}
              onClose={() => setSelectedId(null)}
              onCreated={setSelectedId}
              onSelectPosition={setSelectedId}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
