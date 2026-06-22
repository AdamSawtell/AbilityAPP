import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { htmlToPdfBuffer } from "@/lib/document-pdf.server";
import { newLineId } from "@/lib/client-line-tables";
import type { DocumentClass, GeneratedDocumentRecord } from "@/lib/document-template";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { saveGeneratedDocument } from "@/lib/supabase/data-api";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const maxDuration = 60;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

type RenderPdfBody = {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  batchId?: string;
};

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: RenderPdfBody;
  try {
    body = (await request.json()) as RenderPdfBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.html?.trim() || !body.templateId?.trim() || !body.entityType?.trim() || !body.entityId?.trim()) {
    return NextResponse.json({ error: "html, templateId, entityType, and entityId are required" }, { status: 400 });
  }

  let pdfBytes: Buffer;
  try {
    pdfBytes = await htmlToPdfBuffer(body.html);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json(
      {
        error: `Could not generate PDF on the server. Use Print invoice and Save as PDF, or Download HTML. (${message})`,
      },
      { status: 503 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      localOnly: true,
      pdfBase64: pdfBytes.toString("base64"),
    });
  }

  const id = newLineId("docgen");
  const documentNo = `DOC-${Date.now().toString().slice(-8)}`;
  const baseName = body.fileName?.trim().replace(/\.(html|pdf)$/i, "") || documentNo;
  const fileName = `${baseName}.pdf`;
  const storagePath = `generated/${body.entityType}/${body.entityId}/${Date.now()}-${fileName}`;
  const supabase = serviceClient();

  const { error: uploadError } = await supabase.storage
    .from("org-documents")
    .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const record: GeneratedDocumentRecord = {
    id,
    documentNo,
    templateId: body.templateId,
    documentClass: body.documentClass,
    entityType: body.entityType,
    entityId: body.entityId,
    entityLabel: body.entityLabel ?? "",
    batchId: body.batchId ?? "",
    storagePath,
    fileName,
    mimeType: "application/pdf",
    byteSize: pdfBytes.byteLength,
    status: "final",
    generatedBy: session.displayName,
    generatedAt: new Date().toISOString(),
  };

  await saveGeneratedDocument(supabase, record);

  const { data: signed } = await supabase.storage.from("org-documents").createSignedUrl(storagePath, 3600);

  return NextResponse.json({ record, downloadUrl: signed?.signedUrl ?? null });
}
