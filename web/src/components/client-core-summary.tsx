"use client";

import Link from "next/link";
import { useData } from "@/lib/data-store";
import type { ClientRecord } from "@/lib/client";
import { formatLocationAddress } from "@/lib/client-line-tables";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function statusLabel(status: string) {
  return status.replace(/^\d+_/, "").replace(/_/g, " ");
}

export function ClientCoreSummary({ client, saved }: { client: ClientRecord; saved?: boolean }) {
  const { getServiceAgreementsByClientId, getSupportPlanByClientId } = useData();
  const supportPlan = getSupportPlanByClientId(client.id);
  const agreements = getServiceAgreementsByClientId(client.id);
  const supportPlanTabHref = `/clients/${client.id}?tab=${encodeURIComponent("Support Plan")}`;
  const activeAlerts = client.alerts.filter((a) => a.showAsAlert === "Yes").length;
  const activeConsents = (client.consents ?? []).filter((c) => c.showAsAlert === "Yes").length;
  const restrictiveCount = client.restrictivePractices?.length ?? 0;
  const postToLocation = client.locations?.find((l) => l.postToAddress === "Yes" && l.active === "Yes");
  const serviceLocation = client.locations?.find((l) => l.serviceDeliveryAddress === "Yes" && l.active === "Yes");

  return (
    <div className="mb-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-bold text-white shadow-md">
              {initials(client.name) || "?"}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{client.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {client.searchKey}
                {client.preferredName && client.preferredName !== client.firstName
                  ? ` · goes by ${client.preferredName}`
                  : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {saved ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    Saved
                  </span>
                ) : null}
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                  {statusLabel(client.status)}
                </span>
                {client.alerts.length > 0 ? (
                  <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ring-inset">
                    {client.alerts.length} alert{client.alerts.length === 1 ? "" : "s"}
                    {activeAlerts > 0 ? ` · ${activeAlerts} active` : ""}
                  </span>
                ) : null}
                {activeConsents > 0 ? (
                  <Link
                    href={`/clients/${client.id}?tab=Consents%20and%20Legal%20Orders`}
                    className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200 ring-inset hover:bg-sky-100"
                  >
                    {activeConsents} consent alert{activeConsents === 1 ? "" : "s"}
                  </Link>
                ) : null}
                {restrictiveCount > 0 ? (
                  <Link
                    href={`/clients/${client.id}?tab=Restrictive%20Practices`}
                    className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-900 ring-1 ring-rose-200 ring-inset hover:bg-rose-100"
                  >
                    {restrictiveCount} restrictive practice{restrictiveCount === 1 ? "" : "s"}
                  </Link>
                ) : null}
                {client.riskAlerts?.trim() ? (
                  <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-900 ring-1 ring-orange-200 ring-inset">
                    Risk noted
                  </span>
                ) : null}
                {supportPlan ? (
                  <Link
                    href={supportPlanTabHref}
                    className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200 ring-inset hover:bg-sky-100"
                  >
                    Support plan · {supportPlan.goals.length} goal{supportPlan.goals.length === 1 ? "" : "s"}
                  </Link>
                ) : null}
                {agreements.length > 0 ? (
                  <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900 ring-1 ring-violet-200 ring-inset">
                    {agreements.length} service agreement{agreements.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="grid min-w-[220px] gap-3 text-sm sm:text-right">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Funding</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{client.fundingBody || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Disability</dt>
              <dd className="mt-0.5 text-slate-700">{client.disability || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="grid border-t border-slate-100 bg-slate-50/60 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-0.5 truncate text-sm text-slate-800">{client.email || "—"}</p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-0.5 text-sm text-slate-800">{client.phone || "—"}</p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 lg:border-b-0 lg:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Service address</p>
            <p className="mt-0.5 text-sm text-slate-800">
              {serviceLocation ? (
                <Link href={`/clients/${client.id}?tab=Locations`} className="hover:text-[#b51266] hover:underline">
                  {formatLocationAddress(serviceLocation)}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Post to</p>
            <p className="mt-0.5 text-sm text-slate-800">
              {postToLocation ? (
                <Link href={`/clients/${client.id}?tab=Locations`} className="hover:text-[#b51266] hover:underline">
                  {formatLocationAddress(postToLocation)}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
