import { NextResponse } from "next/server";
import { canAccessWindow } from "@/lib/access/catalog";
import { isDocumentProcess } from "@/lib/access/process-access";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { DOCUMENT_CLASS_LABELS } from "@/lib/document-template";
import { ENTITY_DOCUMENT_WINDOW } from "@/lib/record-document-help";
import { listProcessAudits } from "@/lib/process-audit/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { generatedDocumentFromRow } from "@/lib/supabase/document-mappers";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType")?.trim() ?? "";
  const entityId = url.searchParams.get("entityId")?.trim() ?? "";
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
  }

  const windowKey = ENTITY_DOCUMENT_WINDOW[entityType];
  if (windowKey && !canAccessWindow(session.windowKeys, windowKey)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ files: [], activity: [] });
  }

  const supabase = serviceClient();
  const { data: docRows, error: docError } = await supabase
    .from("app_generated_document")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("generated_at", { ascending: false })
    .limit(25);

  if (docError) return NextResponse.json({ error: docError.message }, { status: 500 });

  const files = (docRows ?? []).map((row) => {
    const doc = generatedDocumentFromRow(row);
    return {
      id: doc.id,
      documentNo: doc.documentNo,
      documentClass: doc.documentClass,
      documentLabel: DOCUMENT_CLASS_LABELS[doc.documentClass] ?? doc.documentClass,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      generatedAt: doc.generatedAt,
      generatedBy: doc.generatedBy,
    };
  });

  const { records } = await listProcessAudits({
    entityType,
    entityId,
    limit: 40,
  });

  const activity = records
    .filter((row) => isDocumentProcess(row.processId))
    .slice(0, 20)
    .map((row) => ({
      id: row.id,
      processId: row.processId,
      processLabel: row.processLabel,
      userName: row.userName,
      outcome: row.outcome,
      startedAt: row.startedAt,
      detail: row.detail,
    }));

  return NextResponse.json({ files, activity });
}
