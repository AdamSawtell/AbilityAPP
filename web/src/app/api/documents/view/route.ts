import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const generatedId = new URL(request.url).searchParams.get("generatedId")?.trim();
  if (!generatedId) {
    return NextResponse.json({ error: "generatedId is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Document storage is not configured" }, { status: 503 });
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("app_generated_document")
    .select("storage_path, file_name, mime_type")
    .eq("id", generatedId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.storage_path) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data: signed, error: signError } = await supabase.storage
    .from("org-documents")
    .createSignedUrl(data.storage_path, 3600);

  if (signError) return NextResponse.json({ error: signError.message }, { status: 500 });

  return NextResponse.json({
    signedUrl: signed?.signedUrl ?? null,
    fileName: data.file_name,
    mimeType: data.mime_type,
  });
}
