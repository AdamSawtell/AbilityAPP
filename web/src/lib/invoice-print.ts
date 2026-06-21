import type { ClientRecord } from "@/lib/client";
import { formatInvoicePeriod, type InvoiceRecord } from "@/lib/invoice";
import {
  formatOrganizationAddress,
  organizationDisplayName,
  type OrganizationRecord,
} from "@/lib/organization";

export type InvoicePrintContext = {
  invoice: InvoiceRecord;
  client: ClientRecord | undefined;
  organization: OrganizationRecord;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  const loc =
    client.locations.find((row) => row.invoiceAddress === "Yes") ?? client.locations[0];
  const lines = [
    loc.name?.trim() && loc.name !== "Primary" ? loc.name.trim() : "",
    loc.address1?.trim(),
    loc.address2?.trim(),
    [loc.city, loc.state, loc.postcode].filter((part) => part?.trim()).join(" "),
  ].filter(Boolean);
  return lines.join("\n");
}

function providerBlock(org: OrganizationRecord): string {
  const name = escapeHtml(organizationDisplayName(org));
  const address = escapeHtml(formatOrganizationAddress(org)).replace(/\n/g, "<br/>");
  const abn = org.abn?.trim() ? `<p>ABN ${escapeHtml(org.abn.trim())}</p>` : "";
  const ndis = org.ndisRegistrationNumber?.trim()
    ? `<p>NDIS registration ${escapeHtml(org.ndisRegistrationNumber.trim())}</p>`
    : "";
  const contact = [org.phone?.trim(), org.email?.trim()].filter(Boolean).map(escapeHtml);
  const contactLine = contact.length ? `<p>${contact.join(" · ")}</p>` : "";
  const logo = org.logoUrl?.trim()
    ? `<img src="${escapeHtml(org.logoUrl.trim())}" alt="" class="logo" />`
    : "";

  return `<div class="provider">
    ${logo}
    <h1>${name}</h1>
    ${address ? `<p class="address">${address}</p>` : ""}
    ${abn}
    ${ndis}
    ${contactLine}
  </div>`;
}

