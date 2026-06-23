import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionCanRunProcess } from "@/lib/auth/session.server";
import type { DocumentClass } from "@/lib/document-template";
import { buildMailtoUrl, renderDocumentEmailTemplate } from "@/lib/document-email-template";
import { loadDocumentEmailTemplate, registerAndSendDocument } from "@/lib/document-send.server";
import { htmlToPdfBuffer } from "@/lib/document-pdf.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const maxDuration = 120;

type IssueInvoiceBody = {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  pdfFileName?: string;
  recipientEmail?: string;
  recipientName?: string;
  emailPlaceholders?: Record<string, string>;
};

function issueSuccessMessage(hasPdf: boolean, pdfWarning?: string): string {
  if (hasPdf) return "Invoice saved with PDF. Your email app should open with the attachment.";
  if (pdfWarning) {
    return `Invoice saved to the registry. PDF could not be generated (${pdfWarning}). Open email draft and attach from Print → PDF.`;
  }
  return "Invoice saved to the document registry.";
}

/** Issue an invoice: registry HTML + PDF, email handoff payload. */
export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionCanRunProcess(session, "send-invoice")) {
    return NextResponse.json({ error: "You do not have permission to issue invoices." }, { status: 403 });
  }

  let body: IssueInvoiceBody;
  try {
    body = (await request.json()) as IssueInvoiceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.html?.trim() || !body.templateId?.trim() || !body.entityId?.trim()) {
    return NextResponse.json({ error: "html, templateId, and entityId are required" }, { status: 400 });
  }

  const placeholders = body.emailPlaceholders ?? {};
  const emailTemplate = await loadDocumentEmailTemplate("send-invoice");
  if (!emailTemplate) {
    return NextResponse.json({ error: "No email template configured for issue invoice." }, { status: 500 });
  }
  const { subject, body: emailBody } = renderDocumentEmailTemplate(emailTemplate, placeholders);
  const recipientEmail = body.recipientEmail?.trim() || placeholders.recipientEmail?.trim() || "";
  const recipientName = body.recipientName?.trim() || placeholders.recipientName?.trim() || "";
  const mailtoUrl = buildMailtoUrl(recipientEmail, subject, emailBody);

  if (!isSupabaseConfigured()) {
    let pdfBase64: string | undefined;
    let pdfWarning: string | undefined;
    try {
      pdfBase64 = (await htmlToPdfBuffer(body.html)).toString("base64");
    } catch (err) {
      pdfWarning = err instanceof Error ? err.message : "PDF generation failed";
    }
    return NextResponse.json({
      ok: true,
      localOnly: true,
      message: issueSuccessMessage(Boolean(pdfBase64), pdfWarning),
      pdfBase64,
      pdfWarning,
      attachmentFileName: pdfBase64
        ? body.pdfFileName?.trim() || body.fileName?.replace(/\.html$/i, ".pdf") || "invoice.pdf"
        : undefined,
      mailtoUrl,
      subject,
      body: emailBody,
      recipientEmail,
      recipientName,
    });
  }

  try {
    const result = await registerAndSendDocument({
      processId: "send-invoice",
      html: body.html,
      templateId: body.templateId,
      documentClass: body.documentClass,
      entityType: "invoice",
      entityId: body.entityId,
      entityLabel: body.entityLabel,
      htmlFileName: body.fileName,
      pdfFileName: body.pdfFileName,
      recipientEmail,
      recipientName,
      emailPlaceholders: placeholders,
      generatedBy: session.displayName,
    });

    return NextResponse.json({
      ok: true,
      message: issueSuccessMessage(Boolean(result.pdfBase64), result.pdfWarning),
      documentNo: result.documentNo,
      registryId: result.registryId,
      pdfDocumentNo: result.pdfDocumentNo,
      pdfRegistryId: result.pdfRegistryId,
      pdfBase64: result.pdfBase64,
      pdfWarning: result.pdfWarning,
      attachmentFileName: result.attachmentFileName,
      mailtoUrl: result.mailtoUrl,
      subject: result.subject,
      body: result.body,
      recipientEmail: result.recipientEmail,
      recipientName: result.recipientName,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not issue the invoice." },
      { status: 500 }
    );
  }
}
