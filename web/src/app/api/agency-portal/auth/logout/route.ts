import { NextResponse } from "next/server";
import { clearAgencyPortalSessionCookie } from "@/lib/agency-portal/session.server";

export async function POST() {
  await clearAgencyPortalSessionCookie();
  return NextResponse.json({ ok: true });
}
