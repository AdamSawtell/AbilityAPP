import { NextResponse } from "next/server";
import {
  setPortalSessionCookie,
  verifyPortalMagicToken,
} from "@/lib/portal/session.server";
import { loadPortalClientSummary } from "@/lib/portal/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const payload = verifyPortalMagicToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", request.url));
  }

  const client = await loadPortalClientSummary(payload.clientId);
  if (!client) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", request.url));
  }

  const tokenEmail = payload.email.trim().toLowerCase();
  const clientEmail = client.email.trim().toLowerCase();
  if (!clientEmail || tokenEmail !== clientEmail) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", request.url));
  }

  await setPortalSessionCookie({
    clientId: client.id,
    email: clientEmail,
    displayName: client.preferredName || client.name,
  });

  return NextResponse.redirect(new URL("/portal", request.url));
}
