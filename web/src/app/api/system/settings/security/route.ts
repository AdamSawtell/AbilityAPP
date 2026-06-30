import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { invalidateIdleTimeoutCache } from "@/lib/auth/session.server";
import {
  defaultOrganization,
  normalizeIdleTimeoutMinutes,
  type OrganizationRecord,
} from "@/lib/organization";
import { resolveSystemOperatorAccess } from "@/lib/system/request-access.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchOrganization, saveOrganization } from "@/lib/supabase/organization-api";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function readOrganization(): Promise<OrganizationRecord> {
  if (!isSupabaseConfigured()) return defaultOrganization();
  const record = await fetchOrganization(serviceClient());
  return record ?? defaultOrganization();
}

function parseTimeout(value: unknown): number | null {
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 120) return null;
  return normalizeIdleTimeoutMinutes(minutes);
}

export async function GET() {
  const systemOp = await resolveSystemOperatorAccess();
  if (!systemOp.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const organization = await readOrganization();
  return NextResponse.json({
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(organization.idleTimeoutMinutes),
  });
}

export async function PATCH(request: Request) {
  const systemOp = await resolveSystemOperatorAccess();
  if (!systemOp.allowed) {
    return NextResponse.json(
      { error: "Sign in to System setup to change security settings." },
      { status: 403 }
    );
  }

  let body: { idleTimeoutMinutes?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idleTimeoutMinutes = parseTimeout(body.idleTimeoutMinutes);
  if (idleTimeoutMinutes == null) {
    return NextResponse.json({ error: "Idle timeout must be a whole number from 5 to 120." }, { status: 400 });
  }

  const organization = await readOrganization();
  const next = { ...organization, idleTimeoutMinutes, updatedBy: systemOp.actorName };
  if (isSupabaseConfigured()) {
    await saveOrganization(serviceClient(), next);
    invalidateIdleTimeoutCache();
  }
  return NextResponse.json({ idleTimeoutMinutes });
}
