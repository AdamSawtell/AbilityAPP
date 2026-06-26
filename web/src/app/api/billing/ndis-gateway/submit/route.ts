import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { claimGatewaySubmitBlocked, revalidateClaimRecord } from "@/lib/claim-papl-validation";
import {
  buildNdisGatewayPayload,
  claimAfterGatewaySubmit,
  submitPayloadToNdisGateway,
} from "@/lib/integrations/ndis-gateway";
import { normalizeClaim } from "@/lib/claim";
import { getAuthSessionFromRequest, sessionCanWriteWindow } from "@/lib/auth/session.server";
import { assertClientAccessibleInSession } from "@/lib/location-scope.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchClaimGatewayData, saveClaim } from "@/lib/supabase/data-api";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("Supabase is not configured");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

type SubmitBody = {
  claimId?: string;
};

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanWriteWindow(session, "claims")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Gateway submit requires a linked Supabase database. Enable NDIS_GATEWAY_DRY_RUN and use the in-app dry-run fallback for local-only data.",
      },
      { status: 503 }
    );
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const claimId = body.claimId?.trim();
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required." }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const data = await fetchClaimGatewayData(supabase, claimId);
    if (!data.claim) {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }

    const ctx = {
      clients: data.clients,
      serviceBookings: data.serviceBookings,
      products: data.products,
      priceLists: data.priceLists,
    };
    const validated = normalizeClaim(revalidateClaimRecord(data.claim, ctx, "gateway"));
    const clientAccess = await assertClientAccessibleInSession(supabase, session, validated.clientId);
    if (!clientAccess.ok) {
      return NextResponse.json({ error: clientAccess.error }, { status: clientAccess.status });
    }

    const block = claimGatewaySubmitBlocked(validated, ctx);
    if (block) {
      return NextResponse.json({ error: block }, { status: 400 });
    }

    const client = data.clients.find((c) => c.id === validated.clientId);
    const payload = buildNdisGatewayPayload(validated, client, data.products);
    const gateway = await submitPayloadToNdisGateway(payload);
    if (!gateway.ok) {
      return NextResponse.json({ error: gateway.message }, { status: 400 });
    }

    const updated = claimAfterGatewaySubmit(validated, gateway, session.displayName);
    await saveClaim(supabase, updated);

    return NextResponse.json({
      claimId: updated.id,
      gatewayRef: gateway.gatewayRef,
      batchRef: gateway.batchRef,
      lineCount: gateway.lineCount,
      dryRun: gateway.dryRun,
      provider: gateway.provider,
      updatedClaim: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gateway submit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
