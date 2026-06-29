import { NextResponse } from "next/server";
import { resolveSystemOperatorAccess } from "@/lib/system/request-access.server";
import {
  DEFAULT_LEAVE_SELF_SERVICE_MINIMUM_HOURS,
  LEAVE_SELF_SERVICE_MINIMUM_HOURS_KEY,
  normalizeLeaveSelfServiceMinimumHours,
  parseLeaveSelfServiceMinimumHours,
} from "@/lib/leave-self-service-policy";
import { getSystemSettings, updateSystemSetting } from "@/lib/session-audit/server";

const CONFIGURE_HREF = "/system/settings/leave";

export async function GET() {
  const systemOp = await resolveSystemOperatorAccess();
  const settings = await getSystemSettings();
  const minimumHours = parseLeaveSelfServiceMinimumHours(settings[LEAVE_SELF_SERVICE_MINIMUM_HOURS_KEY]);

  return NextResponse.json({
    minimumHours,
    defaultMinimumHours: DEFAULT_LEAVE_SELF_SERVICE_MINIMUM_HOURS,
    canConfigure: systemOp.allowed,
    configureHref: CONFIGURE_HREF,
  });
}

export async function PATCH(request: Request) {
  const systemOp = await resolveSystemOperatorAccess();
  if (!systemOp.allowed) {
    return NextResponse.json(
      { error: "Sign in to System setup to change leave self-service settings." },
      { status: 403 }
    );
  }

  let body: { minimumHours?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.minimumHours == null || !Number.isFinite(body.minimumHours)) {
    return NextResponse.json({ error: "Enter a valid number of hours (0 or greater)." }, { status: 400 });
  }

  const minimumHours = normalizeLeaveSelfServiceMinimumHours(body.minimumHours);
  await updateSystemSetting(
    LEAVE_SELF_SERVICE_MINIMUM_HOURS_KEY,
    String(minimumHours),
    systemOp.actorName || "System"
  );

  return NextResponse.json({
    minimumHours,
    canConfigure: true,
    configureHref: CONFIGURE_HREF,
  });
}
