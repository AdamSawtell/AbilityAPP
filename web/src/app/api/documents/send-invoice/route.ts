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

type SendInvoiceBody = {
  html: string;
  templateId: string;
  documentClass: DocumentClass;
  entityId: string;
  entityLabel?: string;
  fileName?: string;
  recipientEmail?: string;
};

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!session.processIds.includes("send-invoice")) {
    return NextResponse.json({ error: "You do not have permission to send invoices." }, { status: 403 });
  }

  let body: SendInvoiceBody;
  try {
    body = (await request.json()) as SendInvoiceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.html?.trim() || !body.templateId?.trim() || !body.entityId?.trim()) {
    return NextResponse.json({ error: "html, templateId, and entityId are required" }, { status: 400 });
  }

  const recipientEmail = body.recipientEmail?.trim() ?? "";
  const generic = {
    ok: true as const,
    message: "If the recipient address is on file, the invoice will be delivered by email.",
    dryRun: process.env.NODE_ENV !== "production",
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ...generic,
      localOnly: true,
      recipientEmail: process.env.NODE_ENV !== "production" ? recipientEmail || undefined : undefined,
    });
  }

  const id = newLineId("docgen");
  const documentNo = `DOC-${Date.now().toString().slice(-8)}`;
  const fileName = body.fileName?.trim() || `${documentNo}.html`;
  const storagePath = `generated/invoice/${body.entityId}/${Date.now()}-${fileName}`;
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
    entityType: "invoice",
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

  if (process.env.NODE_ENV === "production") {
    console.info("[send-invoice] invoice queued for delivery", body.entityId, recipientEmail || "(no email on file)");
  } else {
    console.info("[send-invoice] dry run — would email invoice to", recipientEmail || "(no email on file)", body.entityId);
  }

  return NextResponse.json({
    ...generic,
    documentNo: record.documentNo,
    registryId: record.id,
    recipientEmail: process.env.NODE_ENV !== "production" ? recipientEmail || undefined : undefined,
  });
}
