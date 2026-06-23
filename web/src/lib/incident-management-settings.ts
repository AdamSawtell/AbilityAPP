/** Incident module defaults stored on the organisation record. */

export const INCIDENT_MANAGEMENT_SETTINGS = {
  title: "Incident management",
  description: "Defaults used by the incident dashboard and investigation SLA alerts.",
  slaField: {
    label: "Investigation SLA (days)",
    placeholder: "14",
    hint: "Open investigations beyond this many days trigger an overdue alert on the dashboard.",
  },
} as const;

export function normalizeInvestigationSlaDays(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 14;
}
