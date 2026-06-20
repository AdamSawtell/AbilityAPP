import { normalizeClaim, type ClaimLine, type ClaimRecord } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";

export const REMITTANCE_MATCH_STATUSES = ["Pending", "Matched", "Variance", "Unmatched"] as const;
export type RemittanceMatchStatus = (typeof REMITTANCE_MATCH_STATUSES)[number];

export const CLAIM_REMITTANCE_STATUSES = [
  "Not imported",
  "Pending",
  "Matched",
  "Variance",
  "Partial",
] as const;

export type ClaimRemittanceLine = {
  id: string;
  lineNo: number;
  participantNdisNumber: string;
  supportItemNumber: string;
  serviceDate: string;
  claimedAmount: number;
  paidAmount: number;
  gatewayClaimRef: string;
  matchStatus: RemittanceMatchStatus;
  matchMessage: string;
  claimId: string;
  claimLineId: string;
};

export type ClaimRemittanceRecord = {
  id: string;
  documentNo: string;
  sourceFilename: string;
  paymentReference: string;
  remittanceDate: string;
  totalPaid: number;
  matchedCount: number;
  unmatchedCount: number;
  varianceCount: number;
  lines: ClaimRemittanceLine[];
  createdBy: string;
  updatedBy: string;
};

export const REMITTANCE_AMOUNT_TOLERANCE = 0.01;

