import type { BoardReportPackRecord, BoardReportPackSection } from "@/lib/board-report-pack";
import { formatBoardReportPeriod, visibleBoardReportSections } from "@/lib/board-report-pack";
import { organizationDisplayName, formatOrganizationAddress, type OrganizationRecord } from "@/lib/organization";

export type BoardReportPrintContext = {
  pack: BoardReportPackRecord;
  organization: OrganizationRecord;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trafficBadge(light: string): string {
  if (light === "green") return '<span class="light green">Green</span>';
  if (light === "amber") return '<span class="light amber">Amber</span>';
  if (light === "red") return '<span class="light red">Red</span>';
  return "";
}

function sectionHtml(section: BoardReportPackSection): string {
  const metrics = section.snapshot.metrics
    .map((m) => `<tr><td>${escapeHtml(m.label)}</td><td>${escapeHtml(m.value)}</td><td>${trafficBadge(m.trafficLight ?? "none")}</td></tr>`)
    .join("");
  const tables = section.snapshot.tables
    .map((table) => {
      const head = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
      const body = table.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("");
      return `<h4>${escapeHtml(table.title)}</h4><table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join("");
  const bullets = section.snapshot.bullets.length
    ? `<ul>${section.snapshot.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
    : "";
  const commentary = section.commentary.trim()
    ? `<div class="commentary"><strong>Commentary</strong><p>${escapeHtml(section.commentary).replace(/\n/g, "<br/>")}</p></div>`
    : "";

  return `<section class="report-section">
    <div class="section-head">
      <h2>${escapeHtml(section.label)}</h2>
      ${trafficBadge(section.trafficLight)}
    </div>
    <p class="status">${escapeHtml(section.statusMessage)}</p>
    ${metrics ? `<table class="metrics"><tbody>${metrics}</tbody></table>` : ""}
    ${tables}
    ${bullets}
    ${commentary}
  </section>`;
}

export function buildBoardReportPrintHtml(ctx: BoardReportPrintContext): string {
  const { pack, organization } = ctx;
  const orgName = escapeHtml(organizationDisplayName(organization));
  const address = escapeHtml(formatOrganizationAddress(organization)).replace(/\n/g, "<br/>");
  const sections = visibleBoardReportSections(pack).map(sectionHtml).join("");
  const generated = new Date().toLocaleString("en-AU");

  const narrative = [
    pack.executiveSummary.trim()
      ? `<section class="report-section"><h2>Executive Summary</h2><p>${escapeHtml(pack.executiveSummary).replace(/\n/g, "<br/>")}</p></section>`
      : "",
    pack.ceoCommentary.trim()
      ? `<section class="report-section"><h2>CEO Commentary</h2><p>${escapeHtml(pack.ceoCommentary).replace(/\n/g, "<br/>")}</p></section>`
      : "",
    pack.keyDecisionsRequired.trim()
      ? `<section class="report-section"><h2>Key Decisions Required</h2><p>${escapeHtml(pack.keyDecisionsRequired).replace(/\n/g, "<br/>")}</p></section>`
      : "",
    pack.operationalIssues.trim()
      ? `<section class="report-section"><h2>Operational Issues</h2><p>${escapeHtml(pack.operationalIssues).replace(/\n/g, "<br/>")}</p></section>`
      : "",
  ].join("");

  return `<!DOCTYPE html>
<html lang="en-AU"><head>
<meta charset="utf-8"/>
<title>${escapeHtml(pack.title)}</title>
<style>
  @page { margin: 18mm 15mm; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.45; margin: 0; }
  .cover { page-break-after: always; padding: 24mm 0 12mm; border-bottom: 3px solid #be185d; margin-bottom: 18mm; }
  .cover h1 { font-size: 28pt; margin: 0 0 8px; color: #831843; }
  .cover .org { font-size: 14pt; color: #334155; margin-bottom: 16px; }
  .cover .meta { color: #64748b; }
  .report-section { page-break-inside: avoid; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
  .section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  h2 { font-size: 16pt; margin: 0 0 8px; color: #1e293b; }
  h4 { font-size: 11pt; margin: 12px 0 6px; color: #475569; }
  .status { color: #475569; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 10pt; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f8fafc; }
  .light { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9pt; font-weight: 600; }
  .light.green { background: #d1fae5; color: #065f46; }
  .light.amber { background: #fef3c7; color: #92400e; }
  .light.red { background: #ffe4e6; color: #9f1239; }
  .commentary { background: #f8fafc; border-left: 3px solid #be185d; padding: 8px 12px; margin-top: 8px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 9pt; }
  @media print { .no-print { display: none; } }
</style></head><body>
  <div class="cover">
    <p class="org">${orgName}</p>
    <h1>${escapeHtml(pack.title)}</h1>
    <p class="meta">Reporting period: ${escapeHtml(formatBoardReportPeriod(pack.reportPeriod))}</p>
    <p class="meta">Status: ${escapeHtml(pack.status)} · Generated ${escapeHtml(generated)}</p>
    ${address ? `<p class="meta">${address}</p>` : ""}
  </div>
  ${narrative}
  ${sections}
  <div class="footer">
    <p>${orgName} — Board report pack · ${escapeHtml(pack.title)} · Confidential</p>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

export function printBoardReportPack(ctx: BoardReportPrintContext): boolean {
  if (typeof window === "undefined") return false;
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(buildBoardReportPrintHtml(ctx));
  win.document.close();
  return true;
}
