import { NextResponse } from "next/server";
import { getNdisGatewayPublicStatus } from "@/lib/integrations/ndis-gateway";
import { getAuthSessionFromRequest, sessionCanWriteWindow } from "@/lib/auth/session.server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanWriteWindow(session, "claims")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(getNdisGatewayPublicStatus());
}
