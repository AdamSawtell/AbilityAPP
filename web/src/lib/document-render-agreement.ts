import type { ClientRecord } from "@/lib/client";
import { escapeDocumentHtml, wrapDocumentHtml } from "@/lib/document-brand";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import { organizationDisplayName, type OrganizationRecord } from "@/lib/organization";
import { hasAgreementSignature } from "@/lib/service-agreement-esign";
import type { ServiceAgreementLine, ServiceAgreementRecord } from "@/lib/service-agreement";

export type AgreementDocumentContext = {
  agreement: ServiceAgreementRecord;
  client: ClientRecord | undefined;
  organization: OrganizationRecord;
};

function formatPrintDate(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(value: string | number): string {
  const amount = typeof value === "number" ? value : parseFloat(String(value));
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function mergeOrgTokens(html: string, org: OrganizationRecord): string {
  return html.replace(/\{\{org\.tradingName\}\}/g, escapeDocumentHtml(organizationDisplayName(org)));
}

function partiesBlock(ctx: AgreementDocumentContext): string {
  const { agreement, client, organization } = ctx;
  const provider = organizationDisplayName(organization);
  const participant = client ? `${client.searchKey} — ${client.name}` : agreement.clientId || "—";
  const ndisNumber = client?.fundingBodyNumber?.trim();

  return `<div class="parties-grid">
    <div class="panel">
      <h3>Service provider</h3>
      <p class="party-name">${escapeDocumentHtml(provider)}</p>
      ${organization.abn?.trim() ? `<p>ABN ${escapeDocumentHtml(organization.abn.trim())}</p>` : ""}
      ${organization.ndisRegistrationNumber?.trim() ? `<p>NDIS ${escapeDocumentHtml(organization.ndisRegistrationNumber.trim())}</p>` : ""}
    </div>
    <div class="panel">
      <h3>Participant</h3>
      <p class="party-name">${escapeDocumentHtml(client?.name?.trim() || participant)}</p>
      ${ndisNumber ? `<p>NDIS number ${escapeDocumentHtml(ndisNumber)}</p>` : ""}
      <p>${escapeDocumentHtml(participant)}</p>
    </div>
  </div>`;
}

function scheduleRows(lines: ServiceAgreementLine[]): string {
  const sorted = [...lines].sort((a, b) => a.lineNo - b.lineNo);
  if (!sorted.length) {
    return `<tr><td colspan="5" class="empty">No supports on this agreement.</td></tr>`;
  }
  return sorted
    .map(
      (line) => `<tr>
        <td class="num">${line.lineNo}</td>
        <td>${escapeDocumentHtml(line.name || line.description || "—")}</td>
        <td>${escapeDocumentHtml(line.registrationGroup || "—")}</td>
        <td>${escapeDocumentHtml(line.fundingManagementType || "—")}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(line.plannedPrice))}</td>
      </tr>`
    )
    .join("");
}

function richTextBlocks(template: DocumentTemplateRecord, org: OrganizationRecord): string {
  return template.blocks
    .filter((block) => block.blockType === "rich-text" && block.contentHtml.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(
      (block) =>
        `<section class="rich-text"><h3>${escapeDocumentHtml(block.label || "Terms")}</h3>${mergeOrgTokens(block.contentHtml, org)}</section>`
    )
    .join("");
}

function signatureBlock(agreement: ServiceAgreementRecord): string {
  const signed = hasAgreementSignature(agreement);
  const signatureHtml = signed
    ? `<div class="sig-image"><img src="${agreement.signatureImage}" alt="Signature"/></div>`
    : `<div class="sig-line"></div>`;
  const signedDate = agreement.signedAt?.trim() ? formatPrintDate(agreement.signedAt) : "—";

  return `<section class="signatures">
    <h3>Signatures</h3>
    <div class="sig-grid">
      <div class="sig-box">
        <p class="sig-label">Participant / nominee</p>
        ${signatureHtml}
        <p class="sig-name">${escapeDocumentHtml(agreement.signerName?.trim() || "—")}</p>
        <p class="sig-meta">${escapeDocumentHtml(agreement.signerRole?.trim() || "Participant")} · ${escapeDocumentHtml(signedDate)}</p>
      </div>
      <div class="sig-box">
        <p class="sig-label">Provider authorised signatory</p>
        <div class="sig-line"></div>
        <p class="sig-name">—</p>
        <p class="sig-meta">Date —</p>
      </div>
    </div>
  </section>`;
}

function agreementBodyStyles(): string {
  return `
  .scaffold-notice {
    margin-bottom: 20px;
    padding: 12px 14px;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    background: #fffbeb;
    color: #92400e;
    font-size: 11px;
  }
  .parties-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  .panel {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    background: #f8fafc;
  }
  .panel h3 {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }
  .party-name { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 6px !important; }
  .panel p { margin: 0 0 4px; }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 24px;
    margin-bottom: 20px;
    padding: 14px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  .meta-grid p { margin: 0; }
  .label { color: #64748b; }
  .rich-text { margin-bottom: 20px; }
  .rich-text h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }
  .rich-text p { margin: 0 0 8px; color: #334155; }
  table.schedule {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.schedule th, table.schedule td {
    border: 1px solid #e2e8f0;
    padding: 8px 10px;
    vertical-align: top;
  }
  table.schedule th {
    background: #f1f5f9;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #475569;
    text-align: left;
  }
  table.schedule td.num { text-align: right; white-space: nowrap; }
  table.schedule td.empty { text-align: center; color: #64748b; padding: 20px; }
  .total-planned {
    margin-left: auto;
    width: min(100%, 280px);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    margin-bottom: 20px;
  }
  .signatures h3 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .sig-box { min-height: 120px; }
  .sig-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px !important; }
  .sig-line { border-bottom: 1px solid #94a3b8; height: 64px; margin-bottom: 8px; }
  .sig-image { height: 64px; margin-bottom: 8px; }
  .sig-image img { max-height: 64px; max-width: 100%; object-fit: contain; }
  .sig-name { font-weight: 600; margin-bottom: 4px !important; }
  .sig-meta { font-size: 11px; color: #64748b; }
  .doc-meta .doc-no {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  @media print {
    .panel, .signatures, .total-planned { break-inside: avoid; }
    table.schedule tr { break-inside: avoid; }
  }
`;
}

export function buildAgreementDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: AgreementDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { agreement, organization } = ctx;
  const titleBlock = template.titleText?.trim() || "Service Agreement";
  const titleUpper = titleBlock.toUpperCase();

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml(titleUpper)}</h2>
    <p class="doc-no">${escapeDocumentHtml(agreement.searchKey)}</p>
    <p><span class="label">Status</span> ${escapeDocumentHtml(agreement.status)}</p>
  </div>`;

  const bodyHtml = `<style>${agreementBodyStyles()}</style>
  <div class="scaffold-notice">
    Template scaffold — customise terms in System → Document templates before relying on this document for compliance.
  </div>
  ${partiesBlock(ctx)}
  <div class="meta-grid">
    <p><span class="label">Agreement name</span> ${escapeDocumentHtml(agreement.name || "—")}</p>
    <p><span class="label">Term</span> ${escapeDocumentHtml(agreement.term || "—")}</p>
    <p><span class="label">Contract date</span> ${escapeDocumentHtml(formatPrintDate(agreement.contractDate))}</p>
    <p><span class="label">Finish date</span> ${escapeDocumentHtml(formatPrintDate(agreement.finishDate))}</p>
    <p><span class="label">Review date</span> ${escapeDocumentHtml(formatPrintDate(agreement.reviewDate))}</p>
    <p><span class="label">Execution date</span> ${escapeDocumentHtml(formatPrintDate(agreement.executionDate))}</p>
  </div>
  ${richTextBlocks(template, organization)}
  <h3 style="margin:0 0 8px;font-size:13px;font-weight:700;color:#111827;">Schedule of supports</h3>
  <table class="schedule">
    <thead>
      <tr>
        <th>#</th>
        <th>Support</th>
        <th>Registration group</th>
        <th>Plan management</th>
        <th>Planned amount</th>
      </tr>
    </thead>
    <tbody>${scheduleRows(agreement.lines)}</tbody>
  </table>
  <div class="total-planned">
    <span>Total planned</span>
    <span>${escapeDocumentHtml(formatMoney(agreement.totalPlannedAmount))}</span>
  </div>
  ${signatureBlock(agreement)}`;

  return wrapDocumentHtml({
    title: `${agreement.searchKey} — ${titleBlock}`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}