function billToBlock(ctx: InvoicePrintContext): string {
  const { invoice, client } = ctx;
  const recipient = invoice.invoiceTo?.trim() || client?.name?.trim() || "—";
  const email = invoice.invoiceToEmail?.trim();
  const address = clientBillingAddress(client);
  const participant = client ? `${client.searchKey} — ${client.name}` : invoice.clientId || "—";
  const ndisNumber = client?.fundingBodyNumber?.trim();
  const planType = invoice.planManagementType?.trim();

  const lines = [
    `<p class="bill-name">${escapeHtml(recipient)}</p>`,
    email ? `<p>${escapeHtml(email)}</p>` : "",
    address
      ? `<p class="bill-address">${escapeHtml(address).replace(/\n/g, "<br/>")}</p>`
      : "",
    `<p><span class="label">Participant</span> ${escapeHtml(participant)}</p>`,
    ndisNumber ? `<p><span class="label">NDIS number</span> ${escapeHtml(ndisNumber)}</p>` : "",
    planType ? `<p><span class="label">Plan management</span> ${escapeHtml(planType)}</p>` : "",
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
        <td>${escapeHtml(formatPrintDate(line.serviceDate))}</td>
        <td class="mono">${escapeHtml(line.ndisSupportItem || "—")}</td>
        <td>${escapeHtml(description)}</td>
        <td class="num">${escapeHtml(formatQuantity(line.quantity))}</td>
        <td class="num">${escapeHtml(formatMoney(line.unitPrice))}</td>
        <td class="num">${escapeHtml(formatMoney(line.lineAmount))}</td>
      </tr>`;
    })
    .join("");
}

export function buildInvoicePrintHtml(ctx: InvoicePrintContext): string {
  const { invoice, organization } = ctx;
  const issueDate = invoice.sentAt?.trim()
    ? formatPrintDate(invoice.sentAt.slice(0, 10))
    : formatPrintDate(new Date().toISOString().slice(0, 10));
  const dueDate = formatPrintDate(invoice.dueDate);
  const period = formatInvoicePeriod(invoice);
  const notes = invoice.notes?.trim();
  const paymentRef = invoice.paymentReference?.trim();
  const paid = invoice.paidAmount > 0 ? formatMoney(invoice.paidAmount) : "";
  const balance =
    invoice.paidAmount > 0
      ? formatMoney(Math.max(0, invoice.totalAmount - invoice.paidAmount))
      : "";

  return `<!DOCTYPE html>
<html lang="en-AU"><head>
<meta charset="utf-8"/>
<title>${escapeHtml(invoice.documentNo)} — Tax invoice</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 12px;
    line-height: 1.45;
    color: #0f172a;
    margin: 0;
    padding: 24px;
    background: #fff;
  }
  .header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
  }
  .provider h1 {
    margin: 0 0 6px;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }
  .provider .logo {
    max-height: 48px;
    max-width: 180px;
    margin-bottom: 10px;
    object-fit: contain;
  }
  .provider p, .invoice-meta p { margin: 0 0 4px; color: #475569; }
  .invoice-meta {
    min-width: 240px;
    text-align: right;
  }
  .invoice-meta h2 {
    margin: 0 0 10px;
    font-size: 24px;
    letter-spacing: 0.04em;
    color: #be185d;
  }
  .invoice-meta .doc-no {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
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
  .footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    color: #475569;
  }
  .footer p { margin: 0 0 8px; }
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
  @media print {
    body { padding: 12mm; }
    .panel, .totals { break-inside: avoid; }
    table.lines { break-inside: auto; }
    table.lines tr { break-inside: avoid; }
  }
</style>
</head><body>
  <div class="header">
    ${providerBlock(organization)}
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p class="doc-no">${escapeHtml(invoice.documentNo)}</p>
      <p><span class="label">Issue date</span> ${escapeHtml(issueDate)}</p>
      <p><span class="label">Due date</span> ${escapeHtml(dueDate)}</p>
      <p><span class="label">Service period</span> ${escapeHtml(period)}</p>
      <span class="status">${escapeHtml(invoice.status)} · ${escapeHtml(invoice.paymentStatus)}</span>
    </div>
  </div>

  <div class="grid-two">
    <div class="panel">
      <h3>Bill to</h3>
      ${billToBlock(ctx)}
    </div>
    <div class="panel">
      <h3>Payment</h3>
      <p>Please pay the total amount due by the due date shown above.</p>
      ${
        paymentRef
          ? `<p><span class="label">Reference</span> ${escapeHtml(paymentRef)}</p>`
          : `<p><span class="label">Reference</span> ${escapeHtml(invoice.documentNo)}</p>`
      }
      ${organization.email?.trim() ? `<p><span class="label">Enquiries</span> ${escapeHtml(organization.email.trim())}</p>` : ""}
      <p class="label">NDIS disability supports are generally GST-free.</p>
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
    ${
      paid
        ? `<div class="totals-row"><span>Amount paid</span><span>${escapeHtml(paid)}</span></div>`
        : ""
    }
    ${
      balance
        ? `<div class="totals-row"><span>Balance due</span><span>${escapeHtml(balance)}</span></div>`
        : ""
    }
    <div class="totals-row grand">
      <span>Total ${balance ? "invoiced" : "due"}</span>
      <span>${escapeHtml(formatMoney(invoice.totalAmount))}</span>
    </div>
  </div>

  ${
    notes
      ? `<div class="footer"><p><strong>Notes</strong></p><p>${escapeHtml(notes).replace(/\n/g, "<br/>")}</p></div>`
      : `<div class="footer"><p>Thank you for your business.</p></div>`
  }

  <script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

export function printClientInvoice(ctx: InvoicePrintContext): boolean {
  if (typeof window === "undefined") return false;
  const html = buildInvoicePrintHtml(ctx);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
