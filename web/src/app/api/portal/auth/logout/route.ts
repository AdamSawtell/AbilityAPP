import { NextResponse } from "next/server";
import { clearPortalSessionCookie } from "@/lib/portal/session.server";

export async function POST() {
  await clearPortalSessionCookie();
  return NextResponse.json({ ok: true });
}
