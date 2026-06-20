import { NextResponse } from "next/server";
import { createPortalMagicToken } from "@/lib/portal/session.server";
import { findPortalClientByEmail } from "@/lib/portal/server";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const client = await findPortalClientByEmail(email);
  const generic = {
    ok: true as const,
    message: "If your email matches a participant on file, use the sign-in link to continue.",
  };

  if (!client) return NextResponse.json(generic);

  const token = createPortalMagicToken(client.id, email);
  const origin = new URL(request.url).origin;
  const signInLink = `${origin}/api/portal/auth/verify?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV === "production") {
    console.info("[portal] magic link requested for participant", client.id);
    // Outbound email provider not wired yet — ops can retrieve link from server logs until SES/Resend is configured.
  }

  return NextResponse.json({
    ...generic,
    signInLink: process.env.NODE_ENV !== "production" ? signInLink : undefined,
  });
}
