import { NextResponse } from "next/server";
import { requestPublicOrigin } from "@/lib/app-origin";
import { createAgencyPortalMagicToken } from "@/lib/agency-portal/session.server";
import { findAgencyPortalVendorByEmail } from "@/lib/agency-portal/server";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const vendor = await findAgencyPortalVendorByEmail(email);
  const generic = {
    ok: true as const,
    message: "If your email matches an agency vendor on file, use the sign-in link to continue.",
  };

  if (!vendor) return NextResponse.json(generic);

  const token = createAgencyPortalMagicToken(vendor.id, email);
  const origin = requestPublicOrigin(request);
  const signInLink = `${origin}/api/agency-portal/auth/verify?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV === "production") {
    console.info("[agency-portal] magic link requested for vendor", vendor.id);
  }

  const exposeDemoLink =
    process.env.NODE_ENV !== "production" ||
    process.env.AGENCY_PORTAL_DEMO_EXPOSE_LINK === "true" ||
    process.env.PORTAL_DEMO_EXPOSE_LINK === "true";

  return NextResponse.json({
    ...generic,
    signInLink: exposeDemoLink ? signInLink : undefined,
  });
}
