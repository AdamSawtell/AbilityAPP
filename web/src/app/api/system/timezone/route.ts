import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { resolveSystemOperatorAccess } from "@/lib/system/request-access.server";
import { readSystemSessionFromCookies, buildSystemSession } from "@/lib/system/session.server";
import { getOrganizationTimezone, updateSystemSetting } from "@/lib/session-audit/server";
import { isValidTimezone, normalizeOrganizationTimezone } from "@/lib/system-timezone";

const CONFIGURE_HREF = "/system/settings/time-and-date";

export async function GET() {
  const workspaceSession = await getAuthSessionFromRequest();
  const systemToken = await readSystemSessionFromCookies();
  const systemSession = systemToken ? await buildSystemSession(systemToken.userId) : null;

  if (!workspaceSession && !systemSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timezone = await getOrganizationTimezone();
  const systemOp = await resolveSystemOperatorAccess();

  return NextResponse.json({
    timezone,
    canConfigure: systemOp.allowed,
    configureHref: CONFIGURE_HREF,
  });
}

export async function PATCH(request: Request) {
  const systemOp = await resolveSystemOperatorAccess();
  if (!systemOp.allowed) {
    return NextResponse.json(
      { error: "Sign in to System setup to change organisation timezone." },
      { status: 403 }
    );
  }

  let body: { timezone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const timezone = body.timezone?.trim() ?? "";
  if (!isValidTimezone(timezone)) {
    return NextResponse.json(
      { error: "Enter a valid IANA timezone (for example Australia/Adelaide)." },
      { status: 400 }
    );
  }

  await updateSystemSetting("timezone", timezone, systemOp.actorName || "System");

  return NextResponse.json({
    timezone: normalizeOrganizationTimezone(timezone),
    canConfigure: true,
    configureHref: CONFIGURE_HREF,
  });
}
