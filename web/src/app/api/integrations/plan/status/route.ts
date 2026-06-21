import { NextResponse } from "next/server";
import { resolveDetailWindowKey } from "@/lib/access/catalog";
import { canWriteWindowSession } from "@/lib/access/window-access";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { getNdisPlanGatewayPublicStatus } from "@/lib/integrations/ndis-plan-gateway";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const planBudgetWindowKey = resolveDetailWindowKey("clients", "Plan budget");
  if (
    !session ||
    !planBudgetWindowKey ||
    !canWriteWindowSession(session, planBudgetWindowKey)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(getNdisPlanGatewayPublicStatus());
}
