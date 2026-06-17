"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OrgChart, OrgPositionEditor } from "@/components/workforce/org-chart";
import { WorkforcePlanningSubnav } from "@/components/workforce/workforce-planning-subnav";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { ORG_BUSINESS_AREAS } from "@/lib/org-structure";
import {
  applyOrgChartLens,
  filterOrgPositions,
  isEmployeeOnLeaveToday,
  orgChartFilterStats,
  type OrgChartFilters,
  type OrgChartLens,
} from "@/lib/org-structure-tree";
import { useOrgStructure } from "@/lib/org-structure-store";
import { countHolderMisalignments } from "@/lib/org-position-role-alignment";

export function OrganisationStructurePage() {
  const { canWindow, users, roles } = useAuth();
  const { employees, locations } = useData();
  const { hydrated, positions, assignments } = useOrgStructure();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [businessArea, setBusinessArea] = useState("");
  const [locationId, setLocationId] = useState("");
  const [chartLens, setChartLens] = useState<OrgChartLens>("accountability");

  const filters = useMemo<OrgChartFilters>(
    () => ({
      businessArea: businessArea || undefined,
      locationId: locationId || undefined,
    }),
    [businessArea, locationId]
  );

  const filterActive = Boolean(businessArea || locationId);

  const filterSummary = useMemo(() => {
    const lensPositions = applyOrgChartLens(positions, chartLens);
    const stats = orgChartFilterStats(lensPositions, filters);
    if (!filterActive && chartLens === "accountability") return null;
    const filtered = filterOrgPositions(lensPositions, filters);
    const empById = new Map(employees.map((e) => [e.id, e]));
    let onLeave = 0;
    for (const p of filtered) {
      if (!p.primaryEmployeeId) continue;
      const emp = empById.get(p.primaryEmployeeId);
      if (emp && isEmployeeOnLeaveToday(emp)) onLeave += 1;
    }
    return { ...stats, onLeave };
  }, [positions, filters, filterActive, employees, chartLens]);

  const canView = canWindow("workforce-organisation") || canWindow("workforce-planning");
  const canEdit = canWindow("workforce-org-edit");

  const roleMisalignmentCount = useMemo(
    () => countHolderMisalignments(positions, assignments, users, roles),
    [positions, assignments, users, roles]
  );

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
      subtitle="Position tree, holders, vacant-role escalation, and accountable manager routing."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Workforce planning", href: "/workforce-planning" },
        { label: "Organisation structure" },
      ]}
      audit={{ moduleLabel: "Organisation structure" }}
    >
      <WorkforcePlanningSubnav />
      <p className="mb-4 text-sm text-slate-600">
        <Link href="/help/workforce-organisation" className="font-medium text-[#b51266] hover:underline">
          Read the full organisation structure and automations guide
        </Link>
      </p>

      {!hydrated ? (
        <p className="text-sm text-slate-500">Loading organisation structure…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-xs font-medium text-slate-700">
              Chart view
              <select
                value={chartLens}
                onChange={(e) => setChartLens(e.target.value as OrgChartLens)}
                className="mt-1 block min-w-[12rem] rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="accountability">Accountability tree</option>
                <option value="executive_council">Executive council</option>
                <option value="functional">Functional delivery</option>
              </select>
            </label>
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
            {filterSummary ? (
              <p className="text-xs text-slate-500">
                Showing {filterSummary.visible} of {filterSummary.total} positions
                {chartLens !== "accountability" ? ` · ${chartLens.replace("_", " ")} view` : ""}
                {filterSummary.onLeave ? ` · ${filterSummary.onLeave} primary holder(s) on leave` : ""}
              </p>
            ) : null}
            {canEdit && roleMisalignmentCount > 0 ? (
              <p className="text-xs font-medium text-amber-800">
                {roleMisalignmentCount} holder{roleMisalignmentCount === 1 ? "" : "s"} with login role mismatch — check cards marked on the chart.
              </p>
            ) : null}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <OrgChart selectedId={selectedId} onSelect={setSelectedId} filters={filters} lens={chartLens} />
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
