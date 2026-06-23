import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionCanRunProcess } from "@/lib/auth/session.server";
import type { DocumentClass } from "@/lib/document-template";
import { buildMailtoUrl, renderDocumentEmailTemplate } from "@/lib/document-email-template";
import { loadDocumentEmailTemplate, registerAndSendDocument } from "@/lib/document-send.server";
import { htmlToPdfBuffer } from "@/lib/document-pdf.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

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
    const pdfBytes = await htmlToPdfBuffer(body.html);
    return NextResponse.json({
      ok: true,
      localOnly: true,
      message: "Invoice prepared locally. Connect Supabase to persist in the document registry.",
      pdfBase64: pdfBytes.toString("base64"),
      attachmentFileName: body.pdfFileName?.trim() || body.fileName?.replace(/\.html$/i, ".pdf") || "invoice.pdf",
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
      message: "Invoice saved with PDF. Your email app should open with the attachment.",
      documentNo: result.documentNo,
      registryId: result.registryId,
      pdfDocumentNo: result.pdfDocumentNo,
      pdfRegistryId: result.pdfRegistryId,
      pdfBase64: result.pdfBase64,
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
