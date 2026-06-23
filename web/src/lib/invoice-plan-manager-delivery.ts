import { defaultInvoiceRecipient, planManagementForClient } from "@/lib/billing-plan-type";
import type { BusinessPartnerRecord } from "@/lib/business-partner";
import type { ClientRecord } from "@/lib/client";
import type { InvoiceRecord } from "@/lib/invoice";
import type { OrganizationRecord } from "@/lib/organization";
import { organizationDisplayName } from "@/lib/organization";

export type InvoiceDeliveryHandoff = {
  recipientName: string;
  recipientEmail: string;
  deliveryMethod: string;
  planManagerPartnerId: string;
  planManagerName: string;
  instructions: string[];
  mailtoUrl: string | null;
  printPdfSteps: string[];
};

function encodeMailtoSubject(subject: string): string {
  return encodeURIComponent(subject);
}

function encodeMailtoBody(body: string): string {
  return encodeURIComponent(body);
}

/** In-system handoff for plan-managed invoice delivery (registry + print/PDF — no outbound SMTP). */
export function buildInvoiceDeliveryHandoff(params: {
  invoice: InvoiceRecord;
  client: ClientRecord | undefined;
  businessPartners: BusinessPartnerRecord[];
  organization: OrganizationRecord;
  registryDocumentNo?: string;
}): InvoiceDeliveryHandoff {
  const { invoice, client, businessPartners, organization, registryDocumentNo } = params;
  const planType = client ? planManagementForClient(client) : "Plan managed";
  const billing = defaultInvoiceRecipient(client, planType, businessPartners);

  const recipientName = invoice.invoiceTo?.trim() || billing.invoiceTo || "Plan manager";
  const recipientEmail = invoice.invoiceToEmail?.trim() || billing.invoiceToEmail || "";
  const planManager = businessPartners.find((bp) => bp.id === client?.planManagerPartnerId);

  const orgName = organizationDisplayName(organization);
  const subject = `${orgName} — Invoice ${invoice.documentNo}`;
  const bodyLines = [
    `Please find invoice ${invoice.documentNo} for ${client?.preferredName || client?.name || "participant"}.`,
    `Period: ${invoice.periodStart} to ${invoice.periodEnd}.`,
    `Amount: $${invoice.totalAmount.toFixed(2)}.`,
    registryDocumentNo
      ? `Document registry reference: ${registryDocumentNo}. Open the registry in AbilityVua to view or print the HTML invoice and save as PDF from your browser.`
      : "Issue the invoice in AbilityVua first to save a copy to the document registry, then print or save as PDF.",
    "",
    `${orgName}`,
  ];

  const mailtoUrl = recipientEmail
    ? `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeMailtoSubject(subject)}&body=${encodeMailtoBody(bodyLines.join("\n"))}`
    : null;

  const instructions = [
    "Send via Email saves HTML and PDF to the document registry and marks the invoice Sent.",
    recipientEmail
      ? `Hand off to ${recipientName} at ${recipientEmail} using your organisation's secure email or portal.`
      : "Add an invoice recipient email on the client Billing and communication tab or on this invoice.",
    registryDocumentNo
      ? `Registry reference ${registryDocumentNo} — open System → Document registry to view the file.`
      : "Click Send via Email to register the document before handoff.",
  ];

  const printPdfSteps = [
    "Open Print invoice or Download HTML on this record.",
    "In the browser print dialog, choose Save as PDF (or Microsoft Print to PDF on Windows).",
    "Attach the PDF to your plan manager email or upload to their portal.",
    "Record the handoff in your external email archive if required by policy.",
  ];

  return {
    recipientName,
    recipientEmail,
    deliveryMethod: client?.invoiceDeliveryMethod?.trim() || "Email",
    planManagerPartnerId: client?.planManagerPartnerId ?? "",
    planManagerName: planManager?.name?.trim() || planManager?.searchKey || "",
    instructions,
    mailtoUrl,
    printPdfSteps,
  };
}
