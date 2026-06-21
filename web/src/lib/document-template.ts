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
  | "remittance-cover";

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
};

export const DEFAULT_INVOICE_TEMPLATE_ID = "dtax-invoice-ndis-v1";

export const DOCUMENT_PRINT_PROCESSES = {
  printInvoice: "print-invoice",
  batchPrintInvoices: "batch-print-invoices",
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

export const initialDocumentTemplates: DocumentTemplateRecord[] = [defaultInvoiceTemplate()];

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
];

export function normalizeDocumentTemplate(record: DocumentTemplateRecord): DocumentTemplateRecord {
  const fallback = defaultInvoiceTemplate();
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
    return templates.filter((t) => t.active && t.documentClass.startsWith("tax-invoice"));
  }
  return templates.filter((t) => t.active && boundIds.has(t.id));
}
