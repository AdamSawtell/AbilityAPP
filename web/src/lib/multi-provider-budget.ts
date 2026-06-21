import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";

export const DEFAULT_PLAN_PROVIDER = "This organisation";

export type MultiProviderBudgetRow = {
  provider: string;
  clientId: string;
  clientName: string;
  supportBudget: string;
  supportCategory: string;
  allocatedAmount: number;
  claimedAmount: number;
  remainingAmount: number;
  lineCount: number;
};

export type MultiProviderBudgetDigest = {
  providerCount: number;
  clientCount: number;
  totalAllocated: number;
  totalClaimed: number;
  totalRemaining: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function planProviderLabel(row: ClientPlanBudgetRow): string {
  const label = row.planProvider?.trim();
  return label || DEFAULT_PLAN_PROVIDER;
}

export function buildMultiProviderBudgetRows(clients: ClientRecord[]): MultiProviderBudgetRow[] {
  const rows: MultiProviderBudgetRow[] = [];
  const grouped = new Map<string, MultiProviderBudgetRow>();

  for (const client of clients) {
    for (const line of client.planBudgets ?? []) {
      const provider = planProviderLabel(line);
      const key = `${provider}::${client.id}::${line.supportBudget}::${line.supportCategory}`;
      const allocated = round2(Number(line.allocatedAmount) || 0);
      const claimed = round2(Number(line.claimedAmount) || 0);
      const existing = grouped.get(key);
      if (existing) {
        existing.allocatedAmount = round2(existing.allocatedAmount + allocated);
        existing.claimedAmount = round2(existing.claimedAmount + claimed);
        existing.remainingAmount = round2(existing.allocatedAmount - existing.claimedAmount);
        existing.lineCount += 1;
      } else {
        grouped.set(key, {
          provider,
          clientId: client.id,
          clientName: client.name,
          supportBudget: line.supportBudget,
          supportCategory: line.supportCategory,
          allocatedAmount: allocated,
          claimedAmount: claimed,
          remainingAmount: round2(allocated - claimed),
          lineCount: 1,
        });
      }
    }
  }

  rows.push(...grouped.values());
  return rows.sort(
    (a, b) =>
      a.provider.localeCompare(b.provider) ||
      a.clientName.localeCompare(b.clientName) ||
      a.supportBudget.localeCompare(b.supportBudget)
  );
}

export function summarizeMultiProviderBudget(rows: MultiProviderBudgetRow[]): MultiProviderBudgetDigest {
  const providers = new Set(rows.map((row) => row.provider));
  const clients = new Set(rows.map((row) => row.clientId));
  return {
    providerCount: providers.size,
    clientCount: clients.size,
    totalAllocated: round2(rows.reduce((sum, row) => sum + row.allocatedAmount, 0)),
    totalClaimed: round2(rows.reduce((sum, row) => sum + row.claimedAmount, 0)),
    totalRemaining: round2(rows.reduce((sum, row) => sum + row.remainingAmount, 0)),
  };
}

export function multiProviderBudgetCsv(rows: MultiProviderBudgetRow[]): string {
  const header = "Provider,Client,SupportBudget,SupportCategory,Allocated,Claimed,Remaining,Lines";
  const lines = rows.map((row) =>
    [
      `"${row.provider.replace(/"/g, '""')}"`,
      `"${row.clientName.replace(/"/g, '""')}"`,
      `"${row.supportBudget.replace(/"/g, '""')}"`,
      `"${row.supportCategory.replace(/"/g, '""')}"`,
      row.allocatedAmount.toFixed(2),
      row.claimedAmount.toFixed(2),
      row.remainingAmount.toFixed(2),
      row.lineCount,
    ].join(",")
  );
  return [header, ...lines].join("\r\n");
}
