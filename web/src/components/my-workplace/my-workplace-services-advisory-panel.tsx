"use client";

import type { MyWorkplaceServicesAdvisory } from "@/lib/my-workplace/services-advisory";

function demandBadgeLabel(reason: MyWorkplaceServicesAdvisory["sites"][number]["highDemandReason"]): string {
  if (reason === "vacant_shifts") return "High demand — open shifts";
  if (reason === "manual_flag") return "High demand";
  if (reason === "both") return "High demand — open shifts";
  return "";
}

export function MyWorkplaceServicesAdvisoryPanel({
  advisory,
}: {
  advisory: MyWorkplaceServicesAdvisory | null | undefined;
}) {
  if (!advisory?.sites.length) return null;

  return (
    <section
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="my-workplace-services-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="my-workplace-services-heading" className="text-lg font-semibold text-slate-900">
            Services I can work at
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Sites where you are assigned, credentialed, and site-oriented. This list is read-only — contact rostering to
            pick up extra shifts.
          </p>
        </div>
        {advisory.highDemandCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
            {advisory.highDemandCount} high demand
          </span>
        ) : null}
      </div>

      {advisory.advisoryMessage ? (
        <p
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {advisory.advisoryMessage}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3" aria-label="Qualified service locations">
        {advisory.sites.map((site) => (
          <li
            key={site.locationId}
            className={`rounded-xl border px-4 py-3 ${
              site.highDemand
                ? "border-amber-300 bg-amber-50/60 ring-1 ring-amber-200/80"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{site.name}</p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {site.locationType}
                  {site.assignmentRole ? ` · ${site.assignmentRole}` : ""}
                </p>
                {site.addressLine ? (
                  <p className="mt-1 text-sm text-slate-500">{site.addressLine}</p>
                ) : null}
              </div>
              {site.highDemand ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
                  <span aria-hidden="true">⚡</span>
                  {demandBadgeLabel(site.highDemandReason)}
                </span>
              ) : null}
            </div>
            {site.highDemand ? (
              <p className="mt-2 text-sm text-amber-950">
                This service has high demand for shifts — contact rostering to discuss opportunities.
                {site.vacantShiftCount >= 2
                  ? ` (${site.vacantShiftCount} open shift${site.vacantShiftCount === 1 ? "" : "s"} in the next two weeks)`
                  : ""}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
