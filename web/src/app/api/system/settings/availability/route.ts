import { NextResponse } from "next/server";
import { resolveSystemOperatorAccess } from "@/lib/system/request-access.server";
import {
  AVAILABILITY_MAX_HOURS_KEY,
  AVAILABILITY_MAX_PERIOD_KEY,
  AVAILABILITY_OVER_MAX_APPROVAL_ROLE_KEY,
  AVAILABILITY_OVERNIGHT_HOURS_MODE_KEY,
  DEFAULT_AVAILABILITY_MAX_HOURS,
  DEFAULT_AVAILABILITY_MAX_PERIOD,
  DEFAULT_AVAILABILITY_OVER_MAX_APPROVAL_ROLE_ID,
  normalizeAvailabilityMaxHours,
  parseAvailabilityHoursPolicy,
  parseOvernightHoursMode,
  type AvailabilityHoursPolicy,
  type OvernightHoursMode,
} from "@/lib/availability-hours-policy";
import {
  getAvailabilityHoursPolicy,
  loadAppRolesForSettings,
} from "@/lib/availability-hours-policy.server";
import { normalizeContractedHoursPeriod } from "@/lib/contracted-hours";
import { getSystemSettings, updateSystemSetting } from "@/lib/session-audit/server";

const CONFIGURE_HREF = "/system/settings/availability";

export async function GET() {
  const systemOp = await resolveSystemOperatorAccess();
  const settings = await getSystemSettings();
  const policy = parseAvailabilityHoursPolicy(settings);
  const roles = await loadAppRolesForSettings();

  return NextResponse.json({
    settings: policy,
    defaults: {
      maxHoursPerPeriod: DEFAULT_AVAILABILITY_MAX_HOURS,
      maxHoursPeriod: DEFAULT_AVAILABILITY_MAX_PERIOD,
      overMaxApprovalRoleId: DEFAULT_AVAILABILITY_OVER_MAX_APPROVAL_ROLE_ID,
      overnightHoursMode: "include" as OvernightHoursMode,
    },
    roles,
    canConfigure: systemOp.allowed,
    configureHref: CONFIGURE_HREF,
  });
}

export async function PATCH(request: Request) {
  const systemOp = await resolveSystemOperatorAccess();
  if (!systemOp.allowed) {
    return NextResponse.json(
      { error: "Sign in to System setup to change availability hours settings." },
      { status: 403 }
    );
  }

  let body: Partial<AvailabilityHoursPolicy>;
  try {
    body = (await request.json()) as Partial<AvailabilityHoursPolicy>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actor = systemOp.actorName || "System";
  const updates: [string, string][] = [];

  if (body.maxHoursPerPeriod != null) {
    updates.push([
      AVAILABILITY_MAX_HOURS_KEY,
      String(normalizeAvailabilityMaxHours(body.maxHoursPerPeriod)),
    ]);
  }
  if (body.maxHoursPeriod != null) {
    updates.push([AVAILABILITY_MAX_PERIOD_KEY, normalizeContractedHoursPeriod(body.maxHoursPeriod)]);
  }
  if (body.overMaxApprovalRoleId != null) {
    const roleId = String(body.overMaxApprovalRoleId).trim();
    if (!roleId) {
      return NextResponse.json({ error: "Select an approval role." }, { status: 400 });
    }
    updates.push([AVAILABILITY_OVER_MAX_APPROVAL_ROLE_KEY, roleId]);
  }
  if (body.overnightHoursMode != null) {
    updates.push([AVAILABILITY_OVERNIGHT_HOURS_MODE_KEY, parseOvernightHoursMode(body.overnightHoursMode)]);
  }

  if (!updates.length) {
    return NextResponse.json({ error: "No settings to update." }, { status: 400 });
  }

  for (const [key, value] of updates) {
    await updateSystemSetting(key, value, actor);
  }

  const settings = await getAvailabilityHoursPolicy();
  return NextResponse.json({ settings, canConfigure: true, configureHref: CONFIGURE_HREF });
}
