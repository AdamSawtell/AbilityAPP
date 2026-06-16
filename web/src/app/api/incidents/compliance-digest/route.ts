import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { canAccessWindow } from "@/lib/access/catalog";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchIncidents } from "@/lib/supabase/data-api";
import { buildIncidentComplianceDigest } from "@/lib/reports/runners/incident-compliance-digest";
import { initialIncidents } from "@/lib/incident";

/**
 * Compliance digest endpoint for schedulers (e.g. weekly cron via external job).
 * Returns JSON summary of open reportable incidents and overdue NDIS deadlines.
 */
export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessWindow(session.windowKeys, "incidents")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  let incidents = initialIncidents;
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      incidents = await fetchIncidents(supabase);
    } catch {
      // fall back to seed data
    }
  }

  const digest = buildIncidentComplianceDigest(incidents);

  if (format === "text") {
    const lines = [
      `Incident compliance digest — ${digest.generatedAt}`,
      `Open reportable: ${digest.summary.openReportable}`,
      `Overdue: ${digest.summary.overdue}`,
      `Incomplete checklist: ${digest.summary.incompleteChecklist}`,
      "",
      ...digest.sections.flatMap((section) => [
        `${section.label} (${section.count})`,
        ...section.items.map((item) => `  ${item.documentNo} — ${item.title} — ${item.detail}`),
        "",
      ]),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json(digest);
}
