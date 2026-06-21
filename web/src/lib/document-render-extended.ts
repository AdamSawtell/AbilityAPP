import type { ClientRecord } from "@/lib/client";
import type { BoardReportPackRecord } from "@/lib/board-report-pack";
import { formatBoardReportPeriod, visibleBoardReportSections } from "@/lib/board-report-pack";
import { buildBoardReportPrintHtml } from "@/lib/board-report-print";
import { escapeDocumentHtml, wrapDocumentHtml } from "@/lib/document-brand";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import type { EnquiryRecord } from "@/lib/enquiry";
import { formatInvoicePeriod, type InvoiceRecord } from "@/lib/invoice";
import type { InvoiceReconcileRow } from "@/lib/invoice-reconciliation";
import { organizationDisplayName, type OrganizationRecord } from "@/lib/organization";

export type EnquiryDocumentContext = {
  enquiry: EnquiryRecord;
  organization: OrganizationRecord;
};

export type RemittanceDocumentContext = {
  rows: InvoiceReconcileRow[];
  periodLabel: string;
  organization: OrganizationRecord;
};

export type ParticipantStatementContext = {
  client: ClientRecord;
  invoices: InvoiceRecord[];
  periodLabel: string;
  organization: OrganizationRecord;
};

export type BoardReportDocumentContext = {
  pack: BoardReportPackRecord;
  organization: OrganizationRecord;
};

function mergeOrgTokens(html: string, org: OrganizationRecord): string {
  return html.replace(/\{\{org\.tradingName\}\}/g, escapeDocumentHtml(organizationDisplayName(org)));
}

function extendedStyles(): string {
  return `
  .panel { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; margin-bottom: 16px; }
  .rich-text p { margin: 0 0 8px; color: #334155; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.lines th, table.lines td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  table.lines th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; }
  table.lines td.num { text-align: right; white-space: nowrap; }
  .doc-meta .doc-no { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

export function buildEnquiryDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: EnquiryDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { enquiry, organization } = ctx;
  const recipient = `${enquiry.firstName} ${enquiry.lastName}`.trim() || enquiry.bpName || "—";
  const bodyBlock =
    template.blocks.find((b) => b.blockType === "rich-text")?.contentHtml ??
    "<p>Thank you for your enquiry. We will be in touch shortly.</p>";

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Enquiry acknowledgement").toUpperCase())}</h2>
    <p class="doc-no">${escapeDocumentHtml(enquiry.documentNo)}</p>
    <p><span class="label">Date received</span> ${escapeDocumentHtml(enquiry.dateReceived || "—")}</p>
  </div>`;

  const bodyHtml = `<style>${extendedStyles()}</style>
  <div class="panel">
    <p class="party-name">${escapeDocumentHtml(recipient)}</p>
    ${enquiry.email?.trim() ? `<p>${escapeDocumentHtml(enquiry.email.trim())}</p>` : ""}
    ${enquiry.phone?.trim() ? `<p>${escapeDocumentHtml(enquiry.phone.trim())}</p>` : ""}
  </div>
  <div class="rich-text">${mergeOrgTokens(bodyBlock, organization)}</div>
  ${enquiry.description?.trim() ? `<div class="panel"><strong>Enquiry summary</strong><p>${escapeDocumentHtml(enquiry.description).replace(/\n/g, "<br/>")}</p></div>` : ""}`;

  return wrapDocumentHtml({
    title: `${enquiry.documentNo} — Acknowledgement`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}

export function buildRemittanceDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: RemittanceDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { rows, periodLabel, organization } = ctx;
  const total = rows.reduce((sum, row) => sum + row.invoicedAmount, 0);
  const paid = rows.reduce((sum, row) => sum + row.paidAmount, 0);
  const outstanding = rows.reduce((sum, row) => sum + Math.max(0, row.invoicedAmount - row.paidAmount), 0);

  const lineRows = rows.length
    ? rows
        .map(
          (row) => `<tr>
        <td>${escapeDocumentHtml(row.documentNo)}</td>
        <td>${escapeDocumentHtml(row.periodStart)} – ${escapeDocumentHtml(row.periodEnd)}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(row.invoicedAmount))}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(row.paidAmount))}</td>
        <td>${escapeDocumentHtml(row.reconcileStatus)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="5">No invoices in this period.</td></tr>`;

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Remittance advice").toUpperCase())}</h2>
    <p><span class="label">Period</span> ${escapeDocumentHtml(periodLabel || "All periods")}</p>
    <p><span class="label">Invoice count</span> ${rows.length}</p>
  </div>`;

  const bodyHtml = `<style>${extendedStyles()}</style>
  <table class="lines">
    <thead><tr><th>Invoice</th><th>Period</th><th>Invoiced</th><th>Paid</th><th>Status</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="panel">
    <p><strong>Total invoiced</strong> ${escapeDocumentHtml(formatMoney(total))}</p>
    <p><strong>Total paid</strong> ${escapeDocumentHtml(formatMoney(paid))}</p>
    <p><strong>Outstanding</strong> ${escapeDocumentHtml(formatMoney(outstanding))}</p>
  </div>`;

  return wrapDocumentHtml({
    title: `Remittance — ${periodLabel || "All"}`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}

export function buildParticipantStatementHtml(
  template: DocumentTemplateRecord,
  ctx: ParticipantStatementContext,
  options?: { autoPrint?: boolean }
): string {
  const { client, invoices, periodLabel, organization } = ctx;
  const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const lineRows = invoices.length
    ? invoices
        .map(
          (inv) => `<tr>
        <td>${escapeDocumentHtml(inv.documentNo)}</td>
        <td>${escapeDocumentHtml(formatInvoicePeriod(inv))}</td>
        <td>${escapeDocumentHtml(inv.status)}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(inv.totalAmount))}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="4">No invoices for this period.</td></tr>`;

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Participant service statement").toUpperCase())}</h2>
    <p class="doc-no">${escapeDocumentHtml(client.searchKey)}</p>
    <p><span class="label">Period</span> ${escapeDocumentHtml(periodLabel || "All periods")}</p>
  </div>`;

  const bodyHtml = `<style>${extendedStyles()}</style>
  <div class="panel">
    <p class="party-name">${escapeDocumentHtml(client.name)}</p>
    ${client.fundingBodyNumber?.trim() ? `<p>NDIS number ${escapeDocumentHtml(client.fundingBodyNumber.trim())}</p>` : ""}
  </div>
  <table class="lines">
    <thead><tr><th>Invoice</th><th>Period</th><th>Status</th><th>Amount</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="panel"><p><strong>Total invoiced</strong> ${escapeDocumentHtml(formatMoney(total))}</p></div>`;

  return wrapDocumentHtml({
    title: `${client.searchKey} — Statement`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}

export function buildBoardReportDocumentHtml(
  _template: DocumentTemplateRecord,
  ctx: BoardReportDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const html = buildBoardReportPrintHtml(ctx);
  if (!options?.autoPrint) {
    return html.replace(
      "<script>window.onload = () => { window.print(); };</script>",
      ""
    );
  }
  return html;
}

/** Extract plain summary for registry when using board pack HTML directly. */
export function boardReportRegistryLabel(pack: BoardReportPackRecord): string {
  return `${pack.title} · ${formatBoardReportPeriod(pack.reportPeriod)}`;
}

export function boardReportSectionCount(pack: BoardReportPackRecord): number {
  return visibleBoardReportSections(pack).length;
}
