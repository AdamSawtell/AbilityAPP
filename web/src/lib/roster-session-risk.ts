import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import type { RosterShiftClientLine } from "@/lib/roster-session";

export type SessionRiskAlert = {
  id: string;
  clientId: string;
  clientLabel: string;
  category: string;
  name: string;
  detail: string;
  severity: "critical" | "warning" | "info";
};

export function collectiveSessionRiskAlerts(
  clientLines: RosterShiftClientLine[],
  clients: ClientRecord[],
  location?: LocationRecord | null
): SessionRiskAlert[] {
  const alerts: SessionRiskAlert[] = [];
  const seen = new Set<string>();

  function push(alert: SessionRiskAlert) {
    const key = `${alert.clientId}|${alert.category}|${alert.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    alerts.push(alert);
  }

  for (const line of clientLines) {
    if (!line.clientId?.trim()) continue;
    const client = clients.find((row) => row.id === line.clientId);
    if (!client) continue;
    const clientLabel = client.preferredName || client.name || client.searchKey;

    for (const need of client.needsAndRules ?? []) {
      if (need.showAsAlert !== "Yes") continue;
      push({
        id: `need-${need.id}`,
        clientId: client.id,
        clientLabel,
        category: need.category || "Need / rule",
        name: need.name || "Support requirement",
        detail: need.ruleText || "",
        severity: need.category?.toLowerCase().includes("behaviour") ? "critical" : "warning",
      });
    }

    for (const risk of client.risks ?? []) {
      if (risk.showAsAlert !== "Yes") continue;
      push({
        id: `risk-${risk.id}`,
        clientId: client.id,
        clientLabel,
        category: risk.riskType || "Risk",
        name: risk.name || "Risk on file",
        detail: risk.description || risk.controls || "",
        severity:
          risk.consequence?.toLowerCase().includes("high") || risk.likelihood?.toLowerCase().includes("high")
            ? "critical"
            : "warning",
      });
    }
  }

  const locationDetail = location?.accessNotes?.trim() || location?.description?.trim();
  if (locationDetail) {
    push({
      id: `loc-${location!.id}`,
      clientId: "",
      clientLabel: location!.name || location!.searchKey,
      category: "Location",
      name: location!.accessNotes?.trim() ? "Access notes" : "Site description",
      detail: locationDetail,
      severity: "info",
    });
  }

  return alerts.sort(
    (a, b) =>
      (a.severity === "critical" ? 0 : a.severity === "warning" ? 1 : 2) -
        (b.severity === "critical" ? 0 : b.severity === "warning" ? 1 : 2) ||
      a.clientLabel.localeCompare(b.clientLabel)
  );
}
