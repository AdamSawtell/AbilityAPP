import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionCanWriteWindow } from "@/lib/auth/session.server";
import { getKeypayPublicStatus } from "@/lib/integrations/keypay-payroll";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanWriteWindow(session, "timesheets")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(getKeypayPublicStatus());
}
