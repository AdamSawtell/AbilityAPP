import "server-only";

import { newLineId } from "@/lib/client-line-tables";
import {
  buildMailtoUrl,
  initialDocumentEmailTemplates,
  normalizeDocumentEmailTemplate,
  renderDocumentEmailTemplate,
  type DocumentEmailTemplateRecord,
} from "@/lib/document-email-template";
import { htmlToPdfBuffer } from "@/lib/document-pdf.server";
import type { DocumentClass, GeneratedDocumentRecord } from "@/lib/document-template";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { saveGeneratedDocument } from "@/lib/supabase/data-api";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function loadDocumentEmailTemplate(processId: string): Promise<DocumentEmailTemplateRecord | null> {
  const fallback = initialDocumentEmailTemplates.find((t) => t.processId === processId && t.active) ?? null;
  if (!isSupabaseConfigured()) return fallback;
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("app_document_email_template")
    .select("*")
    .eq("process_id", processId)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return fallback;
  return normalizeDocumentEmailTemplate({
    id: String(data.id),
    processId: String(data.process_id),
    label: String(data.label ?? ""),
    subject: String(data.subject ?? ""),
    body: String(data.body ?? ""),
    active: Boolean(data.active),
    updatedBy: String(data.updated_by ?? ""),
    updatedAt: String(data.updated_at ?? ""),
  });
}

export type SendDocumentInput = {
  processId: string;
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  htmlFileName?: string;
  pdfFileName?: string;
  recipientEmail?: string;
  recipientName?: string;
  emailPlaceholders?: Record<string, string>;
  generatedBy: string;
};

export type SendDocumentResult = {
  documentNo: string;
  registryId: string;
  pdfDocumentNo?: string;
  pdfRegistryId?: string;
  pdfBase64?: string;
  attachmentFileName?: string;
  pdfWarning?: string;
  mailtoUrl: string | null;
  subject: string;
  body: string;
  recipientEmail: string;
  recipientName: string;
};

async function persistRegistryFile(input: {
  htmlOrPdf: Buffer | Uint8Array;
  mimeType: string;
  fileName: string;
  storagePath: string;
  record: Omit<GeneratedDocumentRecord, "storagePath" | "fileName" | "mimeType" | "byteSize">;
}): Promise<GeneratedDocumentRecord> {
  const supabase = serviceClient();
  const bytes = input.htmlOrPdf;
  const { error: uploadError } = await supabase.storage
    .from("org-documents")
    .upload(input.storagePath, bytes, { contentType: input.mimeType, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const full: GeneratedDocumentRecord = {
    ...input.record,
    storagePath: input.storagePath,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: bytes.byteLength,
  };
  await saveGeneratedDocument(supabase, full);
  return full;
}

export async function registerAndSendDocument(input: SendDocumentInput): Promise<SendDocumentResult> {
  const emailTemplate = await loadDocumentEmailTemplate(input.processId);
  if (!emailTemplate) throw new Error("No email template configured for this send action.");

  const htmlDocumentNo = `DOC-${Date.now().toString().slice(-8)}`;
  const pdfDocumentNo = `DOC-${(Date.now() + 1).toString().slice(-8)}`;
  const placeholders: Record<string, string> = {
    ...(input.emailPlaceholders ?? {}),
    documentNo: htmlDocumentNo,
  };
  const { subject, body } = renderDocumentEmailTemplate(emailTemplate, placeholders);
  const recipientEmail = input.recipientEmail?.trim() || placeholders.recipientEmail?.trim() || "";
  const recipientName = input.recipientName?.trim() || placeholders.recipientName?.trim() || "";
  const mailtoUrl = buildMailtoUrl(recipientEmail, subject, body);

  const htmlBytes = new TextEncoder().encode(input.html);
  const htmlFileName = input.htmlFileName?.trim() || `${htmlDocumentNo}.html`;
  const pdfFileName = input.pdfFileName?.trim() || htmlFileName.replace(/\.html$/i, ".pdf");
  const basePath = `generated/${input.entityType}/${input.entityId}/${Date.now()}`;

  const htmlRecord = await persistRegistryFile({
    htmlOrPdf: htmlBytes,
    mimeType: "text/html;charset=utf-8",
    fileName: htmlFileName,
    storagePath: `${basePath}-${htmlFileName}`,
    record: {
      id: newLineId("docgen"),
      documentNo: htmlDocumentNo,
      templateId: input.templateId,
      documentClass: input.documentClass,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel ?? "",
      batchId: "",
      status: "final",
      generatedBy: input.generatedBy,
      generatedAt: new Date().toISOString(),
    },
  });

  let pdfBytes: Buffer | null = null;
  let pdfWarning: string | undefined;
  try {
    pdfBytes = await htmlToPdfBuffer(input.html);
  } catch (err) {
    pdfWarning =
      err instanceof Error
        ? err.message
        : "PDF generation failed — use Print or PDF on the record, then attach manually.";
  }

  let pdfRecord: GeneratedDocumentRecord | null = null;
  if (pdfBytes) {
    pdfRecord = await persistRegistryFile({
      htmlOrPdf: pdfBytes,
      mimeType: "application/pdf",
      fileName: pdfFileName,
      storagePath: `${basePath}-${pdfFileName}`,
      record: {
        id: newLineId("docgen"),
        documentNo: pdfDocumentNo,
        templateId: input.templateId,
        documentClass: input.documentClass,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? "",
        batchId: htmlRecord.id,
        status: "final",
        generatedBy: input.generatedBy,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  return {
    documentNo: htmlRecord.documentNo,
    registryId: htmlRecord.id,
    pdfDocumentNo: pdfRecord?.documentNo,
    pdfRegistryId: pdfRecord?.id,
    pdfBase64: pdfBytes?.toString("base64"),
    attachmentFileName: pdfBytes ? pdfFileName : undefined,
    pdfWarning,
    mailtoUrl,
    subject,
    body,
    recipientEmail,
    recipientName,
  };
}
