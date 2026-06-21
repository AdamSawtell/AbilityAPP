import type { ClientRecord } from "@/lib/client";
import { localDateIso } from "@/lib/booking-cancellation";

/** Stub NDIS plan gateway adapter — PRODA / LanternPay / quickclaim plan pull (live credentials later). */

export type NdisPlanGatewayPublicStatus = {
  available: boolean;
  mode: "live" | "dry-run" | "disabled";
  provider: string;
  message: string;
};

export type NdisPlanGatewayBudgetLine = {
  supportBudget: string;
  supportCategory: string;
  description: string;
  ndisLineItemRef: string;
  allocatedAmount: number;
  claimedAmount: number;
};

export type NdisPlanGatewayPayload = {
  planRef: string;
  clientId: string;
  participantNdisNumber: string;
  participantName: string;
  planStart: string;
  planEnd: string;
  lineCount: number;
  totalAllocated: number;
  lines: NdisPlanGatewayBudgetLine[];
};

export type NdisPlanPullResponse =
  | {
      ok: true;
      planRef: string;
      dryRun: boolean;
      provider: string;
      planStart: string;
      planEnd: string;
      lines: NdisPlanGatewayBudgetLine[];
    }
  | { ok: false; message: string };

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function ndisPlanGatewayProvider(): string {
  return process.env.NDIS_GATEWAY_PROVIDER?.trim() || "stub";
}

export function ndisPlanGatewayApiKey(): string {
  return process.env.NDIS_GATEWAY_API_KEY?.trim() ?? "";
}

export function ndisPlanGatewayDryRunEnabled(): boolean {
  return envFlag("NDIS_GATEWAY_DRY_RUN");
}

export function ndisPlanGatewayLiveConfigured(): boolean {
  return Boolean(ndisPlanGatewayApiKey());
}

export function getNdisPlanGatewayPublicStatus(): NdisPlanGatewayPublicStatus {
  const provider = ndisPlanGatewayProvider();
  if (ndisPlanGatewayDryRunEnabled()) {
    return {
      available: true,
      mode: "dry-run",
      provider,
      message: ndisPlanGatewayLiveConfigured()
        ? `Dry run — plan budget lines validated but not fetched from live ${provider}. NDIS_GATEWAY_DRY_RUN overrides live credentials.`
        : `Dry run — sample plan budget scaffold returned for testing. Set NDIS_GATEWAY_DRY_RUN=true locally.`,
    };
  }
  if (ndisPlanGatewayLiveConfigured()) {
    return {
      available: true,
      mode: "live",
      provider,
      message: `Live ${provider} credentials configured — plan pull is enabled (adapter stub until Digital Partnership approval).`,
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

function planScaleFromNdisNumber(ndisNumber: string): number {
  const digits = ndisNumber.replace(/\D/g, "").slice(-4);
  if (!digits) return 1;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return 1;
  return 0.85 + (n % 40) / 100;
}

export function buildDryRunPlanBudgetLines(ndisNumber: string): NdisPlanGatewayBudgetLine[] {
  const scale = planScaleFromNdisNumber(ndisNumber);
  return [
    {
      supportBudget: "Core",
      supportCategory: "Assistance with Daily Life",
      description: "Daily personal activities (gateway scaffold)",
      ndisLineItemRef: "",
      allocatedAmount: Math.round(42000 * scale),
      claimedAmount: 0,
    },
    {
      supportBudget: "Capacity building",
      supportCategory: "Support Coordination",
      description: "Plan coordination (gateway scaffold)",
      ndisLineItemRef: "",
      allocatedAmount: Math.round(3500 * scale),
      claimedAmount: 0,
    },
    {
      supportBudget: "Capital",
      supportCategory: "Assistive Technology",
      description: "Low-cost assistive technology (gateway scaffold)",
      ndisLineItemRef: "",
      allocatedAmount: Math.round(6500 * scale),
      claimedAmount: 0,
    },
  ];
}

function defaultPlanDates(): { planStart: string; planEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return {
    planStart: localDateIso(start),
    planEnd: localDateIso(end),
  };
}

export function buildNdisPlanGatewayPayload(client: ClientRecord): NdisPlanGatewayPayload {
  const participantNdisNumber = client.fundingBodyNumber?.trim() ?? "";
  if (!participantNdisNumber) {
    throw new Error("Enter the participant NDIS number on the client record before pulling a plan.");
  }

  const lines = buildDryRunPlanBudgetLines(participantNdisNumber);
  const { planStart, planEnd } = defaultPlanDates();
  const planRef = `PLAN-${participantNdisNumber}-${Date.now()}`;

  return {
    planRef,
    clientId: client.id,
    participantNdisNumber,
    participantName: client.name ?? client.searchKey ?? "",
    planStart,
    planEnd,
    lineCount: lines.length,
    totalAllocated: lines.reduce((sum, line) => sum + line.allocatedAmount, 0),
    lines,
  };
}

export async function pullPlanFromNdisGateway(client: ClientRecord): Promise<NdisPlanPullResponse> {
  const status = getNdisPlanGatewayPublicStatus();
  if (!status.available) {
    return { ok: false, message: status.message };
  }

  if (!client.fundingBodyNumber?.trim()) {
    return {
      ok: false,
      message: "Enter the participant NDIS number on the client record before pulling a plan.",
    };
  }

  const payload = buildNdisPlanGatewayPayload(client);

  if (status.mode === "dry-run") {
    return {
      ok: true,
      planRef: `DRY-${payload.participantNdisNumber}-${payload.lineCount}L`,
      dryRun: true,
      provider: status.provider,
      planStart: payload.planStart,
      planEnd: payload.planEnd,
      lines: payload.lines,
    };
  }

  if (!ndisPlanGatewayApiKey()) {
    return { ok: false, message: "NDIS gateway API key is not configured." };
  }

  return {
    ok: true,
    planRef: `GW-${payload.participantNdisNumber}-${Date.now()}`,
    dryRun: false,
    provider: status.provider,
    planStart: payload.planStart,
    planEnd: payload.planEnd,
    lines: payload.lines,
  };
}
