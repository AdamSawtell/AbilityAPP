import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionCanWriteWindow, sessionHasWindow } from "@/lib/auth/session.server";
import { readSystemSessionFromCookies } from "@/lib/system/session.server";
import {
  initialDocumentEmailTemplates,
  normalizeDocumentEmailTemplate,
  type DocumentEmailTemplateRecord,
} from "@/lib/document-email-template";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function rowToRecord(row: Record<string, unknown>): DocumentEmailTemplateRecord {
  return normalizeDocumentEmailTemplate({
    id: String(row.id),
    processId: String(row.process_id),
    label: String(row.label ?? ""),
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    active: Boolean(row.active),
    updatedBy: String(row.updated_by ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  });
}

function recordToRow(record: DocumentEmailTemplateRecord) {
  return {
    id: record.id,
    process_id: record.processId,
    label: record.label,
    subject: record.subject,
    body: record.body,
    active: record.active,
    updated_by: record.updatedBy,
    updated_at: record.updatedAt,
  };
}

async function canReadEmailTemplates() {
  if (await readSystemSessionFromCookies()) return true;
  const session = await getAuthSessionFromRequest();
  return session ? sessionHasWindow(session, "admin-document-email") : false;
}

async function canWriteEmailTemplates() {
  if (await readSystemSessionFromCookies()) return true;
  const session = await getAuthSessionFromRequest();
  return session ? sessionCanWriteWindow(session, "admin-document-email") : false;
}

export async function GET() {
  if (!(await canReadEmailTemplates())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ templates: initialDocumentEmailTemplates });
  }

  const supabase = serviceClient();
  const { data, error } = await supabase.from("app_document_email_template").select("*").order("label");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const merged = new Map(initialDocumentEmailTemplates.map((t) => [t.processId, t]));
  for (const row of data ?? []) {
    const record = rowToRecord(row as Record<string, unknown>);
    merged.set(record.processId, record);
  }
  return NextResponse.json({ templates: [...merged.values()] });
}

export async function PUT(request: Request) {
  if (!(await canWriteEmailTemplates())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const session = await getAuthSessionFromRequest();
  const systemSession = await readSystemSessionFromCookies();
  const actorName = session?.displayName || systemSession?.displayName || "System";

  let body: { template?: DocumentEmailTemplateRecord };
  try {
    body = (await request.json()) as { template?: DocumentEmailTemplateRecord };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.template?.processId?.trim()) {
    return NextResponse.json({ error: "template.processId is required" }, { status: 400 });
  }

  const record = normalizeDocumentEmailTemplate({
    ...body.template,
    updatedBy: actorName,
    updatedAt: new Date().toISOString(),
  });

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { error } = await supabase.from("app_document_email_template").upsert(recordToRow(record));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, template: record });
}
