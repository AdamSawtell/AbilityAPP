"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  DashboardCard,
  DonutChart,
  HorizontalBarChart,
  LineTrendChart,
  RankedEntityList,
  SeverityHeatMap,
} from "@/components/incident-dashboard-charts";
import { useData } from "@/lib/data-store";
import { exportDashboardCsv, printDashboardPdf } from "@/lib/incident-dashboard-export";
import {
  buildIncidentDashboardMetrics,
  defaultIncidentDateRange,
  type TrendGranularity,
} from "@/lib/incident-analytics";
import { organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";

const DATE_PRESETS = [
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "ytd", label: "Year to date", days: null as number | null },
  { id: "all", label: "All time", days: -1 },
] as const;

function presetRange(preset: (typeof DATE_PRESETS)[number]["id"]) {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  if (preset === "all") return { from: "", to: "" };
  if (preset === "ytd") return { from: `${today.getFullYear()}-01-01`, to };
  const days = preset === "30d" ? 30 : 90;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: from.toISOString().slice(0, 10), to };
}

export function IncidentDashboardPage() {
  const { incidents, clients, employees, locations, products } = useData();
  const { organization } = useOrganization();
  const [range, setRange] = useState(defaultIncidentDateRange);
  const [granularity, setGranularity] = useState<TrendGranularity>("weekly");
  const [activePreset, setActivePreset] = useState<string>("90d");

  const metrics = useMemo(
    () =>
      buildIncidentDashboardMetrics(
        incidents,
        range,
        granularity,
        { clients, employees, locations, products },
        organization.incidentInvestigationSlaDays
      ),
    [
      incidents,
      range,
      granularity,
      clients,
      employees,
      locations,
      products,
      organization.incidentInvestigationSlaDays,
    ]
  );

  function applyPreset(id: (typeof DATE_PRESETS)[number]["id"]) {
    setActivePreset(id);
    setRange(presetRange(id));
  }

  return (
    <AppShell
      title="Dashboard & analytics"
      subtitle={`Incident volume, trends, and SLA tracking (investigation SLA: ${organization.incidentInvestigationSlaDays} days).`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Incident reports", href: "/incidents" },
        { label: "Dashboard & analytics" },
      ]}
      audit={{ moduleLabel: "Incident dashboard & analytics" }}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportDashboardCsv(metrics, range, organizationDisplayName(organization))}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => printDashboardPdf(metrics, range, organizationDisplayName(organization))}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Print / PDF
          </button>
          <Link
            href="/incidents"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            All incidents
          </Link>
        </div>
      }
    >
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-900">Date range</p>
        <p className="mt-0.5 text-xs text-slate-500">Filters every widget below by incident date (occurred or reported).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activePreset === preset.id ? "bg-[#fdf2f8] text-[#b51266]" : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-600">
            From
            <input
              type="date"
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
              value={range.from}
              onChange={(e) => {
                setActivePreset("custom");
                setRange((r) => ({ ...r, from: e.target.value }));
              }}
            />
          </label>
          <label className="text-xs text-slate-600">
            To
            <input
              type="date"
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
              value={range.to}
              onChange={(e) => {
                setActivePreset("custom");
                setRange((r) => ({ ...r, to: e.target.value }));
              }}
            />
          </label>
          <label className="text-xs text-slate-600">
            Trend granularity
            <select
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as TrendGranularity)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Incidents in range</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{metrics.total}</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-800">Avg. days to close</p>
          <p className="mt-1 text-3xl font-semibold text-violet-950">
            {metrics.avgDaysToClose !== null ? metrics.avgDaysToClose : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-800">Overdue investigations</p>
          <p className="mt-1 text-3xl font-semibold text-rose-950">{metrics.overdue.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-900">Repeat patterns</p>
          <p className="mt-1 text-3xl font-semibold text-amber-950">{metrics.repeats.length}</p>
        </div>
      </div>

      {metrics.overdue.length > 0 ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-900">Overdue investigations alert</p>
          <ul className="mt-2 space-y-1 text-sm text-rose-900">
            {metrics.overdue.slice(0, 6).map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="font-medium hover:underline">
                  {row.documentNo}
                </Link>
                {" — "}
                {row.title}
                <span className="text-rose-700"> · {row.reason}</span>
              </li>
            ))}
          </ul>
          {metrics.overdue.length > 6 ? (
            <p className="mt-2 text-xs text-rose-800">+ {metrics.overdue.length - 6} more</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="By status" description="Open · In progress · Closed">
          <HorizontalBarChart rows={metrics.byStatus} />
        </DashboardCard>

        <DashboardCard title="By type (category)" description="Distribution of incident categories">
          <DonutChart rows={metrics.byCategory} />
        </DashboardCard>

        <DashboardCard title="By severity" description="Count per severity level">
          <HorizontalBarChart rows={metrics.bySeverity} />
        </DashboardCard>

        <DashboardCard title="Severity heat map" description="Category × severity intensity">
          <SeverityHeatMap
            categories={metrics.heatMap.categories}
            severities={metrics.heatMap.severities}
            matrix={metrics.heatMap.matrix}
          />
        </DashboardCard>

        <DashboardCard
          title="Trend over time"
          description={`New incidents per ${granularity === "daily" ? "day" : granularity === "weekly" ? "week" : "month"}`}
          >
          <LineTrendChart points={metrics.trend} />
        </DashboardCard>

        <DashboardCard
          title="By service type"
          description="Service line recorded on each incident (Admin → Organisation to set investigation SLA)"
        >
          <DonutChart rows={metrics.perServiceType} emptyLabel="No location-linked services in range" />
        </DashboardCard>

        <DashboardCard title="Rate per client" description="Incidents linked to each support receiver">
          <RankedEntityList rows={metrics.perClient} />
        </DashboardCard>

        <DashboardCard title="Rate per staff member" description="Incidents linked to each employee">
          <RankedEntityList rows={metrics.perEmployee} />
        </DashboardCard>

        <DashboardCard title="Rate per location" description="Incidents with this primary location">
          <RankedEntityList rows={metrics.perLocation} />
        </DashboardCard>

        <DashboardCard title="Repeat incident flagging" description="Same client and category, two or more times">
          {metrics.repeats.length ? (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {metrics.repeats.map((row) => (
                <li key={`${row.clientId}-${row.category}`} className="px-3 py-2 text-sm">
                  <Link href={`/clients/${row.clientId}`} className="font-medium text-[#b51266] hover:underline">
                    {row.clientLabel}
                  </Link>
                  <span className="text-slate-600">
                    {" "}
                    · {row.category} · {row.count} incidents
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {row.incidentIds.map((id) => (
                      <Link
                        key={id}
                        href={`/incidents/${id}`}
                        className="text-xs text-slate-500 hover:text-[#b51266] hover:underline"
                      >
                        Open
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No repeat client + category patterns in this range.</p>
          )}
        </DashboardCard>
      </div>
    </AppShell>
  );
}
