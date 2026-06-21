import type { ClientRecord } from "@/lib/client";
import {
  buildMonthlyPlanBurnAlerts,
  type ServicePlanBurnAlert,
} from "@/lib/monthly-service-plan-burn-rate";

export type ClientCrossSellOpportunity = {
  clientId: string;
  clientName: string;
  searchKey: string;
  alerts: ServicePlanBurnAlert[];
  primaryAlert: ServicePlanBurnAlert;
};

const CROSS_SELL_ALERT_CODES = new Set([
  "underserviced",
  "underspend-pace",
  "plan-review-soon",
  "monthly-plan-high",
  "overspend-risk",
  "overspend-pace",
]);

function severityRank(severity: ServicePlanBurnAlert["severity"]): number {
  if (severity === "danger") return 0;
  if (severity === "warning") return 1;
  return 2;
}

export function isActiveClientForCrossSell(client: ClientRecord): boolean {
  const lifecycle = (client.lifecycleStatus ?? "").trim().toLowerCase();
  if (lifecycle === "active") return true;
  return lifecycle.includes("active");
}

export function buildClientCrossSellOpportunities(clients: ClientRecord[]): ClientCrossSellOpportunity[] {
  const opportunities: ClientCrossSellOpportunity[] = [];

  for (const client of clients) {
    if (!isActiveClientForCrossSell(client)) continue;

    const alerts = buildMonthlyPlanBurnAlerts(client, null).filter(
      (alert) =>
        CROSS_SELL_ALERT_CODES.has(alert.code) &&
        (alert.severity === "warning" || alert.severity === "danger")
    );

    if (!alerts.length) continue;

    opportunities.push({
      clientId: client.id,
      clientName: client.name,
      searchKey: client.searchKey,
      alerts,
      primaryAlert: alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity))[0],
    });
  }

  return opportunities.sort(
    (a, b) => severityRank(a.primaryAlert.severity) - severityRank(b.primaryAlert.severity)
  );
}
