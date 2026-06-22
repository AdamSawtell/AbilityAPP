import type { ClientRecord } from "@/lib/client";
import { buildPaymentDetailsHtml, escapeDocumentHtml, wrapDocumentHtml } from "@/lib/document-brand";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import { formatInvoicePeriod, type InvoiceRecord } from "@/lib/invoice";
import type { OrganizationRecord } from "@/lib/organization";

export type InvoiceDocumentContext = {
  invoice: InvoiceRecord;
  client: ClientRecord | undefined;
  organization: OrganizationRecord;
};

function formatPrintDate(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

function clientBillingAddress(client: ClientRecord | undefined): string {
  if (!client?.locations?.length) return "";
  const loc = client.locations.find((row) => row.invoiceAddress === "Yes") ?? client.locations[0];
  const lines = [
    loc.name?.trim() && loc.name !== "Primary" ? loc.name.trim() : "",
    loc.address1?.trim(),
    loc.address2?.trim(),
    [loc.city, loc.state, loc.postcode].filter((part) => part?.trim()).join(" "),
  ].filter(Boolean);
  return lines.join("\n");
}

function billToBlock(ctx: InvoiceDocumentContext): string {
  const { invoice, client } = ctx;
  const recipient = invoice.invoiceTo?.trim() || client?.name?.trim() || "—";
  const email = invoice.invoiceToEmail?.trim();
  const address = clientBillingAddress(client);
  const participant = client ? `${client.searchKey} — ${client.name}` : invoice.clientId || "—";
  const ndisNumber = client?.fundingBodyNumber?.trim();
  const planType = invoice.planManagementType?.trim();

  const lines = [
    `<p class="bill-name">${escapeDocumentHtml(recipient)}</p>`,
    email ? `<p>${escapeDocumentHtml(email)}</p>` : "",
    address
      ? `<p class="bill-address">${escapeDocumentHtml(address).replace(/\n/g, "<br/>")}</p>`
      : "",
    `<p><span class="label">Participant</span> ${escapeDocumentHtml(participant)}</p>`,
    ndisNumber ? `<p><span class="label">NDIS number</span> ${escapeDocumentHtml(ndisNumber)}</p>` : "",
    planType ? `<p><span class="label">Plan management</span> ${escapeDocumentHtml(planType)}</p>` : "",
  ].filter(Boolean);

  return `<div class="bill-to">${lines.join("")}</div>`;
}

function lineRows(invoice: InvoiceRecord): string {
  const sorted = [...invoice.lines].sort((a, b) => a.lineNo - b.lineNo);
  if (!sorted.length) {
    return `<tr><td colspan="7" class="empty">No line items on this invoice.</td></tr>`;
  }

  return sorted
    .map((line) => {
      const description = line.lineDescription?.trim() || line.supportCategory?.trim() || "—";
      return `<tr>
        <td class="num">${line.lineNo}</td>
        <td>${escapeDocumentHtml(formatPrintDate(line.serviceDate))}</td>
        <td class="mono">${escapeDocumentHtml(line.ndisSupportItem || "—")}</td>
        <td>${escapeDocumentHtml(description)}</td>
        <td class="num">${escapeDocumentHtml(formatQuantity(line.quantity))}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(line.unitPrice))}</td>
        <td class="num">${escapeDocumentHtml(formatMoney(line.lineAmount))}</td>
      </tr>`;
    })
    .join("");
}

function invoiceBodyStyles(): string {
  return `
  .grid-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
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
  .bill-name { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 6px !important; }
  .bill-to p { margin: 0 0 4px; }
  .label { color: #64748b; }
  table.lines {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  table.lines th, table.lines td {
    border: 1px solid #e2e8f0;
    padding: 8px 10px;
    vertical-align: top;
  }
  table.lines th {
    background: #f1f5f9;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #475569;
    text-align: left;
  }
  table.lines td.num { text-align: right; white-space: nowrap; }
  table.lines td.mono { font-family: ui-monospace, monospace; font-size: 11px; }
  table.lines td.empty { text-align: center; color: #64748b; padding: 20px; }
  .totals {
    margin-left: auto;
    width: min(100%, 320px);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
  }
  .totals-row:last-child { border-bottom: 0; }
  .totals-row.grand {
    background: #fdf2f8;
    font-size: 14px;
    font-weight: 700;
    color: #9d174d;
  }
  .footer-notes { margin-top: 16px; color: #475569; }
  .footer-notes p { margin: 0 0 8px; }
  .status {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    background: #f1f5f9;
    font-size: 11px;
    font-weight: 600;
    color: #334155;
  }
  .doc-meta .doc-no {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  @media print {
    .panel, .totals { break-inside: avoid; }
    table.lines tr { break-inside: avoid; }
  }
`;
}

export function buildInvoiceDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: InvoiceDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { invoice, organization } = ctx;
  const issueDate = invoice.sentAt?.trim()
    ? formatPrintDate(invoice.sentAt.slice(0, 10))
    : formatPrintDate(new Date().toISOString().slice(0, 10));
  const dueDate = formatPrintDate(invoice.dueDate);
  const period = formatInvoicePeriod(invoice);
  const notes = invoice.notes?.trim();
  const richTextBlocks = [...template.blocks]
    .filter((block) => block.blockType === "rich-text" && block.contentHtml.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const richTextHtml = richTextBlocks
    .map(
      (block) =>
        `<div class="footer-notes"><p><strong>${escapeDocumentHtml(block.label || "Notes")}</strong></p>${block.contentHtml}</div>`
    )
    .join("");
  const paymentRef = invoice.paymentReference?.trim() || invoice.documentNo;
  const paid = invoice.paidAmount > 0 ? formatMoney(invoice.paidAmount) : "";
  const balance =
    invoice.paidAmount > 0
      ? formatMoney(Math.max(0, invoice.totalAmount - invoice.paidAmount))
      : "";

  const titleBlock =
    template.titleText?.trim() ||
    (organization.gstRegistered ? "Tax Invoice" : "Invoice");
  const titleUpper = organization.gstRegistered ? "TAX INVOICE" : titleBlock.toUpperCase();

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml(titleUpper)}</h2>
    <p class="doc-no">${escapeDocumentHtml(invoice.documentNo)}</p>
    <p><span class="label">Issue date</span> ${escapeDocumentHtml(issueDate)}</p>
    <p><span class="label">Due date</span> ${escapeDocumentHtml(dueDate)}</p>
    <p><span class="label">Service period</span> ${escapeDocumentHtml(period)}</p>
    <span class="status">${escapeDocumentHtml(invoice.status)} · ${escapeDocumentHtml(invoice.paymentStatus)}</span>
  </div>`;

  const bodyHtml = `<style>${invoiceBodyStyles()}</style>
  <div class="grid-two">
    <div class="panel">
      <h3>Bill to</h3>
      ${billToBlock(ctx)}
    </div>
    <div class="panel">
      <h3>Payment</h3>
      ${buildPaymentDetailsHtml(organization, paymentRef)}
    </div>
  </div>

  <table class="lines">
    <thead>
      <tr>
        <th>#</th>
        <th>Service date</th>
        <th>NDIS item</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows(invoice)}
    </tbody>
  </table>

  <div class="totals">
    ${paid ? `<div class="totals-row"><span>Amount paid</span><span>${escapeDocumentHtml(paid)}</span></div>` : ""}
    ${balance ? `<div class="totals-row"><span>Balance due</span><span>${escapeDocumentHtml(balance)}</span></div>` : ""}
    <div class="totals-row grand">
      <span>Total ${balance ? "invoiced" : "due"}</span>
      <span>${escapeDocumentHtml(formatMoney(invoice.totalAmount))}</span>
    </div>
  </div>

  ${
    notes
      ? `<div class="footer-notes"><p><strong>Notes</strong></p><p>${escapeDocumentHtml(notes).replace(/\n/g, "<br/>")}</p></div>`
      : richTextHtml ||
        `<div class="footer-notes"><p>Thank you for your business.</p></div>`
  }`;

  return wrapDocumentHtml({
    title: `${invoice.documentNo} — ${titleBlock}`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}
