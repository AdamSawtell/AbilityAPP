import { NextResponse } from "next/server";
import {
  setAgencyPortalSessionCookie,
  verifyAgencyPortalMagicToken,
} from "@/lib/agency-portal/session.server";
import { loadAgencyPortalVendorSummary } from "@/lib/agency-portal/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const payload = verifyAgencyPortalMagicToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/agency-portal/login?error=invalid", request.url));
  }

  const vendor = await loadAgencyPortalVendorSummary(payload.vendorBpId);
  if (!vendor) {
    return NextResponse.redirect(new URL("/agency-portal/login?error=invalid", request.url));
  }

  const tokenEmail = payload.email.trim().toLowerCase();
  const vendorEmail = vendor.email.trim().toLowerCase();
  if (!vendorEmail || tokenEmail !== vendorEmail) {
    return NextResponse.redirect(new URL("/agency-portal/login?error=invalid", request.url));
  }

  await setAgencyPortalSessionCookie({
    vendorBpId: vendor.id,
    email: vendorEmail,
    displayName: vendor.name,
  });

  return NextResponse.redirect(new URL("/agency-portal", request.url));
}
