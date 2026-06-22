import type { AgreementDocumentContext } from "@/lib/document-render-agreement";
import type { EmployeeDocumentContext } from "@/lib/document-render-employee";
import type {
  BoardReportDocumentContext,
  EnquiryDocumentContext,
  ParticipantStatementContext,
  RemittanceDocumentContext,
} from "@/lib/document-render-extended";
import type {
  AuditPackDocumentContext,
  ClaimBatchDocumentContext,
  ConsentScheduleDocumentContext,
  IncidentNotificationDocumentContext,
} from "@/lib/document-render-phase2";
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

export type DocumentRenderContext =
  | InvoiceDocumentContext
  | AgreementDocumentContext
  | EmployeeDocumentContext
  | EnquiryDocumentContext
  | RemittanceDocumentContext
  | ParticipantStatementContext
  | BoardReportDocumentContext
  | ClaimBatchDocumentContext
  | IncidentNotificationDocumentContext
  | AuditPackDocumentContext
  | ConsentScheduleDocumentContext;

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

export function validateEmployeeDocument(ctx: EmployeeDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  const { employee, organization } = ctx;

  if (!organization.abn?.trim()) {
    issues.push({ severity: "error", field: "org.abn", message: "Organisation ABN is required on employment contracts." });
  }
  if (!employee.searchKey?.trim()) {
    issues.push({ severity: "error", field: "employee.searchKey", message: "Employee search key is required." });
  }
  if (!employee.firstName?.trim() && !employee.lastName?.trim()) {
    issues.push({ severity: "warning", field: "employee.name", message: "Employee name is incomplete." });
  }
  if (!employee.startDate?.trim()) {
    issues.push({ severity: "warning", field: "employee.startDate", message: "Commencement date is missing." });
  }
  if (!employee.jobTitle?.trim()) {
    issues.push({ severity: "warning", field: "employee.jobTitle", message: "Job title is missing." });
  }
  return issues;
}

export function validateEnquiryDocument(ctx: EnquiryDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.enquiry.documentNo?.trim()) {
    issues.push({ severity: "error", field: "enquiry.documentNo", message: "Enquiry reference is required." });
  }
  if (!ctx.organization.abn?.trim()) {
    issues.push({ severity: "warning", field: "org.abn", message: "Organisation ABN is not set." });
  }
  return issues;
}

export function validateRemittanceDocument(ctx: RemittanceDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.rows.length) {
    issues.push({ severity: "warning", field: "rows", message: "No invoices are included in this remittance period." });
  }
  return issues;
}

export function validateParticipantStatementDocument(ctx: ParticipantStatementContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.client.name?.trim()) {
    issues.push({ severity: "error", field: "client.name", message: "Participant name is required." });
  }
  if (!ctx.invoices.length) {
    issues.push({ severity: "warning", field: "invoices", message: "No invoices match the selected period." });
  }
  return issues;
}

export function validateBoardReportDocument(ctx: BoardReportDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.pack.title?.trim()) {
    issues.push({ severity: "error", field: "pack.title", message: "Board report title is required." });
  }
  return issues;
}

export function validateClaimBatchDocument(ctx: ClaimBatchDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.claim.documentNo?.trim()) {
    issues.push({ severity: "error", field: "claim.documentNo", message: "Claim batch number is required." });
  }
  if (!ctx.claim.lines.length) {
    issues.push({ severity: "warning", field: "claim.lines", message: "Claim batch has no lines." });
  }
  return issues;
}

export function validateIncidentNotificationDocument(ctx: IncidentNotificationDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.incident.documentNo?.trim()) {
    issues.push({ severity: "error", field: "incident.documentNo", message: "Incident reference is required." });
  }
  if (!ctx.organization.abn?.trim()) {
    issues.push({ severity: "warning", field: "org.abn", message: "Organisation ABN is not set." });
  }
  return issues;
}

export function validateAuditPackDocument(ctx: AuditPackDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.evaluation.auditMonth?.trim()) {
    issues.push({ severity: "error", field: "evaluation.auditMonth", message: "Audit month is required." });
  }
  return issues;
}

export function validateConsentScheduleDocument(ctx: ConsentScheduleDocumentContext): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!ctx.client.name?.trim()) {
    issues.push({ severity: "error", field: "client.name", message: "Participant name is required." });
  }
  if (!ctx.client.consents?.length) {
    issues.push({ severity: "warning", field: "client.consents", message: "No consent lines recorded for this participant." });
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
  if (template.documentClass.startsWith("hr-contract") || template.documentClass === "hr-letter-offer" || template.documentClass === "hr-letter-separation") {
    return validateEmployeeDocument(ctx as EmployeeDocumentContext);
  }
  if (template.documentClass === "enquiry-letter") {
    return validateEnquiryDocument(ctx as EnquiryDocumentContext);
  }
  if (template.documentClass === "remittance-cover") {
    return validateRemittanceDocument(ctx as RemittanceDocumentContext);
  }
  if (template.documentClass === "participant-statement") {
    return validateParticipantStatementDocument(ctx as ParticipantStatementContext);
  }
  if (template.documentClass === "board-report") {
    return validateBoardReportDocument(ctx as BoardReportDocumentContext);
  }
  if (template.documentClass === "claim-batch-summary") {
    return validateClaimBatchDocument(ctx as ClaimBatchDocumentContext);
  }
  if (template.documentClass === "incident-notification-letter") {
    return validateIncidentNotificationDocument(ctx as IncidentNotificationDocumentContext);
  }
  if (template.documentClass === "audit-pack-report") {
    return validateAuditPackDocument(ctx as AuditPackDocumentContext);
  }
  if (template.documentClass === "consent-schedule") {
    return validateConsentScheduleDocument(ctx as ConsentScheduleDocumentContext);
  }
  return [];
}
