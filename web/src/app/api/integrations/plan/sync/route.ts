import { NextResponse } from "next/server";
import { resolveDetailWindowKey } from "@/lib/access/catalog";
import { canWriteWindowSession } from "@/lib/access/window-access";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { syncClientPlanFromGateway } from "@/lib/integrations/plan-sync.server";

type SyncBody = {
  clientId?: string;
  fundingBodyNumber?: string;
};

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const planBudgetWindowKey = resolveDetailWindowKey("clients", "Plan budget");
  if (
    !session ||
    !planBudgetWindowKey ||
    !canWriteWindowSession(session, planBudgetWindowKey)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = body.clientId?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  try {
    const { client, result } = await syncClientPlanFromGateway(clientId, {
      fundingBodyNumber: body.fundingBodyNumber,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      clientId: client.id,
      planRef: result.planRef,
      dryRun: result.dryRun,
      provider: result.provider,
      planStart: result.planStart,
      planEnd: result.planEnd,
      lines: result.lines,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Plan gateway sync failed.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
