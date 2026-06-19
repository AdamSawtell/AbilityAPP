import { NextResponse } from "next/server";
import { processRiskQueueBatch } from "@/lib/audit-monitoring/risk-queue";
import { runAllRetentionJobs } from "@/lib/session-audit/server";

function authorized(request: Request): boolean {
  const secret = process.env.AUDIT_CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-audit-cron-secret");
  const auth = request.headers.get("authorization");
  return header === secret || auth === `Bearer ${secret}`;
}

/**
 * Scheduled maintenance: risk queue processing and optional retention.
 * Call nightly via Supabase cron, Vercel cron, or manual trigger with AUDIT_CRON_SECRET.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { action?: string; riskBatchSize?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const risk = await processRiskQueueBatch(body.riskBatchSize ?? 200);

  if (body.action === "run_retention") {
    const runs = await runAllRetentionJobs();
    const totalDeleted = runs.reduce((sum, r) => sum + r.recordsDeleted, 0);
    return NextResponse.json({ risk, retention: { runs, totalDeleted } });
  }

  return NextResponse.json({ risk });
}
