"use client";

import { useEffect, useState } from "react";
import { PortalGuard, PortalLogoutButton } from "@/components/portal/portal-hub-page";
import { PortalNav, PortalShell } from "@/components/portal/portal-shell";
import { formatDisplayDate } from "@/lib/enquiry";
import type { PortalServiceItem } from "@/lib/portal/types";

export function PortalServicesPage() {
  const [services, setServices] = useState<PortalServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/services", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { services: PortalServiceItem[] };
        setServices(data.services ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalGuard>
      {(session) => (
        <PortalShell
          title="My services"
          subtitle={`Upcoming supports for ${session.displayName}`}
          actions={<PortalLogoutButton />}
        >
          <PortalNav active="services" />

          {loading ? (
            <p className="text-sm text-slate-500">Loading services…</p>
          ) : services.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Support</th>
                    <th className="px-4 py-3 font-medium">Worker</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                        {formatDisplayDate(item.shiftDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {item.startTime} – {item.endTime}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.shiftType}</td>
                      <td className="px-4 py-3 text-slate-700">{item.workerName || "To be confirmed"}</td>
                      <td className="px-4 py-3 text-slate-600">{item.locationName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
              <p className="text-sm text-slate-600">No upcoming services in the next eight weeks.</p>
              <p className="mt-1 text-xs text-slate-500">Contact your provider if you expected to see supports here.</p>
            </div>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
