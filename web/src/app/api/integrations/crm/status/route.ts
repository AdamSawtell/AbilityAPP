import { NextResponse } from "next/server";
import { getCrmPublicStatus } from "@/lib/integrations/hubspot-crm";
import { getAuthSessionFromRequest, sessionCanWriteWindow } from "@/lib/auth/session.server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanWriteWindow(session, "enquiries")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(getCrmPublicStatus());
}
