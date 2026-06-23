import type { ClientRecord } from "@/lib/client";
import type { OrganizationRecord } from "@/lib/organization";
import { organizationDisplayName } from "@/lib/organization";
import type { SupportPlanRecord } from "@/lib/support-plan";

export type SupportPlanDeliveryHandoff = {
  recipientName: string;
  recipientEmail: string;
  deliveryMethod: string;
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

/** In-system handoff for support plan delivery (registry + print/PDF — no outbound SMTP). */
export function buildSupportPlanDeliveryHandoff(params: {
  client: ClientRecord;
  plan: SupportPlanRecord;
  organization: OrganizationRecord;
  registryDocumentNo?: string;
}): SupportPlanDeliveryHandoff {
  const { client, plan, organization, registryDocumentNo } = params;
  const recipientName = client.preferredName?.trim() || client.name?.trim() || client.searchKey;
  const recipientEmail = client.email?.trim() || "";
  const orgName = organizationDisplayName(organization);
  const subject = `${orgName} — Support plan ${plan.documentNo}`;
  const bodyLines = [
    `Please find the support plan (${plan.documentNo}) for ${recipientName}.`,
    ...(plan.description?.trim() ? [plan.description.trim()] : []),
    registryDocumentNo
      ? `Document registry reference: ${registryDocumentNo}. Open the registry in AbilityVua to view or print the HTML support plan and save as PDF from your browser.`
      : "Send the support plan in AbilityVua first to save a copy to the document registry, then print or save as PDF.",
    "",
    orgName,
  ];

  const mailtoUrl = recipientEmail
    ? `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeMailtoSubject(subject)}&body=${encodeMailtoBody(bodyLines.join("\n"))}`
    : null;

  const instructions = [
    "Send via Email saves HTML and PDF to the document registry.",
    recipientEmail
      ? `Hand off to ${recipientName} at ${recipientEmail} using your organisation's secure email.`
      : "Add an email address on the client Full profile tab before sending.",
    registryDocumentNo
      ? `Registry reference ${registryDocumentNo} — open System → Document registry to view the file.`
      : "Click Send via Email to register the document before handoff.",
  ];

  const printPdfSteps = [
    "Open Print support plan or Download PDF on this record.",
    "In the browser print dialog, choose Save as PDF (or Microsoft Print to PDF on Windows).",
    "Attach the PDF to your email to the participant or their representative.",
    "Record the handoff in your external email archive if required by policy.",
  ];

  return {
    recipientName,
    recipientEmail,
    deliveryMethod: client.statementDeliveryMethod?.trim() || client.preferredCommunicationMethod?.trim() || "Email",
    instructions,
    mailtoUrl,
    printPdfSteps,
  };
}
