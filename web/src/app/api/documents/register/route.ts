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

type RegisterBody = {
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

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.html?.trim() || !body.templateId?.trim() || !body.entityType?.trim() || !body.entityId?.trim()) {
    return NextResponse.json({ error: "html, templateId, entityType, and entityId are required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, localOnly: true });
  }

  const id = newLineId("docgen");
  const documentNo = `DOC-${Date.now().toString().slice(-8)}`;
  const fileName = body.fileName?.trim() || `${documentNo}.html`;
  const storagePath = `generated/${body.entityType}/${body.entityId}/${Date.now()}-${fileName}`;
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
    entityType: body.entityType,
    entityId: body.entityId,
    entityLabel: body.entityLabel ?? "",
    batchId: body.batchId ?? "",
    storagePath,
    fileName,
    mimeType: "text/html",
    byteSize: bytes.byteLength,
    status: "final",
    generatedBy: session.displayName,
    generatedAt: new Date().toISOString(),
  };

  await saveGeneratedDocument(supabase, record);

  const { data: signed } = await supabase.storage.from("org-documents").createSignedUrl(storagePath, 3600);

  return NextResponse.json({ record, downloadUrl: signed?.signedUrl ?? null });
}
