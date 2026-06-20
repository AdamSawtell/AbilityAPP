export type ServiceAgreementLine = {
  id: string;
  lineNo: number;
  productId: string;
  name: string;
  description: string;
  plannedPrice: string;
  registrationGroup: string;
  fundingType: string;
  fundingBody: string;
  fundingManagementType: string;
  budgetRules: string;
};

export type ServiceAgreementRecord = {
  id: string;
  searchKey: string;
  name: string;
  description: string;
  clientId: string;
  priceListId: string;
  term: string;
  status: string;
  executionDate: string;
  contractDate: string;
  finishDate: string;
  reviewDate: string;
  totalPlannedAmount: string;
  sentAt: string;
  signedAt: string;
  activatedAt: string;
  lines: ServiceAgreementLine[];
  createdBy: string;
  updatedBy: string;
};

export const serviceAgreementDropdowns = {
  term: ["Fixed Term", "Ongoing"],
  status: ["Draft", "Sent", "Signed", "Active", "Expiring", "Expired", "Terminated", "Cancelled"],
  fundingType: ["Funding Body", "Self Funded"],
  fundingManagementType: ["Portal Managed", "Plan Managed", "Self Managed"],
  budgetRules: ["Strict Limit", "Warning", "Allow over budget"],
  registrationGroup: [
    "Supported Independent Living",
    "Assistance With Daily Life Tasks In A Group Or Shared Living",
    "Participation In Community And Social And Civic Activities",
    "Specialised Disability Accommodation",
  ],
};

export const initialServiceAgreements: ServiceAgreementRecord[] = [
  {
    id: "sa-rose-ni",
    searchKey: "ROSE_Rose Ni",
    name: "NDIS Service Agreement",
    description: "High intensity supports — SIL and community participation",
    clientId: "bp-bern",
    priceListId: "pl-ndis-2024",
    term: "Fixed Term",
    status: "Active",
    executionDate: "2025-06-09",
    contractDate: "2025-06-09",
    finishDate: "2026-06-30",
    reviewDate: "2026-03-01",
    totalPlannedAmount: "12057.83",
    sentAt: "2025-06-01",
    signedAt: "2025-06-08",
    activatedAt: "2025-06-09",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
    lines: [
      {
        id: "sal-1",
        lineNo: 10,
        productId: "prod-sil-wd",
        name: "SIL",
        description: "SIL",
        plannedPrice: "10907.80",
        registrationGroup: "Supported Independent Living",
        fundingType: "Funding Body",
        fundingBody: "NDIS - National Disability Insurance Scheme",
        fundingManagementType: "Portal Managed",
        budgetRules: "Strict Limit",
      },
      {
        id: "sal-2",
        lineNo: 20,
        productId: "prod-cp",
        name: "Community Participation",
        description: "Assistance with social and community participation",
        plannedPrice: "450.03",
        registrationGroup: "Participation In Community And Social And Civic Activities",
        fundingType: "Funding Body",
        fundingBody: "NDIS - National Disability Insurance Scheme",
        fundingManagementType: "Portal Managed",
        budgetRules: "Warning",
      },
    ],
  },
];

export function sumPlannedAmounts(lines: ServiceAgreementLine[]): string {
  const total = lines.reduce((sum, line) => sum + (parseFloat(line.plannedPrice) || 0), 0);
  return total.toFixed(2);
}

export function normalizeServiceAgreement(record: ServiceAgreementRecord): ServiceAgreementRecord {
  const lines = record.lines.map((line, index) => ({
    ...line,
    lineNo: line.lineNo ?? (index + 1) * 10,
  }));
  const totalPlannedAmount = sumPlannedAmounts(lines);
  return {
    ...record,
    lines,
    totalPlannedAmount,
    sentAt: record.sentAt ?? "",
    signedAt: record.signedAt ?? "",
    activatedAt: record.activatedAt ?? "",
  };
}

export function createServiceAgreement(
  partial: ServiceAgreementRecord,
  existing: ServiceAgreementRecord[]
): ServiceAgreementRecord {
  const id = partial.id || `sa-${Date.now()}`;
  const used = new Set(existing.map((r) => r.searchKey));
  let searchKey = partial.searchKey || `SA-${existing.length + 1}`;
  if (used.has(searchKey)) searchKey = `${searchKey}-${existing.length + 1}`;
  return normalizeServiceAgreement({
    ...partial,
    id,
    searchKey,
    lines: partial.lines ?? [],
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}
