import { sumClaimLineAmount, type ClaimRecord } from "@/lib/claim";
import { CLAIM_REMITTANCE_STATUSES, remittanceStatusClass } from "@/lib/claim-remittance";
import type { ClientRecord } from "@/lib/client";

export const CLAIM_RECONCILE_STATUSES = CLAIM_REMITTANCE_STATUSES;
export type ClaimReconcileStatus = (typeof CLAIM_RECONCILE_STATUSES)[number];

export type ClaimReconcileRow = {
  claimId: string;
  documentNo: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  claimStatus: string;
  gatewayStatus: string;
  gatewayRef: string;
  claimedAmount: number;
  paidAmount: number;
  amountVariance: number;
  remittanceStatus: string;
  remittancePaymentRef: string;
  remittanceImportedAt: string;
  reconcileMessage: string;
};

export type ClaimReconcileDigest = {
  claimCount: number;
  notImportedCount: number;
  pendingCount: number;
  matchedCount: number;
  varianceCount: number;
  partialCount: number;
  totalClaimedAmount: number;
  totalPaidAmount: number;
  totalVarianceAmount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function periodOverlapsMonth(periodStart: string, periodEnd: string, month: string): boolean {
  if (!month?.trim()) return true;
  const startMonth = periodStart?.slice(0, 7) ?? "";
  const endMonth = periodEnd?.slice(0, 7) ?? startMonth;
  if (startMonth === month || endMonth === month) return true;
  if (!startMonth || !endMonth) return false;
  return startMonth <= month && endMonth >= month;
}

export function claimsEligibleForReconciliation(claims: ClaimRecord[]): ClaimRecord[] {
  return claims.filter((claim) => claim.status === "Submitted" || claim.status === "Accepted");
}

function lineInPeriodMonth(serviceDate: string, periodMonth: string): boolean {
  if (!periodMonth?.trim()) return true;
  return serviceDate?.slice(0, 7) === periodMonth.slice(0, 7);
}

export function buildClaimReconcileRow(claim: ClaimRecord, periodMonth = ""): ClaimReconcileRow {
  const fullClaimed = round2(claim.totalAmount || sumClaimLineAmount(claim.lines));
  const claimedAmount = periodMonth
    ? round2(
        claim.lines
          .filter((line) => lineInPeriodMonth(line.serviceDate, periodMonth))
          .reduce((sum, line) => sum + (line.lineAmount || 0), 0)
      )
    : fullClaimed;
  const fullPaid = round2(claim.remittancePaidAmount || 0);
  const paidAmount =
    periodMonth && fullClaimed > 0 ? round2(fullPaid * (claimedAmount / fullClaimed)) : fullPaid;
  const amountVariance = round2(paidAmount - claimedAmount);
  const remittanceStatus = claim.remittanceStatus || "Not imported";

  let reconcileMessage: string;
  switch (remittanceStatus) {
    case "Matched":
      reconcileMessage = "Claimed amount matches remittance payment.";
      break;
    case "Variance":
      reconcileMessage = `Paid $${paidAmount.toFixed(2)} vs claimed $${claimedAmount.toFixed(2)} (${amountVariance >= 0 ? "+" : ""}$${amountVariance.toFixed(2)}).`;
      break;
    case "Partial":
      reconcileMessage = "Partial remittance — review claim lines and payment advice.";
      break;
    case "Pending":
      reconcileMessage = "Remittance import pending match.";
      break;
    default:
      reconcileMessage = claim.gatewayRef?.trim()
        ? "Awaiting remittance import from payment advice."
        : "Submit through gateway before remittance can be matched.";
  }

  return {
    claimId: claim.id,
    documentNo: claim.documentNo,
    clientId: claim.clientId,
    periodStart: claim.periodStart,
    periodEnd: claim.periodEnd,
    claimStatus: claim.status,
    gatewayStatus: claim.gatewayStatus,
    gatewayRef: claim.gatewayRef,
    claimedAmount,
    paidAmount,
    amountVariance,
    remittanceStatus,
    remittancePaymentRef: claim.remittancePaymentRef,
    remittanceImportedAt: claim.remittanceImportedAt,
    reconcileMessage,
  };
}

export function buildClaimReconcileRows(claims: ClaimRecord[], periodMonth = ""): ClaimReconcileRow[] {
  return claimsEligibleForReconciliation(claims)
    .filter((claim) => {
      if (!periodMonth) return periodOverlapsMonth(claim.periodStart, claim.periodEnd, periodMonth);
      return claim.lines.some((line) => lineInPeriodMonth(line.serviceDate, periodMonth));
    })
    .map((claim) => buildClaimReconcileRow(claim, periodMonth))
    .sort(
      (a, b) =>
        (b.periodStart || "").localeCompare(a.periodStart || "") || a.documentNo.localeCompare(b.documentNo)
    );
}

export function summarizeClaimReconciliation(rows: ClaimReconcileRow[]): ClaimReconcileDigest {
  return rows.reduce(
    (acc, row) => {
      acc.claimCount += 1;
      const status = row.remittanceStatus || "Not imported";
      if (status === "Not imported") acc.notImportedCount += 1;
      if (status === "Pending") acc.pendingCount += 1;
      if (status === "Matched") acc.matchedCount += 1;
      if (status === "Variance") acc.varianceCount += 1;
      if (status === "Partial") acc.partialCount += 1;
      acc.totalClaimedAmount = round2(acc.totalClaimedAmount + row.claimedAmount);
      acc.totalPaidAmount = round2(acc.totalPaidAmount + row.paidAmount);
      acc.totalVarianceAmount = round2(acc.totalVarianceAmount + row.amountVariance);
      return acc;
    },
    {
      claimCount: 0,
      notImportedCount: 0,
      pendingCount: 0,
      matchedCount: 0,
      varianceCount: 0,
      partialCount: 0,
      totalClaimedAmount: 0,
      totalPaidAmount: 0,
      totalVarianceAmount: 0,
    }
  );
}

export function claimReconcileCsv(rows: ClaimReconcileRow[], clients: ClientRecord[]): string {
  const header = [
    "Document",
    "Client",
    "PeriodStart",
    "PeriodEnd",
    "ClaimStatus",
    "GatewayRef",
    "ClaimedAmount",
    "PaidAmount",
    "AmountVariance",
    "RemittanceStatus",
    "PaymentRef",
    "Message",
  ].join(",");
  const lines = rows.map((row) => {
    const client = clients.find((c) => c.id === row.clientId);
    const label = client ? `${client.searchKey} — ${client.name}` : row.clientId;
    return [
      row.documentNo,
      `"${label.replace(/"/g, '""')}"`,
      row.periodStart,
      row.periodEnd,
      row.claimStatus,
      row.gatewayRef || "—",
      row.claimedAmount.toFixed(2),
      row.paidAmount.toFixed(2),
      row.amountVariance.toFixed(2),
      row.remittanceStatus,
      row.remittancePaymentRef || "—",
      `"${row.reconcileMessage.replace(/"/g, '""')}"`,
    ].join(",");
  });
  return [header, ...lines].join("\r\n");
}

export { remittanceStatusClass as claimReconcileStatusClass };
