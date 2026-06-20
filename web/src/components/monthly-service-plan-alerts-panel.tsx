"use client";

import { useMemo } from "react";
import type { ClientRecord } from "@/lib/client";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import {
  buildMonthlyPlanBurnAlerts,
  calculateBurnRateSnapshot,
  type ServicePlanBurnAlert,
} from "@/lib/monthly-service-plan-burn-rate";
import type { MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";

function alertClass(severity: ServicePlanBurnAlert["severity"]): string {
  if (severity === "danger") return "border-rose-200 bg-rose-50 text-rose-950";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-sky-200 bg-sky-50 text-sky-950";
}

export function MonthlyServicePlanAlertsPanel({
  client,
  plan,
  compact = false,
}: {
  client: ClientRecord | undefined;
  plan?: MonthlyServicePlanRecord | null;
  compact?: boolean;
}) {
  const snapshot = useMemo(
    () => (client ? calculateBurnRateSnapshot(client) : null),
    [client]
  );
  const alerts = useMemo(
    () => (client ? buildMonthlyPlanBurnAlerts(client, plan) : []),
    [client, plan]
  );

  if (!client) {
    return null;
  }

  const actionable = alerts.filter((a) => a.code !== "plan-period" && a.code !== "utilisation");

  if (compact) {
    if (!actionable.length) {
      return (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          No burn-rate or forecast alerts for this client.
        </p>
      );
    }
    return (
      <ul className="space-y-1.5">
        {actionable.map((alert) => (
          <li key={alert.code} className={`rounded-lg border px-3 py-2 text-sm ${alertClass(alert.severity)}`}>
            <span className="font-medium">{alert.title}: </span>
            {alert.message}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      {snapshot ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Utilisation</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {snapshot.utilisationPct != null ? `${snapshot.utilisationPct}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Burn rate</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {snapshot.burnRate != null ? `${snapshot.burnRate.toFixed(2)}×` : "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Claimed vs plan period elapsed</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Forecast utilisation</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {snapshot.projectedUtilisationPct != null ? `${snapshot.projectedUtilisationPct}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Budget remaining</p>
            <p className="mt-1 text-lg font-semibold text-emerald-900">
              {formatPlanBudgetCurrency(snapshot.budget.remaining)}
            </p>
            {snapshot.period ? (
              <p className="mt-0.5 text-xs text-emerald-800">{snapshot.period.elapsedPct}% of period elapsed</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {alerts.length ? (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.code} className={`rounded-lg border px-3 py-2 text-sm ${alertClass(alert.severity)}`}>
              <p className="font-medium">{alert.title}</p>
              <p className="mt-0.5">{alert.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          No burn-rate or forecast alerts.
        </p>
      )}
    </div>
  );
}
