import {
  formatOrganizationAddress,
  organizationDisplayName,
  type OrganizationRecord,
} from "@/lib/organization";

export function escapeDocumentHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function documentPrintStyles(): string {
  return `
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
  .doc-header {
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
  .provider p, .doc-meta p { margin: 0 0 4px; color: #475569; }
  .doc-meta {
    min-width: 240px;
    text-align: right;
  }
  .doc-meta h2 {
    margin: 0 0 10px;
    font-size: 24px;
    letter-spacing: 0.04em;
    color: #be185d;
  }
  .doc-footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    color: #475569;
    font-size: 11px;
  }
  .doc-footer p { margin: 0 0 6px; }
  @media print {
    body { padding: 12mm; }
  }
`;
}

export function buildOrgHeaderHtml(org: OrganizationRecord): string {
  const name = escapeDocumentHtml(organizationDisplayName(org));
  const address = escapeDocumentHtml(formatOrganizationAddress(org)).replace(/\n/g, "<br/>");
  const abn = org.abn?.trim() ? `<p>ABN ${escapeDocumentHtml(org.abn.trim())}</p>` : "";
  const ndis = org.ndisRegistrationNumber?.trim()
    ? `<p>NDIS registration ${escapeDocumentHtml(org.ndisRegistrationNumber.trim())}</p>`
    : "";
  const contact = [org.phone?.trim(), org.email?.trim()].filter(Boolean).map(escapeDocumentHtml);
  const contactLine = contact.length ? `<p>${contact.join(" · ")}</p>` : "";
  const logo = org.logoUrl?.trim()
    ? `<img src="${escapeDocumentHtml(org.logoUrl.trim())}" alt="" class="logo" />`
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

export function buildOrgFooterHtml(org: OrganizationRecord, footerOverride = ""): string {
  const footer =
    footerOverride?.trim() ||
    org.documentFooterText?.trim() ||
    `${organizationDisplayName(org)} · ABN ${org.abn?.trim() || "—"} · ${org.phone?.trim() || ""} · ${org.email?.trim() || ""}`.trim();

  return `<div class="doc-footer"><p>${escapeDocumentHtml(footer).replace(/\n/g, "<br/>")}</p></div>`;
}

export function buildPaymentDetailsHtml(org: OrganizationRecord, reference: string): string {
  const lines = [
    "<p>Please pay the total amount due by the due date shown above.</p>",
    `<p><span class="label">Reference</span> ${escapeDocumentHtml(reference)}</p>`,
  ];
  if (org.bankBsb?.trim() && org.bankAccount?.trim()) {
    lines.push(
      `<p><span class="label">BSB</span> ${escapeDocumentHtml(org.bankBsb.trim())}</p>`,
      `<p><span class="label">Account</span> ${escapeDocumentHtml(org.bankAccount.trim())}</p>`
    );
  }
  if (org.bankAccountName?.trim()) {
    lines.push(`<p><span class="label">Account name</span> ${escapeDocumentHtml(org.bankAccountName.trim())}</p>`);
  }
  if (org.remittanceEmail?.trim()) {
    lines.push(`<p><span class="label">Remittance</span> ${escapeDocumentHtml(org.remittanceEmail.trim())}</p>`);
  }
  if (org.email?.trim()) {
    lines.push(`<p><span class="label">Enquiries</span> ${escapeDocumentHtml(org.email.trim())}</p>`);
  }
  lines.push(`<p class="label">${org.gstRegistered ? "GST applies where shown." : "NDIS disability supports are generally GST-free."}</p>`);
  return lines.join("");
}

export function wrapDocumentHtml(options: {
  title: string;
  org: OrganizationRecord;
  headerMetaHtml: string;
  bodyHtml: string;
  footerOverride?: string;
  autoPrint?: boolean;
}): string {
  const { title, org, headerMetaHtml, bodyHtml, footerOverride, autoPrint = false } = options;
  return `<!DOCTYPE html>
<html lang="en-AU"><head>
<meta charset="utf-8"/>
<title>${escapeDocumentHtml(title)}</title>
<style>${documentPrintStyles()}</style>
</head><body>
  <div class="doc-header">
    ${buildOrgHeaderHtml(org)}
    ${headerMetaHtml}
  </div>
  ${bodyHtml}
  ${buildOrgFooterHtml(org, footerOverride)}
  ${autoPrint ? "<script>window.onload = () => { window.print(); };</script>" : ""}
</body></html>`;
}
