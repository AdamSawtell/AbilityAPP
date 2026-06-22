import type { ClaimRecord } from "@/lib/claim";
import { formatClaimPeriod } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";
import { escapeDocumentHtml, wrapDocumentHtml } from "@/lib/document-brand";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import type { IncidentRecord } from "@/lib/incident";
import type { AuditPackEvaluation } from "@/lib/ndis-audit-pack";
import { organizationDisplayName, type OrganizationRecord } from "@/lib/organization";

export type ClaimBatchDocumentContext = {
  claim: ClaimRecord;
  client: ClientRecord | undefined;
  organization: OrganizationRecord;
};

export type IncidentNotificationDocumentContext = {
  incident: IncidentRecord;
  client: ClientRecord | undefined;
  organization: OrganizationRecord;
};

export type AuditPackDocumentContext = {
  evaluation: AuditPackEvaluation;
  organization: OrganizationRecord;
};

export type ConsentScheduleDocumentContext = {
  client: ClientRecord;
  organization: OrganizationRecord;
};

function mergeOrgTokens(html: string, org: OrganizationRecord): string {
  return html.replace(/\{\{org\.tradingName\}\}/g, escapeDocumentHtml(organizationDisplayName(org)));
}

function phase2Styles(): string {
  return `
  .panel { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; margin-bottom: 16px; }
  .rich-text p { margin: 0 0 8px; color: #334155; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.lines th, table.lines td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  table.lines th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; }
  table.lines td.num { text-align: right; white-space: nowrap; }
  .doc-meta .doc-no { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .status-pass { color: #047857; }
  .status-warning { color: #b45309; }
  .status-block { color: #be123c; }
  .status-info { color: #475569; }
`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function auditStatusClass(status: AuditPackEvaluation["sections"][number]["status"]): string {
  if (status === "pass") return "status-pass";
  if (status === "warning") return "status-warning";
  if (status === "block") return "status-block";
  return "status-info";
}

export function buildClaimBatchDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: ClaimBatchDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { claim, client, organization } = ctx;
  const lineRows = claim.lines.length
    ? claim.lines
        .map(
          (line) => `<tr>
        <td>${escapeDocumentHtml(line.serviceDate || "—")}</td>
        <td>${escapeDocumentHtml(line.ndisSupportItem || "—")}</td>
        <td>${escapeDocumentHtml(line.claimType || "—")}</td>
        <td class="num">${escapeDocumentHtml(String(line.quantity))}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(line.unitPrice))}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(line.lineAmount))}</td>
        <td>${escapeDocumentHtml(line.validationStatus || "—")}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="7">No claim lines.</td></tr>`;

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Claim batch summary").toUpperCase())}</h2>
    <p class="doc-no">${escapeDocumentHtml(claim.documentNo)}</p>
    <p><span class="label">Period</span> ${escapeDocumentHtml(formatClaimPeriod(claim))}</p>
    <p><span class="label">Status</span> ${escapeDocumentHtml(claim.status)} · ${escapeDocumentHtml(claim.gatewayStatus || "Not submitted")}</p>
  </div>`;

  const bodyHtml = `<style>${phase2Styles()}</style>
  <div class="panel">
    <p class="party-name">${escapeDocumentHtml(client?.name ?? claim.clientId ?? "—")}</p>
    ${client?.searchKey ? `<p>${escapeDocumentHtml(client.searchKey)}</p>` : ""}
    ${client?.fundingBodyNumber?.trim() ? `<p>NDIS ${escapeDocumentHtml(client.fundingBodyNumber.trim())}</p>` : ""}
  </div>
  <table class="lines">
    <thead><tr><th>Service date</th><th>NDIS code</th><th>Claim type</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Validation</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="panel">
    <p><strong>Total claimed</strong> ${escapeDocumentHtml(formatMoney(claim.totalAmount))}</p>
    <p><strong>Plan management</strong> ${escapeDocumentHtml(claim.planManagementType || "—")}</p>
    ${claim.gatewayRef?.trim() ? `<p><strong>Gateway ref</strong> ${escapeDocumentHtml(claim.gatewayRef.trim())}</p>` : ""}
  </div>`;

  return wrapDocumentHtml({
    title: `${claim.documentNo} — Claim batch`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}

export function buildIncidentNotificationDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: IncidentNotificationDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { incident, client, organization } = ctx;
  const bodyBlock =
    template.blocks.find((b) => b.blockType === "rich-text")?.contentHtml ??
    "<p>This letter confirms notification regarding the incident referenced below.</p>";

  const notificationRows = incident.notifications.length
    ? incident.notifications
        .map(
          (row) => `<tr>
        <td>${escapeDocumentHtml(row.notifiedAt || "—")}</td>
        <td>${escapeDocumentHtml(row.notifyTarget || "—")}</td>
        <td>${escapeDocumentHtml(row.method || "—")}</td>
        <td>${escapeDocumentHtml(row.notifiedBy || "—")}</td>
        <td>${escapeDocumentHtml(row.reference || "—")}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="5">No notification rows recorded yet.</td></tr>`;

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Incident notification").toUpperCase())}</h2>
    <p class="doc-no">${escapeDocumentHtml(incident.documentNo)}</p>
    <p><span class="label">Occurred</span> ${escapeDocumentHtml(incident.occurredAt?.slice(0, 16) || "—")}</p>
    ${incident.isReportable ? `<p><span class="label">NDIS reportable</span> ${escapeDocumentHtml(incident.reportableType || "Yes")}</p>` : ""}
  </div>`;

  const bodyHtml = `<style>${phase2Styles()}</style>
  <div class="panel">
    <p class="party-name">${escapeDocumentHtml(client?.name ?? "Participant / stakeholder")}</p>
    ${incident.title?.trim() ? `<p><strong>${escapeDocumentHtml(incident.title.trim())}</strong></p>` : ""}
  </div>
  <div class="rich-text">${mergeOrgTokens(bodyBlock, organization)}</div>
  ${incident.description?.trim() ? `<div class="panel"><strong>Summary</strong><p>${escapeDocumentHtml(incident.description).replace(/\n/g, "<br/>")}</p></div>` : ""}
  ${incident.immediateActions?.trim() ? `<div class="panel"><strong>Immediate actions</strong><p>${escapeDocumentHtml(incident.immediateActions).replace(/\n/g, "<br/>")}</p></div>` : ""}
  <h3 style="font-size:13px;margin:16px 0 8px">Notification log</h3>
  <table class="lines">
    <thead><tr><th>Date</th><th>Target</th><th>Method</th><th>Notified by</th><th>Reference</th></tr></thead>
    <tbody>${notificationRows}</tbody>
  </table>`;

  return wrapDocumentHtml({
    title: `${incident.documentNo} — Notification`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}

export function buildAuditPackDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: AuditPackDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { evaluation, organization } = ctx;
  const sectionRows = evaluation.sections
    .map(
      (section) => `<tr>
      <td>${escapeDocumentHtml(section.label)}</td>
      <td class="${auditStatusClass(section.status)}">${escapeDocumentHtml(section.status.toUpperCase())}</td>
      <td>${escapeDocumentHtml(section.message || "—")}</td>
      <td class="num">${section.rowCount}</td>
    </tr>`
    )
    .join("");

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "NDIS audit pack").toUpperCase())}</h2>
    <p><span class="label">Audit month</span> ${escapeDocumentHtml(evaluation.auditMonth)}</p>
    <p><span class="label">Period</span> ${escapeDocumentHtml(evaluation.periodStart)} – ${escapeDocumentHtml(evaluation.periodEnd)}</p>
    <p><span class="label">Ready for audit</span> ${evaluation.readyForAudit ? "Yes" : "No"}</p>
  </div>`;

  const bodyHtml = `<style>${phase2Styles()}</style>
  <div class="panel">
    <p><strong>Participants in scope</strong> ${evaluation.summary.participantCount}</p>
    <p><strong>Active agreements</strong> ${evaluation.summary.agreementCount}</p>
    <p><strong>Timesheets</strong> ${evaluation.summary.timesheetCount} · <strong>Claims</strong> ${evaluation.summary.claimCount} · <strong>Invoices</strong> ${evaluation.summary.invoiceCount}</p>
    <p><strong>Reportable incidents</strong> ${evaluation.summary.reportableIncidentCount} · <strong>Credential alerts</strong> ${evaluation.summary.credentialAlertCount}</p>
  </div>
  <table class="lines">
    <thead><tr><th>Section</th><th>Status</th><th>Message</th><th>Rows</th></tr></thead>
    <tbody>${sectionRows}</tbody>
  </table>`;

  return wrapDocumentHtml({
    title: `Audit pack — ${evaluation.auditMonth}`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}

export function buildConsentScheduleDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: ConsentScheduleDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { client, organization } = ctx;
  const consents = client.consents ?? [];
  const lineRows = consents.length
    ? consents
        .map(
          (row) => `<tr>
        <td>${escapeDocumentHtml(row.consentType || "—")}</td>
        <td>${escapeDocumentHtml(row.consentStatus || "—")}</td>
        <td>${escapeDocumentHtml(row.description || row.name || "—")}</td>
        <td>${escapeDocumentHtml(row.validFrom || "—")}</td>
        <td>${escapeDocumentHtml(row.validTo || "—")}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="5">No consent lines recorded.</td></tr>`;

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Consent schedule").toUpperCase())}</h2>
    <p class="doc-no">${escapeDocumentHtml(client.searchKey)}</p>
  </div>`;

  const bodyHtml = `<style>${phase2Styles()}</style>
  <div class="panel">
    <p class="party-name">${escapeDocumentHtml(client.name)}</p>
    ${client.fundingBodyNumber?.trim() ? `<p>NDIS ${escapeDocumentHtml(client.fundingBodyNumber.trim())}</p>` : ""}
  </div>
  <table class="lines">
    <thead><tr><th>Consent type</th><th>Status</th><th>Description</th><th>Valid from</th><th>Valid to</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  ${client.consentAlertList?.trim() ? `<div class="panel"><strong>Alerts</strong><p>${escapeDocumentHtml(client.consentAlertList)}</p></div>` : ""}`;

  return wrapDocumentHtml({
    title: `${client.searchKey} — Consent schedule`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}
