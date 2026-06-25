"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PortalGuard, PortalLogoutButton } from "@/components/portal/portal-hub-page";
import { PortalNav, PortalShell } from "@/components/portal/portal-shell";
import { formatDisplayDate } from "@/lib/enquiry";
import {
  PORTAL_SERVICE_CATALOG,
  portalServiceRequestStatusLabel,
  portalServiceRequestStatusStyles,
  type PortalServiceCatalogItem,
  type PortalServiceRequestRecord,
} from "@/lib/portal/service-request";

export function PortalRequestsPage() {
  const [requests, setRequests] = useState<PortalServiceRequestRecord[]>([]);
  const [catalog, setCatalog] = useState<PortalServiceCatalogItem[]>(PORTAL_SERVICE_CATALOG);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [serviceCategory, setServiceCategory] = useState(catalog[0]?.label ?? "");
  const [supportBudget, setSupportBudget] = useState(catalog[0]?.supportBudget ?? "Core");
  const [description, setDescription] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");

  const selectedCatalog = useMemo(
    () => catalog.find((item) => item.label === serviceCategory) ?? catalog[0],
    [catalog, serviceCategory]
  );

  useEffect(() => {
    fetch("/api/portal/requests", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as {
          requests: PortalServiceRequestRecord[];
          catalog: PortalServiceCatalogItem[];
        };
        setRequests(data.requests ?? []);
        if (data.catalog?.length) setCatalog(data.catalog);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCatalog) setSupportBudget(selectedCatalog.supportBudget);
  }, [selectedCatalog]);

  async function reloadRequests() {
    const res = await fetch("/api/portal/requests", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { requests: PortalServiceRequestRecord[] };
    setRequests(data.requests ?? []);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/portal/requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCategory,
          supportBudget,
          description,
          preferredSchedule,
        }),
      });
      const data = (await res.json()) as { error?: string; request?: PortalServiceRequestRecord };
      if (!res.ok) {
        setError(data.error ?? "Could not submit request.");
        return;
      }
      setMessage("Your request was submitted. A coordinator will review it and contact you.");
      setDescription("");
      setPreferredSchedule("");
      setShowForm(false);
      await reloadRequests();
    } catch {
      setError("Could not submit request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalGuard>
      {(session) => (
        <PortalShell
          title="Request a service"
          subtitle={`Submit a new support request for ${session.displayName}`}
          actions={<PortalLogoutButton />}
        >
          <PortalNav active="requests" />

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Tell us what support you need. Your coordinator reviews each request and may prepare an agreement
              variation.
            </p>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              {showForm ? "Cancel" : "New request"}
            </button>
          </div>

          {showForm ? (
            <form onSubmit={onSubmit} className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Service type
                </span>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                >
                  {catalog.map((item) => (
                    <option key={item.id} value={item.label}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  What support do you need?
                </span>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                  placeholder="Describe the support, goals, or changes you are looking for."
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Preferred days or times (optional)
                </span>
                <input
                  type="text"
                  value={preferredSchedule}
                  onChange={(e) => setPreferredSchedule(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
                  placeholder="e.g. weekday mornings, Saturday afternoons"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            </form>
          ) : null}

          {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-slate-500">Loading requests…</p>
          ) : requests.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {formatDisplayDate(item.createdAt.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3 text-slate-800">{item.serviceCategory}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${portalServiceRequestStatusStyles(item.status)}`}
                        >
                          {portalServiceRequestStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.status === "Declined" && item.declineReason ? (
                          <span>{item.declineReason}</span>
                        ) : item.status === "Approved" && item.variationAgreementId ? (
                          <span>Agreement variation prepared by your provider.</span>
                        ) : (
                          <span className="line-clamp-2">{item.description}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
              <p className="text-sm text-slate-600">You have not submitted any service requests yet.</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm font-medium text-[#b51266] hover:underline"
              >
                Submit your first request
              </button>
            </div>
          )}

          <p className="mt-6 text-xs text-slate-500">
            Need help choosing a service? Contact your coordinator, or see{" "}
            <Link href="/portal/help" className="text-[#b51266] hover:underline">
              How to use your portal
            </Link>
            .
          </p>
        </PortalShell>
      )}
    </PortalGuard>
  );
}
