import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { newLineId } from "@/lib/client-line-tables";
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

type SendSupportPlanBody = {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  recipientEmail?: string;
  recipientName?: string;
};

/** Send a support plan in-system: save HTML to the document registry (no outbound email). */
export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!session.processIds.includes("send-support-plan")) {
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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      message: "Support plan sent locally. Connect Supabase to persist in the document registry.",
      localOnly: true,
    });
  }

  const id = newLineId("docgen");
  const documentNo = `DOC-${Date.now().toString().slice(-8)}`;
  const fileName = body.fileName?.trim() || `${documentNo}.html`;
  const storagePath = `generated/support-plan/${body.entityId}/${Date.now()}-${fileName}`;
  const bytes = new TextEncoder().encode(body.html);
  const supabase = serviceClient();

  const { error: uploadError } = await supabase.storage
    .from("org-documents")
    .upload(storagePath, bytes, { contentType: "text/html;charset=utf-8", upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const record: GeneratedDocumentRecord = {
    id,
    documentNo,
    templateId: body.templateId,
    documentClass: body.documentClass,
    entityType: "client",
    entityId: body.entityId,
    entityLabel: body.entityLabel ?? "",
    batchId: "",
    storagePath,
    fileName,
    mimeType: "text/html",
    byteSize: bytes.byteLength,
    status: "final",
    generatedBy: session.displayName,
    generatedAt: new Date().toISOString(),
  };

  await saveGeneratedDocument(supabase, record);

  return NextResponse.json({
    ok: true,
    message: "Support plan saved to the document registry. Use Support plan delivery to save PDF and hand off.",
    documentNo: record.documentNo,
    registryId: record.id,
    recipientEmail: body.recipientEmail?.trim() || "",
    recipientName: body.recipientName?.trim() || "",
  });
}
