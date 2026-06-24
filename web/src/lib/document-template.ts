/** Document templates — System-managed print and PDF layouts. */

import type { AuditStampable } from "@/lib/audit";

export type DocumentClass =
  | "tax-invoice-ndis"
  | "tax-invoice-ndis-gst"
  | "service-agreement"
  | "service-agreement-variation"
  | "hr-contract-casual"
  | "hr-contract-pt"
  | "hr-letter-offer"
  | "participant-statement"
  | "enquiry-letter"
  | "remittance-cover"
  | "board-report"
  | "claim-batch-summary"
  | "incident-notification-letter"
  | "audit-pack-report"
  | "consent-schedule"
  | "support-plan"
  | "hr-letter-separation";

export type DocumentTemplateBlockType =
  | "org-header"
  | "org-footer"
  | "title"
  | "parties"
  | "line-table"
  | "totals"
  | "payment"
  | "rich-text"
  | "signature"
  | "metadata";

export type DocumentTemplateBlockRecord = {
  id: string;
  templateId: string;
  blockType: DocumentTemplateBlockType;
  label: string;
  contentHtml: string;
  sortOrder: number;
  locked: boolean;
};

export type DocumentTemplateRecord = AuditStampable & {
  id: string;
  name: string;
  description: string;
  documentClass: DocumentClass;
  active: boolean;
  isDefault: boolean;
  titleText: string;
  footerText: string;
  blocks: DocumentTemplateBlockRecord[];
  createdBy: string;
  updatedBy: string;
};

export type ProcessDocumentBindingRecord = {
  id: string;
  processId: string;
  entityType: string;
  templateId: string;
  isDefault: boolean;
  allowUserOverride: boolean;
};

export type GeneratedDocumentRecord = AuditStampable & {
  id: string;
  documentNo: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel: string;
  batchId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  status: "draft" | "final" | "superseded";
  generatedBy: string;
  generatedAt: string;
};

export const DOCUMENT_CLASS_LABELS: Record<DocumentClass, string> = {
  "tax-invoice-ndis": "NDIS participant invoice",
  "tax-invoice-ndis-gst": "NDIS tax invoice (GST)",
  "service-agreement": "Service agreement",
  "service-agreement-variation": "Agreement variation",
  "hr-contract-casual": "Casual employment agreement",
  "hr-contract-pt": "Part-time employment agreement",
  "hr-letter-offer": "Offer of employment",
  "participant-statement": "Participant service statement",
  "enquiry-letter": "Enquiry acknowledgement",
  "remittance-cover": "Remittance cover sheet",
  "board-report": "Board report pack",
  "claim-batch-summary": "Claim batch summary",
  "incident-notification-letter": "Incident notification letter",
  "audit-pack-report": "NDIS audit pack report",
  "consent-schedule": "Consent and information sharing schedule",
  "support-plan": "Participant support plan",
  "hr-letter-separation": "Separation letter",
};

export const DEFAULT_INVOICE_TEMPLATE_ID = "dtax-invoice-ndis-v1";
export const DEFAULT_AGREEMENT_TEMPLATE_ID = "dagreement-ndis-v1";
export const DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID = "dagreement-variation-v1";
export const DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID = "dhr-contract-casual-v1";
export const DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID = "dhr-contract-pt-v1";
export const DEFAULT_HR_OFFER_TEMPLATE_ID = "dhr-letter-offer-v1";
export const DEFAULT_ENQUIRY_ACK_TEMPLATE_ID = "denquiry-ack-v1";
export const DEFAULT_REMITTANCE_COVER_TEMPLATE_ID = "dremittance-cover-v1";
export const DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID = "dparticipant-statement-v1";
export const DEFAULT_BOARD_REPORT_TEMPLATE_ID = "dboard-report-v1";
export const DEFAULT_CLAIM_BATCH_TEMPLATE_ID = "dclaim-batch-v1";
export const DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID = "dincident-notification-v1";
export const DEFAULT_AUDIT_PACK_TEMPLATE_ID = "daudit-pack-v1";
export const DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID = "dconsent-schedule-v1";
export const DEFAULT_SUPPORT_PLAN_TEMPLATE_ID = "dsupport-plan-v1";
export const DEFAULT_HR_SEPARATION_TEMPLATE_ID = "dhr-letter-separation-v1";

