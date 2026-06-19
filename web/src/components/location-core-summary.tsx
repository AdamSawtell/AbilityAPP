"use client";

import Link from "next/link";
import type { LocationRecord } from "@/lib/location";
import { locationAddressLine } from "@/lib/location";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function statusStyles(status: string) {
  if (status === "Active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "Planned") return "bg-sky-50 text-sky-800 ring-sky-200";
  if (status === "Closed") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

export function LocationCoreSummary({
  location,
  saved,
}: {
  location: LocationRecord;
  saved?: boolean;
}) {
  const activeAlerts = location.alerts.filter((a) => a.showAsAlert === "Yes").length;
  const address = locationAddressLine(location);
  const clientsTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Clients")}`;
  const employeesTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Employees")}`;
  const productsTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Products & services")}`;
  const alertsTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Alerts")}`;
  const contactTabHref = `/locations/${location.id}?tab=${encodeURIComponent("Contact & address")}`;

  return (
    <div className="mb-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {location.pictureUrl?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={location.pictureUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-1 ring-slate-200"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-bold text-white shadow-md">
                {initials(location.name) || "?"}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{location.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {location.searchKey}
                {location.locationType ? ` · ${location.locationType}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {saved ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    Saved
                  </span>
                ) : null}
                {location.status ? (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles(location.status)}`}
                  >
                    {location.status}
                  </span>
                ) : null}
                {location.alerts.length > 0 ? (
                  <Link
                    href={alertsTabHref}
                    className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ring-inset hover:bg-amber-100"
                  >
                    {location.alerts.length} alert{location.alerts.length === 1 ? "" : "s"}
                    {activeAlerts > 0 ? ` · ${activeAlerts} active` : ""}
                  </Link>
                ) : null}
                {location.clientLinks.length > 0 ? (
                  <Link
                    href={clientsTabHref}
                    className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900 ring-1 ring-violet-200 ring-inset hover:bg-violet-100"
                  >
                    {location.clientLinks.length} client{location.clientLinks.length === 1 ? "" : "s"}
                  </Link>
                ) : null}
                {location.employeeLinks.length > 0 ? (
                  <Link
                    href={employeesTabHref}
                    className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200 ring-inset hover:bg-sky-100"
                  >
                    {location.employeeLinks.length} staff
                  </Link>
                ) : null}
                {location.productLinks.length > 0 ? (
                  <Link
                    href={productsTabHref}
                    className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-900 ring-1 ring-indigo-200 ring-inset hover:bg-indigo-100"
                  >
                    {location.productLinks.length} service{location.productLinks.length === 1 ? "" : "s"}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="grid min-w-[220px] gap-3 text-sm sm:text-right">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Capacity</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{location.capacity || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">City</dt>
              <dd className="mt-0.5 text-slate-700">{location.city || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="grid border-t border-slate-100 bg-slate-50/60 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Address</p>
            <p className="mt-0.5 text-sm text-slate-800">
              {address ? (
                <Link href={contactTabHref} className="hover:text-[#b51266] hover:underline">
                  {address}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-0.5 text-sm text-slate-800">{location.phone || location.mobile || "—"}</p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 lg:border-b-0 lg:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-0.5 truncate text-sm text-slate-800">{location.email || "—"}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Valid</p>
            <p className="mt-0.5 text-sm text-slate-800">
              {location.validFrom || "—"}
              {location.validTo ? ` → ${location.validTo}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
