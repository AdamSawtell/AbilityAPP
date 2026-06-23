import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionCanRunProcess } from "@/lib/auth/session.server";
import type { DocumentClass } from "@/lib/document-template";
import { buildMailtoUrl, renderDocumentEmailTemplate } from "@/lib/document-email-template";
import { loadDocumentEmailTemplate, registerAndSendDocument } from "@/lib/document-send.server";
import { htmlToPdfBuffer } from "@/lib/document-pdf.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const maxDuration = 120;

type SendSupportPlanBody = {
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

function sendSuccessMessage(hasPdf: boolean, pdfWarning?: string): string {
  if (hasPdf) return "Support plan saved with PDF. Your email app should open with the attachment.";
  if (pdfWarning) {
    return `Support plan saved to the registry. PDF could not be generated (${pdfWarning}). Open email draft and attach from Print → PDF.`;
  }
  return "Support plan saved to the document registry.";
}

/** Send a support plan: registry HTML + PDF, email handoff payload. */
export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionCanRunProcess(session, "send-support-plan")) {
    return NextResponse.json({ error: "You do not have permission to send support plans." }, { status: 403 });
  }

  let body: SendSupportPlanBody;
  try {
    body = (await request.json()) as SendSupportPlanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.html?.trim() || !body.templateId?.trim() || !body.entityId?.trim()) {
    return NextResponse.json({ error: "html, templateId, and entityId are required" }, { status: 400 });
  }

  const placeholders = body.emailPlaceholders ?? {};
  const emailTemplate = await loadDocumentEmailTemplate("send-support-plan");
  if (!emailTemplate) {
    return NextResponse.json({ error: "No email template configured for send support plan." }, { status: 500 });
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
      message: sendSuccessMessage(Boolean(pdfBase64), pdfWarning),
      pdfBase64,
      pdfWarning,
      attachmentFileName: pdfBase64
        ? body.pdfFileName?.trim() || body.fileName?.replace(/\.html$/i, ".pdf") || "support-plan.pdf"
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
      processId: "send-support-plan",
      html: body.html,
      templateId: body.templateId,
      documentClass: body.documentClass,
      entityType: "client",
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
      message: sendSuccessMessage(Boolean(result.pdfBase64), result.pdfWarning),
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
      { error: err instanceof Error ? err.message : "Could not send the support plan." },
      { status: 500 }
    );
  }
}