export const REMITTANCE_CSV_HEADERS = [
  "GatewayRef",
  "NDISNumber",
  "SupportItem",
  "ServiceDate",
  "ClaimedAmount",
  "PaidAmount",
] as const;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseMoney(value: string): number {
  const n = parseFloat(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function headerIndex(header: string[], ...names: string[]): number {
  const normalized = header.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const name of names) {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const idx = normalized.indexOf(key);
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseRemittanceCsv(text: string): {
  lines: Omit<ClaimRemittanceLine, "id" | "lineNo" | "matchStatus" | "matchMessage" | "claimId" | "claimLineId">[];
  paymentReference: string;
  error?: string;
} {
  const raw = text.trim();
  if (!raw) return { lines: [], paymentReference: "", error: "Paste or upload a remittance CSV." };

  const rows = raw.split(/\r?\n/).filter((l) => l.trim());
  if (rows.length < 2) {
    return { lines: [], paymentReference: "", error: "CSV must include a header row and at least one data row." };
  }

  const header = parseCsvLine(rows[0]);
  const gatewayIdx = headerIndex(header, "GatewayRef", "GatewayClaimRef", "ClaimRef");
  const ndisIdx = headerIndex(header, "NDISNumber", "ParticipantNumber", "NDIS");
  const itemIdx = headerIndex(header, "SupportItem", "SupportItemNumber", "NDISItem");
  const dateIdx = headerIndex(header, "ServiceDate", "Date");
  const claimedIdx = headerIndex(header, "ClaimedAmount", "Claimed");
  const paidIdx = headerIndex(header, "PaidAmount", "Paid", "Amount");

  if (gatewayIdx < 0 || paidIdx < 0) {
    return {
      lines: [],
      paymentReference: "",
      error: "CSV must include GatewayRef and PaidAmount columns.",
    };
  }

  const lines: Omit<
    ClaimRemittanceLine,
    "id" | "lineNo" | "matchStatus" | "matchMessage" | "claimId" | "claimLineId"
  >[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const cells = parseCsvLine(rows[i]);
    if (!cells.some((c) => c.trim())) continue;
    lines.push({
      participantNdisNumber: ndisIdx >= 0 ? cells[ndisIdx]?.trim() ?? "" : "",
      supportItemNumber: itemIdx >= 0 ? cells[itemIdx]?.trim() ?? "" : "",
      serviceDate: dateIdx >= 0 ? cells[dateIdx]?.trim().slice(0, 10) : "",
      claimedAmount: claimedIdx >= 0 ? parseMoney(cells[claimedIdx] ?? "") : 0,
      paidAmount: parseMoney(cells[paidIdx] ?? ""),
      gatewayClaimRef: cells[gatewayIdx]?.trim() ?? "",
    });
  }

  const paymentReference = lines[0]?.gatewayClaimRef?.split("-")[0] ?? "";
  return { lines, paymentReference };
}

export function emptyRemittanceLine(lineNo: number): ClaimRemittanceLine {
  return {
    id: `crl-${Date.now()}-${lineNo}`,
    lineNo,
    participantNdisNumber: "",
    supportItemNumber: "",
    serviceDate: "",
    claimedAmount: 0,
    paidAmount: 0,
    gatewayClaimRef: "",
    matchStatus: "Pending",
    matchMessage: "",
    claimId: "",
    claimLineId: "",
  };
}

export function normalizeRemittanceLine(line: ClaimRemittanceLine): ClaimRemittanceLine {
  return {
    ...line,
    lineNo: line.lineNo || 1,
    participantNdisNumber: line.participantNdisNumber ?? "",
    supportItemNumber: line.supportItemNumber ?? "",
    serviceDate: line.serviceDate?.slice(0, 10) ?? "",
    claimedAmount: Number.isFinite(line.claimedAmount) ? line.claimedAmount : 0,
    paidAmount: Number.isFinite(line.paidAmount) ? line.paidAmount : 0,
    gatewayClaimRef: line.gatewayClaimRef ?? "",
    matchStatus: (REMITTANCE_MATCH_STATUSES.includes(line.matchStatus as RemittanceMatchStatus)
      ? line.matchStatus
      : "Pending") as RemittanceMatchStatus,
    matchMessage: line.matchMessage ?? "",
    claimId: line.claimId ?? "",
    claimLineId: line.claimLineId ?? "",
  };
}

export function normalizeRemittance(record: ClaimRemittanceRecord): ClaimRemittanceRecord {
  const lines = (record.lines ?? []).map((line, index) =>
    normalizeRemittanceLine({ ...line, lineNo: line.lineNo || index + 1 })
  );
  const totalPaid = Math.round(lines.reduce((sum, l) => sum + l.paidAmount, 0) * 100) / 100;
  const matchedCount = lines.filter((l) => l.matchStatus === "Matched").length;
  const varianceCount = lines.filter((l) => l.matchStatus === "Variance").length;
  const unmatchedCount = lines.filter((l) => l.matchStatus === "Unmatched").length;
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    sourceFilename: record.sourceFilename ?? "",
    paymentReference: record.paymentReference ?? "",
    remittanceDate: record.remittanceDate?.slice(0, 10) ?? "",
    totalPaid: record.totalPaid > 0 ? record.totalPaid : totalPaid,
    matchedCount,
    unmatchedCount,
    varianceCount,
    lines,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createRemittance(
  partial: Partial<ClaimRemittanceRecord>,
  existing: ClaimRemittanceRecord[]
): ClaimRemittanceRecord {
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `cr-${crypto.randomUUID()}`
      : `cr-${Date.now()}`);
  const used = new Set(existing.map((r) => r.documentNo).filter(Boolean));
  let documentNo = partial.documentNo?.trim() || `REM-${70000 + existing.length + 1}`;
  if (used.has(documentNo)) documentNo = `${documentNo}-${existing.length + 1}`;
  return normalizeRemittance({
    sourceFilename: "",
    paymentReference: "",
    remittanceDate: "",
    totalPaid: 0,
    matchedCount: 0,
    unmatchedCount: 0,
    varianceCount: 0,
    lines: [],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...partial,
    id,
    documentNo,
  });
}

function amountsClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= REMITTANCE_AMOUNT_TOLERANCE;
}

function findClaimLineMatch(
  row: Omit<ClaimRemittanceLine, "id" | "lineNo" | "matchStatus" | "matchMessage" | "claimId" | "claimLineId">,
  claims: ClaimRecord[],
  clients: ClientRecord[]
): { claim: ClaimRecord; line: ClaimLine } | null {
  const byGateway = claims.filter((c) => c.gatewayRef?.trim() === row.gatewayClaimRef.trim());
  if (byGateway.length === 1) {
    const claim = byGateway[0];
    const line =
      claim.lines.find(
        (l) =>
          (!row.supportItemNumber || l.ndisSupportItem === row.supportItemNumber) &&
          (!row.serviceDate || l.serviceDate === row.serviceDate)
      ) ?? claim.lines[0];
    if (line) return { claim, line };
  }

  for (const claim of claims) {
    const client = clients.find((c) => c.id === claim.clientId);
    if (row.participantNdisNumber && client?.fundingBodyNumber?.trim() !== row.participantNdisNumber.trim()) {
      continue;
    }
    for (const line of claim.lines) {
      if (row.supportItemNumber && line.ndisSupportItem !== row.supportItemNumber) continue;
      if (row.serviceDate && line.serviceDate !== row.serviceDate) continue;
      const expected = row.claimedAmount > 0 ? row.claimedAmount : line.lineAmount;
      if (row.paidAmount > 0 && !amountsClose(row.paidAmount, expected) && !amountsClose(row.paidAmount, line.lineAmount)) {
        continue;
      }
      return { claim, line };
    }
  }
  return null;
}

export function matchRemittanceLines(
  imported: Omit<
    ClaimRemittanceLine,
    "id" | "lineNo" | "matchStatus" | "matchMessage" | "claimId" | "claimLineId"
  >[],
  claims: ClaimRecord[],
  clients: ClientRecord[]
): ClaimRemittanceLine[] {
  return imported.map((row, index) => {
    const base = emptyRemittanceLine(index + 1);
    Object.assign(base, row);

    if (!row.gatewayClaimRef?.trim() && !row.participantNdisNumber?.trim()) {
      return normalizeRemittanceLine({
        ...base,
        matchStatus: "Unmatched",
        matchMessage: "Missing gateway ref and NDIS number.",
      });
    }

    const match = findClaimLineMatch(row, claims, clients);
    if (!match) {
      return normalizeRemittanceLine({
        ...base,
        matchStatus: "Unmatched",
        matchMessage: "No matching claim line found.",
      });
    }

    const expected = match.line.lineAmount;
    const claimed = row.claimedAmount > 0 ? row.claimedAmount : expected;
    const status: RemittanceMatchStatus = amountsClose(row.paidAmount, claimed)
      ? "Matched"
      : amountsClose(row.paidAmount, expected)
        ? "Matched"
        : "Variance";

    return normalizeRemittanceLine({
      ...base,
      claimId: match.claim.id,
      claimLineId: match.line.id,
      matchStatus: status,
      matchMessage:
        status === "Matched"
          ? `Matched to ${match.claim.documentNo} line ${match.line.lineNo}.`
          : `Paid $${row.paidAmount.toFixed(2)} vs claim $${expected.toFixed(2)}.`,
    });
  });
}

export function applyRemittanceToClaims(
  remittance: ClaimRemittanceRecord,
  claims: ClaimRecord[],
  actorName: string,
  now = new Date()
): ClaimRecord[] {
  const byClaimId = new Map<string, { paid: number; lines: ClaimRemittanceLine[]; statuses: RemittanceMatchStatus[] }>();

  for (const line of remittance.lines) {
    if (!line.claimId) continue;
    const bucket = byClaimId.get(line.claimId) ?? { paid: 0, lines: [], statuses: [] };
    bucket.paid = Math.round((bucket.paid + line.paidAmount) * 100) / 100;
    bucket.lines.push(line);
    bucket.statuses.push(line.matchStatus);
    byClaimId.set(line.claimId, bucket);
  }

  const importedAt = now.toISOString();
  return claims.map((claim) => {
    const bucket = byClaimId.get(claim.id);
    if (!bucket) return claim;

    const hasVariance = bucket.statuses.includes("Variance");
    const allMatched = bucket.statuses.every((s) => s === "Matched");
    const remittanceStatus = hasVariance ? "Variance" : allMatched ? "Matched" : "Partial";

    return normalizeClaim({
      ...claim,
      status: hasVariance ? claim.status : "Accepted",
      gatewayStatus: "Paid",
      remittanceStatus,
      remittancePaidAmount: bucket.paid,
      remittancePaymentRef: remittance.paymentReference || remittance.documentNo,
      remittanceImportedAt: importedAt,
      updatedBy: actorName,
    });
  });
}

export function remittanceCsvTemplateFromClaims(claims: ClaimRecord[], clients: ClientRecord[]): string {
  const header = REMITTANCE_CSV_HEADERS.join(",");
  const rows = claims
    .filter((c) => c.gatewayRef?.trim() && c.status === "Submitted")
    .flatMap((claim) => {
      const client = clients.find((c) => c.id === claim.clientId);
      return claim.lines.map((line) =>
        [
          claim.gatewayRef,
          client?.fundingBodyNumber ?? "",
          line.ndisSupportItem,
          line.serviceDate,
          line.lineAmount.toFixed(2),
          line.lineAmount.toFixed(2),
        ].join(",")
      );
    });
  return [header, ...rows].join("\r\n");
}

export function remittanceStatusClass(status: string): string {
  switch (status) {
    case "Matched":
      return "bg-emerald-100 text-emerald-950";
    case "Variance":
      return "bg-amber-100 text-amber-950";
    case "Partial":
      return "bg-sky-100 text-sky-950";
    case "Pending":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
