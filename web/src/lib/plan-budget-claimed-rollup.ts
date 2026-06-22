import type { ClaimRecord } from "@/lib/claim";
import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import type { InvoiceRecord } from "@/lib/invoice";

const BILLING_CLAIM_STATUSES = new Set(["Submitted", "Accepted"]);
const BILLING_INVOICE_STATUSES = new Set(["Sent", "Paid"]);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function categoryKey(value: string): string {
  return value.trim().toLowerCase();
}

function claimLineAmount(claim: ClaimRecord, lineAmount: number): number {
  if (claim.remittanceStatus === "Matched" || claim.remittanceStatus === "Partial") {
    const paid = claim.remittancePaidAmount || 0;
    const total = claim.totalAmount || 0;
    if (total > 0 && paid > 0) {
      return round2(paid * (lineAmount / total));
    }
  }
  return round2(lineAmount);
}

export function aggregateBillingClaimedByCategory(
  clientId: string,
  claims: ClaimRecord[],
  invoices: InvoiceRecord[]
): Record<string, number> {
  const totals: Record<string, number> = {};

  const add = (category: string, amount: number) => {
    if (!category.trim() || amount <= 0) return;
    const key = categoryKey(category);
    totals[key] = round2((totals[key] ?? 0) + amount);
  };

  for (const claim of claims) {
    if (claim.clientId !== clientId) continue;
    if (!BILLING_CLAIM_STATUSES.has(claim.status) && claim.gatewayStatus !== "Paid") continue;
    for (const line of claim.lines) {
      if (line.clientId && line.clientId !== clientId) continue;
      add(line.supportCategory, claimLineAmount(claim, line.lineAmount ?? 0));
    }
  }

  for (const invoice of invoices) {
    if (invoice.clientId !== clientId) continue;
    if (!BILLING_INVOICE_STATUSES.has(invoice.status)) continue;
    const paidRatio =
      invoice.paymentStatus === "Paid" && invoice.totalAmount > 0
        ? (invoice.paidAmount || invoice.totalAmount) / invoice.totalAmount
        : invoice.status === "Paid"
          ? 1
          : 1;
    for (const line of invoice.lines) {
      if (line.clientId && line.clientId !== clientId) continue;
      add(line.supportCategory, round2((line.lineAmount ?? 0) * paidRatio));
    }
  }

  return totals;
}

export type PlanBudgetClaimedRollupLine = {
  rowId: string;
  supportCategory: string;
  manualClaimed: number;
  billingClaimed: number;
  delta: number;
};

export function summarizePlanBudgetClaimedRollup(
  clientId: string,
  rows: ClientPlanBudgetRow[],
  claims: ClaimRecord[],
  invoices: InvoiceRecord[]
): { lines: PlanBudgetClaimedRollupLine[]; totalBillingClaimed: number } {
  const byCategory = aggregateBillingClaimedByCategory(clientId, claims, invoices);
  const rollupLines: PlanBudgetClaimedRollupLine[] = rows.map((row) => {
    const manualClaimed = round2(Number(row.claimedAmount) || 0);
    const billingClaimed = round2(byCategory[categoryKey(row.supportCategory)] ?? 0);
    return {
      rowId: row.id,
      supportCategory: row.supportCategory,
      manualClaimed,
      billingClaimed,
      delta: round2(billingClaimed - manualClaimed),
    };
  });

  const totalBillingClaimed = round2(Object.values(byCategory).reduce((sum, n) => sum + n, 0));
  return { lines: rollupLines, totalBillingClaimed };
}

export function applyBillingClaimedRollup(
  rows: ClientPlanBudgetRow[],
  clientId: string,
  claims: ClaimRecord[],
  invoices: InvoiceRecord[]
): ClientPlanBudgetRow[] {
  const byCategory = aggregateBillingClaimedByCategory(clientId, claims, invoices);

  const allocatedByCategory = new Map<string, number>();
  for (const row of rows) {
    const key = categoryKey(row.supportCategory);
    allocatedByCategory.set(key, round2((allocatedByCategory.get(key) ?? 0) + (Number(row.allocatedAmount) || 0)));
  }

  return rows.map((row) => {
    const key = categoryKey(row.supportCategory);
    const billingTotal = byCategory[key] ?? 0;
    if (billingTotal <= 0) {
      return { ...row, claimedAmount: 0 };
    }

    const categoryAllocated = allocatedByCategory.get(key) ?? 0;
    const rowAllocated = Number(row.allocatedAmount) || 0;
    let share: number;
    if (categoryAllocated > 0) {
      share = round2(billingTotal * (rowAllocated / categoryAllocated));
    } else {
      const rowsInCategory = rows.filter((r) => categoryKey(r.supportCategory) === key).length;
      share = round2(billingTotal / Math.max(1, rowsInCategory));
    }

    return {
      ...row,
      claimedAmount: share > 0 ? share : row.claimedAmount,
    };
  });
}
