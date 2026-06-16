import type { IncidentDateRange } from "@/lib/incident-analytics";
import { downloadCsv } from "@/lib/reports/export";

type DashboardMetrics = ReturnType<
  typeof import("@/lib/incident-analytics").buildIncidentDashboardMetrics
>;

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function sectionCsv(title: string, headers: string[], rows: string[][]): string {
  const lines = [title, headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.map(escapeCsvCell).join(","))];
  return lines.join("\r\n");
}

export function exportDashboardCsv(
  metrics: DashboardMetrics,
  range: IncidentDateRange,
  orgName: string
) {
  const parts: string[] = [
    `Incident dashboard export`,
    `Organisation,${escapeCsvCell(orgName)}`,
    `From,${escapeCsvCell(range.from || "—")}`,
    `To,${escapeCsvCell(range.to || "—")}`,
    `Generated,${escapeCsvCell(new Date().toISOString())}`,
    "",
    sectionCsv(
      "Summary",
      ["Metric", "Value"],
      [
        ["Incidents in range", String(metrics.total)],
        ["Average days to close", metrics.avgDaysToClose !== null ? String(metrics.avgDaysToClose) : "—"],
        ["Overdue investigations", String(metrics.overdue.length)],
        ["Repeat patterns", String(metrics.repeats.length)],
      ]
    ),
    "",
    sectionCsv(
      "By status",
      ["Status", "Count"],
      metrics.byStatus.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "By category",
      ["Category", "Count"],
      metrics.byCategory.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "By severity",
      ["Severity", "Count"],
      metrics.bySeverity.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "By service type",
      ["Service type", "Count"],
      metrics.perServiceType.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "Trend",
      ["Period", "Count"],
      metrics.trend.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "Per client",
      ["Client", "Count"],
      metrics.perClient.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "Per employee",
      ["Employee", "Count"],
      metrics.perEmployee.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "Per location",
      ["Location", "Count"],
      metrics.perLocation.map((r) => [r.label, String(r.count)])
    ),
    "",
    sectionCsv(
      "Overdue investigations",
      ["Document", "Title", "Reason"],
      metrics.overdue.map((r) => [r.documentNo, r.title, r.reason])
    ),
    "",
    sectionCsv(
      "Repeat incidents",
      ["Client", "Category", "Count"],
      metrics.repeats.map((r) => [r.clientLabel, r.category, String(r.count)])
    ),
  ];

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`incident-dashboard-${date}.csv`, parts.join("\r\n"));
}

function tableHtml(title: string, headers: string[], rows: string[][]): string {
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<h2>${title}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function printDashboardPdf(
  metrics: DashboardMetrics,
  range: IncidentDateRange,
  orgName: string
) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Incident dashboard</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 12px; color: #111; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #555; margin-bottom: 20px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
  .kpi strong { display: block; font-size: 22px; margin-top: 4px; }
  h2 { font-size: 14px; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
  th { background: #f8fafc; }
  @media print { body { margin: 12mm; } }
</style></head><body>
  <h1>Incident dashboard &amp; analytics</h1>
  <p class="meta">${orgName} · ${range.from || "start"} to ${range.to || "today"} · Generated ${new Date().toLocaleString()}</p>
  <div class="kpis">
    <div class="kpi">Incidents<strong>${metrics.total}</strong></div>
    <div class="kpi">Avg. days to close<strong>${metrics.avgDaysToClose ?? "—"}</strong></div>
    <div class="kpi">Overdue<strong>${metrics.overdue.length}</strong></div>
    <div class="kpi">Repeat patterns<strong>${metrics.repeats.length}</strong></div>
  </div>
  ${tableHtml("By status", ["Status", "Count"], metrics.byStatus.map((r) => [r.label, String(r.count)]))}
  ${tableHtml("By category", ["Category", "Count"], metrics.byCategory.map((r) => [r.label, String(r.count)]))}
  ${tableHtml("By severity", ["Severity", "Count"], metrics.bySeverity.map((r) => [r.label, String(r.count)]))}
  ${tableHtml("By service type", ["Service type", "Count"], metrics.perServiceType.map((r) => [r.label, String(r.count)]))}
  ${tableHtml("Trend", ["Period", "Count"], metrics.trend.map((r) => [r.label, String(r.count)]))}
  ${tableHtml("Per client", ["Client", "Count"], metrics.perClient.slice(0, 15).map((r) => [r.label, String(r.count)]))}
  ${tableHtml("Overdue investigations", ["Document", "Title", "Reason"], metrics.overdue.map((r) => [r.documentNo, r.title, r.reason]))}
  ${tableHtml("Repeat incidents", ["Client", "Category", "Count"], metrics.repeats.map((r) => [r.clientLabel, r.category, String(r.count)]))}
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
