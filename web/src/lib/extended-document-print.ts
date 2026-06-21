import {
  DEFAULT_BOARD_REPORT_TEMPLATE_ID,
  DEFAULT_ENQUIRY_ACK_TEMPLATE_ID,
  DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID,
  DEFAULT_REMITTANCE_COVER_TEMPLATE_ID,
  defaultBoardReportTemplate,
  defaultEnquiryAckTemplate,
  defaultParticipantStatementTemplate,
  defaultRemittanceCoverTemplate,
  type DocumentTemplateRecord,
} from "@/lib/document-template";
import { renderDocument } from "@/lib/document-render";
import type {
  BoardReportDocumentContext,
  EnquiryDocumentContext,
  ParticipantStatementContext,
  RemittanceDocumentContext,
} from "@/lib/document-render-extended";

export type ExtendedDocumentContext =
  | EnquiryDocumentContext
  | RemittanceDocumentContext
  | ParticipantStatementContext
  | BoardReportDocumentContext;

function defaultTemplateForClass(documentClass: DocumentTemplateRecord["documentClass"]): DocumentTemplateRecord {
  if (documentClass === "enquiry-letter") return defaultEnquiryAckTemplate();
  if (documentClass === "remittance-cover") return defaultRemittanceCoverTemplate();
  if (documentClass === "participant-statement") return defaultParticipantStatementTemplate();
  return defaultBoardReportTemplate();
}

export function exportExtendedDocumentHtml(
  ctx: ExtendedDocumentContext,
  template?: DocumentTemplateRecord
): { html: string; templateId: string; documentClass: DocumentTemplateRecord["documentClass"] } | null {
  const resolved = template ?? defaultTemplateForClass(resolveExtendedClass(ctx));
  const result = renderDocument(resolved, ctx);
  if (result.blocked || !result.html) return null;
  return { html: result.html, templateId: resolved.id, documentClass: resolved.documentClass };
}

function resolveExtendedClass(ctx: ExtendedDocumentContext): DocumentTemplateRecord["documentClass"] {
  if ("enquiry" in ctx) return "enquiry-letter";
  if ("rows" in ctx) return "remittance-cover";
  if ("client" in ctx && "invoices" in ctx) return "participant-statement";
  return "board-report";
}

export function printExtendedDocument(ctx: ExtendedDocumentContext, template?: DocumentTemplateRecord): boolean {
  if (typeof window === "undefined") return false;
  try {
    const resolved = template ?? defaultTemplateForClass(resolveExtendedClass(ctx));
    const result = renderDocument(resolved, ctx, { autoPrint: true });
    if (result.blocked || !result.html) return false;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return false;
    win.document.write(result.html);
    win.document.close();
    return true;
  } catch {
    return false;
  }
}

export function defaultExtendedTemplateIds() {
  return {
    enquiry: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID,
    remittance: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID,
    participantStatement: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID,
    boardReport: DEFAULT_BOARD_REPORT_TEMPLATE_ID,
  };
}
