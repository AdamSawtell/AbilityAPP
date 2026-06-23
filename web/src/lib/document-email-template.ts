/** Primary button on record Documents sections for every outbound email handoff process. */
export const DOCUMENT_SEND_VIA_EMAIL_LABEL = "Send via Email";

export const DOCUMENT_EMAIL_SEND_PROCESS_IDS = ["send-support-plan", "send-invoice"] as const;

export type DocumentEmailSendProcessId = (typeof DOCUMENT_EMAIL_SEND_PROCESS_IDS)[number];

export type DocumentEmailTemplateRecord = {
  id: string;
  processId: string;
  label: string;
  subject: string;
  body: string;
  active: boolean;
  updatedBy: string;
  updatedAt: string;
};

export const DOCUMENT_EMAIL_TEMPLATE_PLACEHOLDERS = [
  "{{orgName}}",
  "{{recipientName}}",
  "{{recipientEmail}}",
  "{{documentNo}}",
  "{{entityLabel}}",
  "{{planDocumentNo}}",
  "{{invoiceDocumentNo}}",
  "{{periodStart}}",
  "{{periodEnd}}",
  "{{amount}}",
] as const;

export const initialDocumentEmailTemplates: DocumentEmailTemplateRecord[] = [
  {
    id: "email-send-support-plan",
    processId: "send-support-plan",
    label: "Support plan email",
    subject: "{{orgName}} — Support plan {{planDocumentNo}}",
    body: [
      "Dear {{recipientName}},",
      "",
      "Please find the support plan ({{planDocumentNo}}) attached.",
      "",
      "Document registry reference: {{documentNo}}.",
      "",
      "{{orgName}}",
    ].join("\n"),
    active: true,
    updatedBy: "System",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "email-send-invoice",
    processId: "send-invoice",
    label: "Invoice email",
    subject: "{{orgName}} — Invoice {{invoiceDocumentNo}}",
    body: [
      "Dear {{recipientName}},",
      "",
      "Please find invoice {{invoiceDocumentNo}} attached.",
      "Period: {{periodStart}} to {{periodEnd}}.",
      "Amount: {{amount}}.",
      "",
      "Document registry reference: {{documentNo}}.",
      "",
      "{{orgName}}",
    ].join("\n"),
    active: true,
    updatedBy: "System",
    updatedAt: new Date(0).toISOString(),
  },
];

export function normalizeDocumentEmailTemplate(
  record: DocumentEmailTemplateRecord
): DocumentEmailTemplateRecord {
  return {
    ...record,
    processId: record.processId.trim(),
    label: record.label.trim(),
    subject: record.subject.trim(),
    body: record.body.trim(),
  };
}

export function renderDocumentEmailTemplate(
  template: Pick<DocumentEmailTemplateRecord, "subject" | "body">,
  placeholders: Record<string, string>
): { subject: string; body: string } {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => placeholders[key]?.trim() ?? `{{${key}}}`);
  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}

export function buildMailtoUrl(recipientEmail: string, subject: string, body: string): string | null {
  const email = recipientEmail.trim();
  if (!email) return null;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
