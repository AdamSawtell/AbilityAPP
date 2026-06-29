import { NextResponse } from "next/server";
import { resolveSystemOperatorAccess } from "@/lib/system/request-access.server";
import { getOrganizationTimezone, getSystemSettings, updateSystemSetting } from "@/lib/session-audit/server";
import {
  normalizeShiftHoursVariance,
  normalizeShiftMonitoringMinutes,
  parseShiftCheckinMonitoringSettings,
  DEFAULT_SHIFT_LATE_CHECKIN_GRACE_MINUTES,
  DEFAULT_SHIFT_MISSED_CHECKIN_MINUTES,
  DEFAULT_SHIFT_MISSED_CHECKOUT_GRACE_MINUTES,
  SHIFT_HOURS_VARIANCE_KEY,
  SHIFT_LATE_CHECKIN_GRACE_KEY,
  SHIFT_MISSED_CHECKIN_KEY,
  SHIFT_MISSED_CHECKOUT_GRACE_KEY,
} from "@/lib/shift-checkin-monitoring";

const CONFIGURE_HREF = "/system/settings/shift-monitoring";

export async function GET() {
  const [raw, timeZone, systemOp] = await Promise.all([
    getSystemSettings(),
    getOrganizationTimezone(),
    resolveSystemOperatorAccess(),
  ]);
  const settings = parseShiftCheckinMonitoringSettings(raw);

  return NextResponse.json({
    settings,
    timeZone,
    canConfigure: systemOp.allowed,
    configureHref: CONFIGURE_HREF,
  });
}

export async function PATCH(request: Request) {
  const systemOp = await resolveSystemOperatorAccess();
  if (!systemOp.allowed) {
    return NextResponse.json(
      { error: "Sign in to System setup to change shift monitoring settings." },
      { status: 403 }
    );
  }

  let body: {
    lateCheckinGraceMinutes?: number;
    missedCheckinMinutes?: number;
    missedCheckoutGraceMinutes?: number;
    hoursVarianceThreshold?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actor = systemOp.actorName || "System";
  const lateGrace = normalizeShiftMonitoringMinutes(
    Number(body.lateCheckinGraceMinutes),
    DEFAULT_SHIFT_LATE_CHECKIN_GRACE_MINUTES
  );
  const missedCheckin = normalizeShiftMonitoringMinutes(
    Number(body.missedCheckinMinutes),
    DEFAULT_SHIFT_MISSED_CHECKIN_MINUTES
  );
  const missedCheckout = normalizeShiftMonitoringMinutes(
    Number(body.missedCheckoutGraceMinutes),
    DEFAULT_SHIFT_MISSED_CHECKOUT_GRACE_MINUTES
  );
  const variance = normalizeShiftHoursVariance(Number(body.hoursVarianceThreshold));

  await Promise.all([
    updateSystemSetting(SHIFT_LATE_CHECKIN_GRACE_KEY, String(lateGrace), actor),
    updateSystemSetting(SHIFT_MISSED_CHECKIN_KEY, String(missedCheckin), actor),
    updateSystemSetting(SHIFT_MISSED_CHECKOUT_GRACE_KEY, String(missedCheckout), actor),
    updateSystemSetting(SHIFT_HOURS_VARIANCE_KEY, String(variance), actor),
  ]);

  return NextResponse.json({
    settings: {
      lateCheckinGraceMinutes: lateGrace,
      missedCheckinMinutes: missedCheckin,
      missedCheckoutGraceMinutes: missedCheckout,
      hoursVarianceThreshold: variance,
    },
    canConfigure: true,
    configureHref: CONFIGURE_HREF,
  });
}
