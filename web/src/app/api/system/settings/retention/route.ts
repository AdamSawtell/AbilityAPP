import { NextResponse } from "next/server";
import {
  getRecentRetentionRuns,
  getRetentionPolicies,
  getSystemSettings,
  runAllRetentionJobs,
  updateRetentionPolicy,
  updateSystemSetting,
} from "@/lib/session-audit/server";
import { resolveSessionAuditAccess } from "@/lib/session-audit/request-access";
import { canManageRetention } from "@/lib/session-audit/access";

export async function GET() {
  const { level } = await resolveSessionAuditAccess();
  if (!canManageRetention(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [policies, settings, runs] = await Promise.all([
    getRetentionPolicies(),
    getSystemSettings(),
    getRecentRetentionRuns(),
  ]);
  return NextResponse.json({ policies, settings, runs });
}

export async function PATCH(request: Request) {
  const { level, actorName } = await resolveSessionAuditAccess();
  if (!canManageRetention(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as {
    retentionDays?: number;
    recordType?: string;
    settingKey?: string;
    settingValue?: string;
  };
  if (body.recordType && body.retentionDays != null) {
    await updateRetentionPolicy(body.recordType, body.retentionDays, actorName);
  }
  if (body.settingKey && body.settingValue != null) {
    await updateSystemSetting(body.settingKey, body.settingValue, actorName);
  }
  const [policies, settings] = await Promise.all([getRetentionPolicies(), getSystemSettings()]);
  return NextResponse.json({ policies, settings });
}

export async function POST(request: Request) {
  const { level } = await resolveSessionAuditAccess();
  if (!canManageRetention(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.action === "run_retention") {
    const runs = await runAllRetentionJobs();
    const totalDeleted = runs.reduce((sum, r) => sum + r.recordsDeleted, 0);
    return NextResponse.json({ runs, totalDeleted });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
