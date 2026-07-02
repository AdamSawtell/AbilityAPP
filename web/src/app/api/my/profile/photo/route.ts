import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import {
  clearEmployeeProfilePhoto,
  saveEmployeeProfilePhoto,
} from "@/lib/my-workplace/employee-photo.server";
import { requireMyWorkplace } from "@/lib/my-workplace/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-profile");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Photo upload requires Supabase storage." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }

  try {
    const employee = await saveEmployeeProfilePhoto(serviceClient(), ctx, file);
    return NextResponse.json({ employee, pictureUrl: employee.pictureUrl ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-profile");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Photo upload requires Supabase storage." }, { status: 503 });
  }

  try {
    const employee = await clearEmployeeProfilePhoto(serviceClient(), ctx);
    return NextResponse.json({ employee, pictureUrl: "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not remove photo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
