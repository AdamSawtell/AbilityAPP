import type { ClaimLine, ClaimRecord } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";
import type { ProductRecord } from "@/lib/product";

/** Stub NDIS gateway adapter — PRODA / LanternPay / quickclaim path (live credentials later). */

export type NdisGatewayPublicStatus = {
  available: boolean;
  mode: "live" | "dry-run" | "disabled";
  provider: string;
  message: string;
};

export type NdisGatewayClaimLine = {
  supportItemNumber: string;
  serviceDate: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  claimType: string;
  participantNdisNumber: string;
  serviceBookingId: string;
  timesheetLineId: string;
  rosterShiftId: string;
  productSearchKey: string;
};

export type NdisGatewayPayload = {
  batchRef: string;
  claimId: string;
  documentNo: string;
  participantNdisNumber: string;
  participantName: string;
  periodStart: string;
  periodEnd: string;
  planManagementType: string;
  lineCount: number;
  totalAmount: number;
  lines: NdisGatewayClaimLine[];
};

export type NdisGatewaySubmitResponse =
  | {
      ok: true;
      batchRef: string;
      gatewayRef: string;
      lineCount: number;
      dryRun: boolean;
      provider: string;
    }
  | { ok: false; message: string };

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function ndisGatewayProvider(): string {
  return process.env.NDIS_GATEWAY_PROVIDER?.trim() || "stub";
}

export function ndisGatewayApiKey(): string {
  return process.env.NDIS_GATEWAY_API_KEY?.trim() ?? "";
}

export function ndisGatewayDryRunEnabled(): boolean {
  return envFlag("NDIS_GATEWAY_DRY_RUN");
}

export function ndisGatewayLiveConfigured(): boolean {
  return Boolean(ndisGatewayApiKey());
}

export function getNdisGatewayPublicStatus(): NdisGatewayPublicStatus {
  const provider = ndisGatewayProvider();
  if (ndisGatewayDryRunEnabled()) {
    return {
      available: true,
      mode: "dry-run",
      provider,
      message: ndisGatewayLiveConfigured()
        ? `Dry run — claim payload validated but not sent (${provider}). NDIS_GATEWAY_DRY_RUN overrides live credentials.`
        : `Dry run — claim payload validated but not sent (${provider}). Set NDIS_GATEWAY_DRY_RUN=true for local testing.`,
    };
  }
  if (ndisGatewayLiveConfigured()) {
    return {
      available: true,
      mode: "live",
      provider,
      message: `Live ${provider} credentials configured — gateway submission is enabled (adapter stub until partnership approval).`,
    };
  }
  return {
    available: false,
    mode: "disabled",
    provider,
    message:
      "Set NDIS_GATEWAY_DRY_RUN=true for testing, or NDIS_GATEWAY_API_KEY when your PRODA/gateway contract is active.",
  };
}

export function buildNdisGatewayPayload(
  claim: ClaimRecord,
  client: ClientRecord | undefined,
  products: ProductRecord[]
): NdisGatewayPayload {
  const batchRef = `NDIS-${claim.documentNo}-${Date.now()}`;
  const lines: NdisGatewayClaimLine[] = claim.lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return lineToGatewayLine(line, client?.fundingBodyNumber ?? "", product?.searchKey ?? "");
  });

  return {
    batchRef,
    claimId: claim.id,
    documentNo: claim.documentNo,
    participantNdisNumber: client?.fundingBodyNumber ?? "",
    participantName: client?.name ?? "",
    periodStart: claim.periodStart,
    periodEnd: claim.periodEnd,
    planManagementType: claim.planManagementType,
    lineCount: lines.length,
    totalAmount: claim.totalAmount,
    lines,
  };
}

function lineToGatewayLine(
  line: ClaimLine,
  participantNdisNumber: string,
  productSearchKey: string
): NdisGatewayClaimLine {
  return {
    supportItemNumber: line.ndisSupportItem,
    serviceDate: line.serviceDate,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineAmount: line.lineAmount,
    claimType: line.claimType,
    participantNdisNumber,
    serviceBookingId: line.serviceBookingId,
    timesheetLineId: line.timesheetLineId,
    rosterShiftId: line.rosterShiftId,
    productSearchKey,
  };
}

export async function submitPayloadToNdisGateway(
  payload: NdisGatewayPayload
): Promise<NdisGatewaySubmitResponse> {
  const status = getNdisGatewayPublicStatus();
  if (!status.available) {
    return { ok: false, message: status.message };
  }

  if (!payload.lines.length) {
    return { ok: false, message: "Claim has no lines to submit." };
  }

  if (status.mode === "dry-run") {
    const gatewayRef = `DRY-${payload.documentNo}-${payload.lineCount}L`;
    return {
      ok: true,
      batchRef: payload.batchRef,
      gatewayRef,
      lineCount: payload.lineCount,
      dryRun: true,
      provider: status.provider,
    };
  }

  // Live path — placeholder until Digital Partnership / commercial gateway SDK is wired.
  if (!ndisGatewayApiKey()) {
    return { ok: false, message: "NDIS gateway API key is not configured." };
  }

  return {
    ok: true,
    batchRef: payload.batchRef,
    gatewayRef: `GW-${payload.documentNo}-${Date.now()}`,
    lineCount: payload.lineCount,
    dryRun: false,
    provider: status.provider,
  };
}

export function claimAfterGatewaySubmit(
  claim: ClaimRecord,
  result: Extract<NdisGatewaySubmitResponse, { ok: true }>,
  actorName: string
): ClaimRecord {
  return {
    ...claim,
    status: "Submitted",
    gatewayStatus: result.dryRun ? "Pending gateway" : "Submitted",
    gatewayRef: result.gatewayRef,
    updatedBy: actorName,
  };
}
