import type { AgreementDocumentContext } from "@/lib/document-render-agreement";
import type { ClientRecord } from "@/lib/client";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import type { InvoiceRecord } from "@/lib/invoice";
import type { OrganizationRecord } from "@/lib/organization";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";

export type InvoiceDocumentContext = {
  invoice: InvoiceRecord;
  client: ClientRecord | undefined;
  organization: OrganizationRecord;
};

export type DocumentRenderContext = InvoiceDocumentContext | AgreementDocumentContext;

export type DocumentValidationIssue = {
  severity: "error" | "warning";
  field: string;
  message: string;
};

export function validateInvoiceDocument(ctx: InvoiceDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  const { invoice, client, organization } = ctx;

  if (!organization.abn?.trim()) {
    issues.push({ severity: "error", field: "org.abn", message: "Organisation ABN is required on invoices." });
  }
  if (!invoice.documentNo?.trim()) {
    issues.push({ severity: "error", field: "invoice.documentNo", message: "Invoice number is required." });
  }
  if (!invoice.invoiceTo?.trim() && !client?.name?.trim()) {
    issues.push({ severity: "warning", field: "invoice.invoiceTo", message: "Bill-to name is missing." });
  }
  if (!client?.fundingBodyNumber?.trim()) {
    issues.push({ severity: "warning", field: "client.ndisNumber", message: "Participant NDIS number is missing." });
  }
  if (!invoice.lines.length) {
    issues.push({ severity: "error", field: "invoice.lines", message: "Invoice has no line items." });
  }
  for (const line of invoice.lines) {
    if (!line.ndisSupportItem?.trim()) {
      issues.push({
        severity: "error",
        field: `invoice_line.${line.lineNo}.ndisSupportItem`,
        message: `Line ${line.lineNo} is missing an NDIS support item code.`,
      });
    }
    if (!line.serviceDate?.trim()) {
      issues.push({
        severity: "error",
        field: `invoice_line.${line.lineNo}.serviceDate`,
        message: `Line ${line.lineNo} is missing a service date.`,
      });
    }
  }
  if (!organization.bankBsb?.trim() || !organization.bankAccount?.trim()) {
    issues.push({
      severity: "warning",
      field: "org.bank",
      message: "Bank BSB and account number are not set on the organisation profile.",
    });
  }
  return issues;
}

export function validateAgreementDocument(ctx: AgreementDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  const { agreement, client, organization } = ctx;

  if (!organization.abn?.trim()) {
    issues.push({ severity: "error", field: "org.abn", message: "Organisation ABN is required on agreements." });
  }
  if (!agreement.searchKey?.trim()) {
    issues.push({ severity: "error", field: "agreement.searchKey", message: "Agreement reference is required." });
  }
  if (!client?.name?.trim()) {
    issues.push({ severity: "warning", field: "client.name", message: "Participant name is missing." });
  }
  if (!agreement.lines.length) {
    issues.push({ severity: "warning", field: "agreement.lines", message: "Agreement has no schedule lines." });
  }
  if (!agreement.contractDate?.trim() || !agreement.finishDate?.trim()) {
    issues.push({
      severity: "warning",
      field: "agreement.dates",
      message: "Contract or finish date is missing.",
    });
  }
  return issues;
}

export function documentBlockedByValidation(issues: DocumentValidationIssue[]): string | null {
  const error = issues.find((i) => i.severity === "error");
  return error?.message ?? null;
}

export function validateDocumentContext(
  template: DocumentTemplateRecord,
  ctx: DocumentRenderContext
): DocumentValidationIssue[] {
  if (template.documentClass.startsWith("tax-invoice")) {
    return validateInvoiceDocument(ctx as InvoiceDocumentContext);
  }
  if (template.documentClass.startsWith("service-agreement")) {
    return validateAgreementDocument(ctx as AgreementDocumentContext);
  }
  return [];
}
