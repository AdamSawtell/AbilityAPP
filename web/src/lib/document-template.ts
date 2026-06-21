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
  | "board-report";

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
};

export const DEFAULT_INVOICE_TEMPLATE_ID = "dtax-invoice-ndis-v1";
export const DEFAULT_AGREEMENT_TEMPLATE_ID = "dagreement-ndis-v1";
export const DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID = "dagreement-variation-v1";
export const DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID = "dhr-contract-casual-v1";
export const DEFAULT_HR_CONTRACT_PT_TEMPLATE_ID = "dhr-contract-pt-v1";
export const DEFAULT_ENQUIRY_ACK_TEMPLATE_ID = "denquiry-ack-v1";
export const DEFAULT_REMITTANCE_COVER_TEMPLATE_ID = "dremittance-cover-v1";
export const DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID = "dparticipant-statement-v1";
export const DEFAULT_BOARD_REPORT_TEMPLATE_ID = "dboard-report-v1";

export const DOCUMENT_PRINT_PROCESSES = {
  printInvoice: "print-invoice",
  batchPrintInvoices: "batch-print-invoices",
  printServiceAgreement: "print-service-agreement",
  printAgreementVariation: "print-agreement-variation",
  printEmployeeContract: "print-employee-contract",
  printEnquiryAcknowledgement: "print-enquiry-acknowledgement",
  printRemittanceCover: "print-remittance-cover",
  printParticipantStatement: "print-participant-statement",
  printBoardReport: "print-board-report",
  sendInvoice: "send-invoice",
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
  if (documentClass === "enquiry-letter") return defaultEnquiryAckTemplate();
  if (documentClass === "remittance-cover") return defaultRemittanceCoverTemplate();
  if (documentClass === "participant-statement") return defaultParticipantStatementTemplate();
  if (documentClass === "board-report") return defaultBoardReportTemplate();
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

export const initialDocumentTemplates: DocumentTemplateRecord[] = [
  defaultInvoiceTemplate(),
  defaultAgreementTemplate(),
  defaultAgreementVariationTemplate(),
  defaultHrContractCasualTemplate(),
  defaultHrContractPtTemplate(),
  defaultEnquiryAckTemplate(),
  defaultRemittanceCoverTemplate(),
  defaultParticipantStatementTemplate(),
  defaultBoardReportTemplate(),
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
  const classHint =
    processId === DOCUMENT_PRINT_PROCESSES.printRemittanceCover
      ? "remittance-cover"
      : entityType === "service-agreement"
        ? "service-agreement"
        : entityType === "employee"
          ? "hr-contract"
          : entityType === "enquiry"
            ? "enquiry-letter"
            : entityType === "client"
              ? "participant-statement"
              : entityType === "board-report"
                ? "board-report"
                : entityType === "invoice"
                  ? "tax-invoice"
                  : "";
  if (classHint) {
    return active.find((t) => t.isDefault && t.documentClass.startsWith(classHint)) ?? active.find((t) => t.documentClass.startsWith(classHint)) ?? null;
  }
  return active.find((t) => t.isDefault && t.documentClass.startsWith("tax-invoice")) ?? active[0] ?? null;
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
      return templates.filter((t) => t.active && t.documentClass.startsWith("hr-contract"));
    }
    if (entityType === "enquiry") {
      return templates.filter((t) => t.active && t.documentClass === "enquiry-letter");
    }
    if (entityType === "client") {
      return templates.filter((t) => t.active && t.documentClass === "participant-statement");
    }
    if (entityType === "board-report") {
      return templates.filter((t) => t.active && t.documentClass === "board-report");
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