export const DOCUMENT_PRINT_PROCESSES = {
  printInvoice: "print-invoice",
  batchPrintInvoices: "batch-print-invoices",
  printServiceAgreement: "print-service-agreement",
  printAgreementVariation: "print-agreement-variation",
  printEmployeeContract: "print-employee-contract",
  printEmployeeOffer: "print-employee-offer",
  printEnquiryAcknowledgement: "print-enquiry-acknowledgement",
  printRemittanceCover: "print-remittance-cover",
  printParticipantStatement: "print-participant-statement",
  printBoardReport: "print-board-report",
  printClaimBatch: "print-claim-batch",
  printIncidentNotification: "print-incident-notification",
  printAuditPack: "print-audit-pack",
  printConsentSchedule: "print-consent-schedule",
  printSupportPlan: "print-support-plan",
  printEmployeeSeparation: "print-employee-separation",
  sendInvoice: "send-invoice",
  sendSupportPlan: "send-support-plan",
  sendAgencyShiftPack: "send-agency-shift-pack",
} as const;

export function defaultInvoiceTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_INVOICE_TEMPLATE_ID,
    name: "NDIS participant invoice",
    description: "Standard tax invoice layout for NDIS plan-managed and self-managed participants.",
    documentClass: "tax-invoice-ndis",
    active: true,
    isDefault: true,
    titleText: "Invoice",
    footerText: "",
    blocks: [
      { id: "dtblk-invoice-header", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-invoice-title", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Invoice", sortOrder: 2, locked: false },
      { id: "dtblk-invoice-parties", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "parties", label: "Bill to", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-invoice-lines", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "line-table", label: "Line items", contentHtml: "", sortOrder: 4, locked: true },
      { id: "dtblk-invoice-totals", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "totals", label: "Totals", contentHtml: "", sortOrder: 5, locked: true },
      { id: "dtblk-invoice-payment", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "payment", label: "Payment details", contentHtml: "", sortOrder: 6, locked: false },
      { id: "dtblk-invoice-footer", templateId: DEFAULT_INVOICE_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 7, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultAgreementTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_AGREEMENT_TEMPLATE_ID,
    name: "NDIS service agreement",
    description: "Printable service agreement with schedule of supports and signature block.",
    documentClass: "service-agreement",
    active: true,
    isDefault: true,
    titleText: "Service Agreement",
    footerText: "",
    blocks: [
      { id: "dtblk-agreement-header", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-agreement-title", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Service Agreement", sortOrder: 2, locked: false },
      { id: "dtblk-agreement-parties", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "parties", label: "Parties", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-agreement-meta", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "metadata", label: "Agreement details", contentHtml: "", sortOrder: 4, locked: false },
      { id: "dtblk-agreement-terms", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "rich-text", label: "Terms", contentHtml: "<p>This agreement sets out the supports the provider will deliver under the participant's NDIS plan.</p>", sortOrder: 5, locked: false },
      { id: "dtblk-agreement-lines", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "line-table", label: "Schedule of supports", contentHtml: "", sortOrder: 6, locked: true },
      { id: "dtblk-agreement-privacy", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "rich-text", label: "Privacy and consent", contentHtml: "<p>The participant consents to the collection and use of personal information as required to deliver NDIS supports.</p>", sortOrder: 7, locked: false },
      { id: "dtblk-agreement-signature", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "signature", label: "Signatures", contentHtml: "", sortOrder: 8, locked: true },
      { id: "dtblk-agreement-footer", templateId: DEFAULT_AGREEMENT_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 9, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultAgreementVariationTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID,
    name: "Agreement variation",
    description: "Variation to an existing NDIS service agreement.",
    documentClass: "service-agreement-variation",
    active: true,
    isDefault: false,
    titleText: "Agreement variation",
    footerText: "",
    blocks: [
      { id: "dtblk-variation-header", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-variation-title", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Agreement variation", sortOrder: 2, locked: false },
      { id: "dtblk-variation-parties", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "parties", label: "Parties", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-variation-meta", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "metadata", label: "Variation details", contentHtml: "", sortOrder: 4, locked: false },
      { id: "dtblk-variation-terms", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "rich-text", label: "Variation terms", contentHtml: "<p>This variation amends the existing service agreement between the parties.</p>", sortOrder: 5, locked: false },
      { id: "dtblk-variation-lines", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "line-table", label: "Revised schedule", contentHtml: "", sortOrder: 6, locked: true },
      { id: "dtblk-variation-signature", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "signature", label: "Signatures", contentHtml: "", sortOrder: 7, locked: true },
      { id: "dtblk-variation-footer", templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 8, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

function templateFallbackForClass(documentClass: DocumentClass): DocumentTemplateRecord {
  if (documentClass === "service-agreement-variation") return defaultAgreementVariationTemplate();
  if (documentClass.startsWith("service-agreement")) return defaultAgreementTemplate();
  if (documentClass === "hr-contract-pt") return defaultHrContractPtTemplate();
  if (documentClass.startsWith("hr-contract")) return defaultHrContractCasualTemplate();
  if (documentClass === "hr-letter-offer") return defaultHrOfferTemplate();
  if (documentClass === "enquiry-letter") return defaultEnquiryAckTemplate();
  if (documentClass === "remittance-cover") return defaultRemittanceCoverTemplate();
  if (documentClass === "participant-statement") return defaultParticipantStatementTemplate();
  if (documentClass === "board-report") return defaultBoardReportTemplate();
  if (documentClass === "claim-batch-summary") return defaultClaimBatchTemplate();
  if (documentClass === "incident-notification-letter") return defaultIncidentNotificationTemplate();
  if (documentClass === "audit-pack-report") return defaultAuditPackTemplate();
  if (documentClass === "consent-schedule") return defaultConsentScheduleTemplate();
  if (documentClass === "support-plan") return defaultSupportPlanTemplate();
  if (documentClass === "hr-letter-separation") return defaultHrSeparationTemplate();
  return defaultInvoiceTemplate();
}

export function defaultHrContractCasualTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID,
    name: "Casual employment agreement",
    description: "SCHADS-aware casual employment contract scaffold.",
    documentClass: "hr-contract-casual",
    active: true,
    isDefault: true,
    titleText: "Casual Employment Agreement",
    footerText: "",
    blocks: [
      { id: "dtblk-hr-casual-header", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-hr-casual-title", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Casual Employment Agreement", sortOrder: 2, locked: false },
      { id: "dtblk-hr-casual-parties", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "parties", label: "Parties", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-hr-casual-meta", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "metadata", label: "Employment details", contentHtml: "", sortOrder: 4, locked: false },
      { id: "dtblk-hr-casual-terms", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "rich-text", label: "Terms of employment", contentHtml: "<p>Casual employment terms apply under the National Employment Standards and applicable modern award.</p>", sortOrder: 5, locked: false },
      { id: "dtblk-hr-casual-signature", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "signature", label: "Signatures", contentHtml: "", sortOrder: 6, locked: true },
      { id: "dtblk-hr-casual-footer", templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 7, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultHrContractPtTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID,
    name: "Part-time employment agreement",
    description: "SCHADS-aware part-time employment contract scaffold.",
    documentClass: "hr-contract-pt",
    active: true,
    isDefault: false,
    titleText: "Part-time Employment Agreement",
    footerText: "",
    blocks: [
      { id: "dtblk-hr-pt-header", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-hr-pt-title", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Part-time Employment Agreement", sortOrder: 2, locked: false },
      { id: "dtblk-hr-pt-parties", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "parties", label: "Parties", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-hr-pt-meta", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "metadata", label: "Employment details", contentHtml: "", sortOrder: 4, locked: false },
      { id: "dtblk-hr-pt-terms", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "rich-text", label: "Terms of employment", contentHtml: "<p>Part-time employment terms apply under the National Employment Standards and applicable modern award.</p>", sortOrder: 5, locked: false },
      { id: "dtblk-hr-pt-signature", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "signature", label: "Signatures", contentHtml: "", sortOrder: 6, locked: true },
      { id: "dtblk-hr-pt-footer", templateId: DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 7, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultEnquiryAckTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID,
    name: "Enquiry acknowledgement",
    description: "Acknowledgement letter for new NDIS enquiries.",
    documentClass: "enquiry-letter",
    active: true,
    isDefault: true,
    titleText: "Enquiry acknowledgement",
    footerText: "",
    blocks: [
      { id: "dtblk-enquiry-header", templateId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-enquiry-title", templateId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Enquiry acknowledgement", sortOrder: 2, locked: false },
      { id: "dtblk-enquiry-parties", templateId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID, blockType: "parties", label: "Recipient", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-enquiry-body", templateId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID, blockType: "rich-text", label: "Acknowledgement", contentHtml: "<p>Thank you for contacting {{org.tradingName}}. We have received your enquiry and will respond within two business days.</p>", sortOrder: 4, locked: false },
      { id: "dtblk-enquiry-footer", templateId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 5, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultRemittanceCoverTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID,
    name: "Remittance advice cover",
    description: "Cover sheet listing invoices included in a remittance or month-end billing run.",
    documentClass: "remittance-cover",
    active: true,
    isDefault: true,
    titleText: "Remittance advice",
    footerText: "",
    blocks: [
      { id: "dtblk-remittance-header", templateId: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-remittance-title", templateId: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Remittance advice", sortOrder: 2, locked: false },
      { id: "dtblk-remittance-lines", templateId: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID, blockType: "line-table", label: "Invoice list", contentHtml: "", sortOrder: 3, locked: true },
      { id: "dtblk-remittance-footer", templateId: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 4, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultParticipantStatementTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID,
    name: "Participant service statement",
    description: "Summary of services and invoices for a participant over a period.",
    documentClass: "participant-statement",
    active: true,
    isDefault: true,
    titleText: "Participant service statement",
    footerText: "",
    blocks: [
      { id: "dtblk-statement-header", templateId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-statement-title", templateId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Participant service statement", sortOrder: 2, locked: false },
      { id: "dtblk-statement-parties", templateId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID, blockType: "parties", label: "Participant", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-statement-lines", templateId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID, blockType: "line-table", label: "Services summary", contentHtml: "", sortOrder: 4, locked: true },
      { id: "dtblk-statement-footer", templateId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 5, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultBoardReportTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_BOARD_REPORT_TEMPLATE_ID,
    name: "Board report pack",
    description: "Print wrapper for generated board report packs.",
    documentClass: "board-report",
    active: true,
    isDefault: true,
    titleText: "Board report",
    footerText: "",
    blocks: [
      { id: "dtblk-board-header", templateId: DEFAULT_BOARD_REPORT_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-board-title", templateId: DEFAULT_BOARD_REPORT_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Board report", sortOrder: 2, locked: false },
      { id: "dtblk-board-body", templateId: DEFAULT_BOARD_REPORT_TEMPLATE_ID, blockType: "rich-text", label: "Report body", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-board-footer", templateId: DEFAULT_BOARD_REPORT_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 4, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultHrOfferTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_HR_OFFER_TEMPLATE_ID,
    name: "Offer of employment",
    description: "Letter offering employment before the formal contract is signed.",
    documentClass: "hr-letter-offer",
    active: true,
    isDefault: true,
    titleText: "Offer of Employment",
    footerText: "",
    blocks: [
      { id: "dtblk-hr-offer-header", templateId: DEFAULT_HR_OFFER_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-hr-offer-title", templateId: DEFAULT_HR_OFFER_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Offer of Employment", sortOrder: 2, locked: false },
      { id: "dtblk-hr-offer-parties", templateId: DEFAULT_HR_OFFER_TEMPLATE_ID, blockType: "parties", label: "Recipient", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-hr-offer-meta", templateId: DEFAULT_HR_OFFER_TEMPLATE_ID, blockType: "metadata", label: "Offer details", contentHtml: "", sortOrder: 4, locked: false },
      { id: "dtblk-hr-offer-body", templateId: DEFAULT_HR_OFFER_TEMPLATE_ID, blockType: "rich-text", label: "Offer terms", contentHtml: "<p>We are pleased to offer you employment on the terms outlined below. This offer is subject to satisfactory checks and signing the formal employment agreement.</p>", sortOrder: 5, locked: false },
      { id: "dtblk-hr-offer-footer", templateId: DEFAULT_HR_OFFER_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 6, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultClaimBatchTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_CLAIM_BATCH_TEMPLATE_ID,
    name: "NDIS claim batch summary",
    description: "Cover sheet and line summary for an NDIS claim batch.",
    documentClass: "claim-batch-summary",
    active: true,
    isDefault: true,
    titleText: "Claim batch summary",
    footerText: "",
    blocks: [
      { id: "dtblk-claim-header", templateId: DEFAULT_CLAIM_BATCH_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-claim-title", templateId: DEFAULT_CLAIM_BATCH_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Claim batch summary", sortOrder: 2, locked: false },
      { id: "dtblk-claim-meta", templateId: DEFAULT_CLAIM_BATCH_TEMPLATE_ID, blockType: "metadata", label: "Batch details", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-claim-lines", templateId: DEFAULT_CLAIM_BATCH_TEMPLATE_ID, blockType: "line-table", label: "Claim lines", contentHtml: "", sortOrder: 4, locked: true },
      { id: "dtblk-claim-footer", templateId: DEFAULT_CLAIM_BATCH_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 5, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultIncidentNotificationTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID,
    name: "Incident notification letter",
    description: "Formal notification letter for incident stakeholders.",
    documentClass: "incident-notification-letter",
    active: true,
    isDefault: true,
    titleText: "Incident notification",
    footerText: "",
    blocks: [
      { id: "dtblk-incident-header", templateId: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-incident-title", templateId: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Incident notification", sortOrder: 2, locked: false },
      { id: "dtblk-incident-parties", templateId: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID, blockType: "parties", label: "Recipient", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-incident-body", templateId: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID, blockType: "rich-text", label: "Notification", contentHtml: "<p>This letter confirms notification regarding the incident referenced below.</p>", sortOrder: 4, locked: false },
      { id: "dtblk-incident-footer", templateId: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 5, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultAuditPackTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_AUDIT_PACK_TEMPLATE_ID,
    name: "NDIS audit pack report",
    description: "Printable compliance readiness report for an audit month.",
    documentClass: "audit-pack-report",
    active: true,
    isDefault: true,
    titleText: "NDIS audit pack",
    footerText: "",
    blocks: [
      { id: "dtblk-audit-header", templateId: DEFAULT_AUDIT_PACK_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-audit-title", templateId: DEFAULT_AUDIT_PACK_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "NDIS audit pack", sortOrder: 2, locked: false },
      { id: "dtblk-audit-body", templateId: DEFAULT_AUDIT_PACK_TEMPLATE_ID, blockType: "rich-text", label: "Readiness summary", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-audit-footer", templateId: DEFAULT_AUDIT_PACK_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 4, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultConsentScheduleTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID,
    name: "Consent and information sharing schedule",
    description: "Schedule of participant consents and information sharing permissions.",
    documentClass: "consent-schedule",
    active: true,
    isDefault: true,
    titleText: "Consent and information sharing schedule",
    footerText: "",
    blocks: [
      { id: "dtblk-consent-header", templateId: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-consent-title", templateId: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Consent and information sharing schedule", sortOrder: 2, locked: false },
      { id: "dtblk-consent-parties", templateId: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID, blockType: "parties", label: "Participant", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-consent-lines", templateId: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID, blockType: "line-table", label: "Consent lines", contentHtml: "", sortOrder: 4, locked: true },
      { id: "dtblk-consent-footer", templateId: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 5, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultSupportPlanTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID,
    name: "Participant support plan",
    description: "Printable NDIS support plan combining profile, plan tabs, goals, risks, and service schedule.",
    documentClass: "support-plan",
    active: true,
    isDefault: true,
    titleText: "Participant support plan",
    footerText: "",
    blocks: [
      { id: "dtblk-sp-header", templateId: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-sp-title", templateId: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Participant support plan", sortOrder: 2, locked: false },
      { id: "dtblk-sp-parties", templateId: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID, blockType: "parties", label: "Participant", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-sp-body", templateId: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID, blockType: "rich-text", label: "Support plan sections", contentHtml: "", sortOrder: 4, locked: true },
      { id: "dtblk-sp-footer", templateId: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 5, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function defaultHrSeparationTemplate(): DocumentTemplateRecord {
  return {
    id: DEFAULT_HR_SEPARATION_TEMPLATE_ID,
    name: "Separation letter",
    description: "Letter confirming employment separation and final obligations.",
    documentClass: "hr-letter-separation",
    active: true,
    isDefault: true,
    titleText: "Separation letter",
    footerText: "",
    blocks: [
      { id: "dtblk-hr-sep-header", templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID, blockType: "org-header", label: "Organisation header", contentHtml: "", sortOrder: 1, locked: true },
      { id: "dtblk-hr-sep-title", templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID, blockType: "title", label: "Document title", contentHtml: "Separation letter", sortOrder: 2, locked: false },
      { id: "dtblk-hr-sep-parties", templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID, blockType: "parties", label: "Recipient", contentHtml: "", sortOrder: 3, locked: false },
      { id: "dtblk-hr-sep-meta", templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID, blockType: "metadata", label: "Separation details", contentHtml: "", sortOrder: 4, locked: false },
      { id: "dtblk-hr-sep-body", templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID, blockType: "rich-text", label: "Separation terms", contentHtml: "<p>This letter confirms the end of your employment with {{org.tradingName}}.</p>", sortOrder: 5, locked: false },
      { id: "dtblk-hr-sep-footer", templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID, blockType: "org-footer", label: "Organisation footer", contentHtml: "", sortOrder: 6, locked: true },
    ],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export const initialDocumentTemplates: DocumentTemplateRecord[] = [
  defaultInvoiceTemplate(),
  defaultAgreementTemplate(),
  defaultAgreementVariationTemplate(),
  defaultHrContractCasualTemplate(),
  defaultHrContractPtTemplate(),
  defaultHrOfferTemplate(),
  defaultEnquiryAckTemplate(),
  defaultRemittanceCoverTemplate(),
  defaultParticipantStatementTemplate(),
  defaultBoardReportTemplate(),
  defaultClaimBatchTemplate(),
  defaultIncidentNotificationTemplate(),
  defaultAuditPackTemplate(),
  defaultConsentScheduleTemplate(),
  defaultSupportPlanTemplate(),
  defaultHrSeparationTemplate(),
];

export const initialProcessDocumentBindings: ProcessDocumentBindingRecord[] = [
  {
    id: "pdb-print-invoice",
    processId: "print-invoice",
    entityType: "invoice",
    templateId: DEFAULT_INVOICE_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-batch-print-invoices",
    processId: "batch-print-invoices",
    entityType: "invoice",
    templateId: DEFAULT_INVOICE_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-service-agreement",
    processId: "print-service-agreement",
    entityType: "service-agreement",
    templateId: DEFAULT_AGREEMENT_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-agreement-variation",
    processId: "print-agreement-variation",
    entityType: "service-agreement",
    templateId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-employee-contract",
    processId: "print-employee-contract",
    entityType: "employee",
    templateId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-employee-offer",
    processId: "print-employee-offer",
    entityType: "employee",
    templateId: DEFAULT_HR_OFFER_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-enquiry-ack",
    processId: "print-enquiry-acknowledgement",
    entityType: "enquiry",
    templateId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-remittance-cover",
    processId: "print-remittance-cover",
    entityType: "invoice",
    templateId: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-participant-statement",
    processId: "print-participant-statement",
    entityType: "client",
    templateId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-board-report",
    processId: "print-board-report",
    entityType: "board-report",
    templateId: DEFAULT_BOARD_REPORT_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-claim-batch",
    processId: "print-claim-batch",
    entityType: "claim",
    templateId: DEFAULT_CLAIM_BATCH_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-incident-notification",
    processId: "print-incident-notification",
    entityType: "incident",
    templateId: DEFAULT_INCIDENT_NOTIFICATION_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-audit-pack",
    processId: "print-audit-pack",
    entityType: "audit-pack",
    templateId: DEFAULT_AUDIT_PACK_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-consent-schedule",
    processId: "print-consent-schedule",
    entityType: "client",
    templateId: DEFAULT_CONSENT_SCHEDULE_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-support-plan",
    processId: "print-support-plan",
    entityType: "client",
    templateId: DEFAULT_SUPPORT_PLAN_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
  {
    id: "pdb-print-employee-separation",
    processId: "print-employee-separation",
    entityType: "employee",
    templateId: DEFAULT_HR_SEPARATION_TEMPLATE_ID,
    isDefault: true,
    allowUserOverride: true,
  },
];

export function normalizeDocumentTemplate(record: DocumentTemplateRecord): DocumentTemplateRecord {
  const fallback = templateFallbackForClass(record.documentClass ?? "tax-invoice-ndis");
  return {
    ...fallback,
    ...record,
    blocks: (record.blocks ?? fallback.blocks).map((block, index) => ({
      ...block,
      templateId: record.id,
      sortOrder: block.sortOrder || index + 1,
    })),
  };
}

export function resolveTemplateForProcess(
  bindings: ProcessDocumentBindingRecord[],
  templates: DocumentTemplateRecord[],
  processId: string,
  entityType: string,
  templateId?: string
): DocumentTemplateRecord | null {
  const active = templates.filter((t) => t.active);
  if (templateId?.trim()) {
    return active.find((t) => t.id === templateId.trim()) ?? null;
  }
  const binding = bindings.find(
    (b) => b.processId === processId && b.entityType === entityType && b.isDefault
  );
  if (binding) {
    const match = active.find((t) => t.id === binding.templateId);
    if (match) return match;
  }
  const classHint = documentClassHintForProcess(processId, entityType);
  if (classHint) {
    return active.find((t) => t.isDefault && t.documentClass.startsWith(classHint)) ?? active.find((t) => t.documentClass.startsWith(classHint)) ?? null;
  }
  return active.find((t) => t.isDefault && t.documentClass.startsWith("tax-invoice")) ?? active[0] ?? null;
}

function documentClassHintForProcess(processId: string, entityType: string): string {
  if (processId === DOCUMENT_PRINT_PROCESSES.printRemittanceCover) return "remittance-cover";
  if (processId === DOCUMENT_PRINT_PROCESSES.printEmployeeOffer) return "hr-letter-offer";
  if (processId === DOCUMENT_PRINT_PROCESSES.printEmployeeSeparation) return "hr-letter-separation";
  if (processId === DOCUMENT_PRINT_PROCESSES.printClaimBatch) return "claim-batch-summary";
  if (processId === DOCUMENT_PRINT_PROCESSES.printIncidentNotification) return "incident-notification-letter";
  if (processId === DOCUMENT_PRINT_PROCESSES.printAuditPack) return "audit-pack-report";
  if (processId === DOCUMENT_PRINT_PROCESSES.printConsentSchedule) return "consent-schedule";
  if (processId === DOCUMENT_PRINT_PROCESSES.printSupportPlan) return "support-plan";
  if (processId === DOCUMENT_PRINT_PROCESSES.printParticipantStatement) return "participant-statement";
  if (entityType === "service-agreement") return "service-agreement";
  if (entityType === "employee") return "hr-contract";
  if (entityType === "enquiry") return "enquiry-letter";
  if (entityType === "client") return "participant-statement";
  if (entityType === "board-report") return "board-report";
  if (entityType === "claim") return "claim-batch-summary";
  if (entityType === "incident") return "incident-notification-letter";
  if (entityType === "audit-pack") return "audit-pack-report";
  if (entityType === "invoice") return "tax-invoice";
  return "";
}

export function templatesForClass(
  templates: DocumentTemplateRecord[],
  documentClass: DocumentClass
): DocumentTemplateRecord[] {
  return templates.filter((t) => t.active && t.documentClass === documentClass);
}

export function templatesForProcess(
  templates: DocumentTemplateRecord[],
  bindings: ProcessDocumentBindingRecord[],
  processId: string,
  entityType: string
): DocumentTemplateRecord[] {
  const boundIds = new Set(
    bindings.filter((b) => b.processId === processId && b.entityType === entityType).map((b) => b.templateId)
  );
  if (!boundIds.size) {
    if (entityType === "service-agreement") {
      return templates.filter(
        (t) => t.active && (t.documentClass === "service-agreement" || t.documentClass === "service-agreement-variation")
      );
    }
    if (entityType === "employee") {
      if (processId === DOCUMENT_PRINT_PROCESSES.printEmployeeOffer) {
        return templates.filter((t) => t.active && t.documentClass === "hr-letter-offer");
      }
      if (processId === DOCUMENT_PRINT_PROCESSES.printEmployeeSeparation) {
        return templates.filter((t) => t.active && t.documentClass === "hr-letter-separation");
      }
      return templates.filter((t) => t.active && t.documentClass.startsWith("hr-contract"));
    }
    if (entityType === "enquiry") {
      return templates.filter((t) => t.active && t.documentClass === "enquiry-letter");
    }
    if (entityType === "client") {
      if (processId === DOCUMENT_PRINT_PROCESSES.printConsentSchedule) {
        return templates.filter((t) => t.active && t.documentClass === "consent-schedule");
      }
      if (processId === DOCUMENT_PRINT_PROCESSES.printSupportPlan) {
        return templates.filter((t) => t.active && t.documentClass === "support-plan");
      }
      return templates.filter((t) => t.active && t.documentClass === "participant-statement");
    }
    if (entityType === "board-report") {
      return templates.filter((t) => t.active && t.documentClass === "board-report");
    }
    if (entityType === "claim") {
      return templates.filter((t) => t.active && t.documentClass === "claim-batch-summary");
    }
    if (entityType === "incident") {
      return templates.filter((t) => t.active && t.documentClass === "incident-notification-letter");
    }
    if (entityType === "audit-pack") {
      return templates.filter((t) => t.active && t.documentClass === "audit-pack-report");
    }
    if (processId === DOCUMENT_PRINT_PROCESSES.printRemittanceCover) {
      return templates.filter((t) => t.active && t.documentClass === "remittance-cover");
    }
    return templates.filter((t) => t.active && t.documentClass.startsWith("tax-invoice"));
  }
  return templates.filter((t) => t.active && boundIds.has(t.id));
}

export function cloneDocumentTemplate(source: DocumentTemplateRecord, actor = "System operator"): DocumentTemplateRecord {
  const id = `dtpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return normalizeDocumentTemplate({
    ...source,
    id,
    name: `${source.name} (copy)`,
    isDefault: false,
    active: true,
    blocks: source.blocks.map((block, index) => ({
      ...block,
      id: `dtblk-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      templateId: id,
      sortOrder: index + 1,
    })),
    createdBy: actor,
    updatedBy: actor,
  });
}
