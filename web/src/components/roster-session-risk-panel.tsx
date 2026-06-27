"use client";

import { collectiveSessionRiskAlerts } from "@/lib/roster-session-risk";
import type { RosterShiftClientLine } from "@/lib/roster-session";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";

const severityStyles = {
  critical: "border-rose-200 bg-rose-50 text-rose-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  info: "border-slate-200 bg-slate-50 text-slate-800",
} as const;

export function RosterSessionRiskPanel({
  clientLines,
  clients,
  location,
}: {
  clientLines: RosterShiftClientLine[];
  clients: ClientRecord[];
  location?: LocationRecord | null;
}) {
  const alerts = collectiveSessionRiskAlerts(clientLines, clients, location);
  if (!alerts.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collective session risks</p>
      <p className="mt-1 text-sm text-slate-600">
        Alerts from all clients on this session — review before assigning workers.
      </p>
      <ul className="mt-3 space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-lg border px-3 py-2 text-sm ${severityStyles[alert.severity]}`}
          >
            <p className="font-medium">
              {alert.clientLabel}
              {alert.category ? ` · ${alert.category}` : ""}
            </p>
            <p className="mt-0.5 font-medium">{alert.name}</p>
            {alert.detail ? <p className="mt-1 text-xs opacity-90">{alert.detail}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
