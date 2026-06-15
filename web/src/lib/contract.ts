import type { ContractAuditRow } from "@/lib/contract-fields";

export type ContractRecord = {
  id: string;
  documentNo: string;
  clientId: string;
  businessPartnerName: string;
  contractType: string;
  name: string;
  description: string;
  contractTerm: string;
  executionDate: string;
  startDate: string;
  endDate: string;
  reviewDate: string;
  reference: string;
  project: string;
  createdBy: string;
  updatedBy: string;
  audit: ContractAuditRow[];
};

export const contractDropdowns = {
  contractType: ["Supplier Contract", "Tenancy Agreeement", "NDIS Service Agreement", "Employee Contract"],
  contractTerm: ["Fixed", "Ongoing"],
  auditAction: ["Created", "Updated", "Reviewed", "Renewed", "Terminated"],
};

export const initialContracts: ContractRecord[] = [
  {
    id: "ctr-1000001",
    documentNo: "1000001",
    clientId: "",
    businessPartnerName: "Adelaide Property Managers",
    contractType: "Tenancy Agreeement",
    name: "Rover Road Residential tenancy Agreement",
    description: "Rover Road Residential tenancy Agreement - Demo File with DMS attachment",
    contractTerm: "Fixed",
    executionDate: "2022-05-07",
    startDate: "2022-05-08",
    endDate: "2025-05-07",
    reviewDate: "2024-05-25",
    reference: "ROVER-TEN-001",
    project: "",
    createdBy: "Isla Robinson",
    updatedBy: "Jessica Hancock",
    audit: [
      {
        id: "aud-1",
        lineNo: 1,
        auditDate: "2022-05-07",
        changedBy: "Isla Robinson",
        action: "Created",
        description: "Contract created",
      },
      {
        id: "aud-2",
        lineNo: 2,
        auditDate: "2024-05-25",
        changedBy: "Jessica Hancock",
        action: "Reviewed",
        description: "Annual tenancy review completed",
      },
    ],
  },
  {
    id: "ctr-1000002",
    documentNo: "1000002",
    clientId: "bp-bern",
    businessPartnerName: "Bernadette Rose",
    contractType: "NDIS Service Agreement",
    name: "NDIS Support Agreement - Bernadette Rose",
    description: "Primary service agreement covering SIL, community access, and therapy supports.",
    contractTerm: "Fixed",
    executionDate: "2021-01-05",
    startDate: "2021-01-05",
    endDate: "2026-06-30",
    reviewDate: "2025-06-26",
    reference: "NDIS-PLAN-BERN",
    project: "",
    createdBy: "Isla Robinson",
    updatedBy: "SuperUser",
    audit: [
      {
        id: "aud-b1",
        lineNo: 1,
        auditDate: "2021-01-05",
        changedBy: "Isla Robinson",
        action: "Created",
        description: "Linked to client Bernadette Rose",
      },
      {
        id: "aud-b2",
        lineNo: 2,
        auditDate: "2024-02-14",
        changedBy: "Isla Robinson",
        action: "Updated",
        description: "PACE transition dates updated",
      },
    ],
  },
];

export function formatContractDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function contractStatus(contract: ContractRecord): "active" | "review" | "expired" | "upcoming" {
  const today = new Date().toISOString().slice(0, 10);
  if (contract.startDate && contract.startDate > today) return "upcoming";
  if (contract.endDate && contract.endDate < today) return "expired";
  if (contract.reviewDate && contract.reviewDate <= today) return "review";
  return "active";
}

export function nextContractId(existing: ContractRecord[]): { id: string; documentNo: string } {
  const max = existing.reduce((highest, row) => {
    const n = Number.parseInt(row.documentNo, 10);
    return Number.isFinite(n) && n > highest ? n : highest;
  }, 1_000_000);
  const next = String(max + 1);
  return { id: `ctr-${next}`, documentNo: next };
}

export function emptyContract(clientId: string, businessPartnerName: string): ContractRecord {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: "",
    documentNo: "",
    clientId,
    businessPartnerName,
    contractType: "NDIS Service Agreement",
    name: "",
    description: "",
    contractTerm: "Fixed",
    executionDate: today,
    startDate: today,
    endDate: "",
    reviewDate: "",
    reference: "",
    project: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    audit: [],
  };
}

export function createContract(partial: ContractRecord, existing: ContractRecord[]): ContractRecord {
  const { id, documentNo } = nextContractId(existing);
  return {
    ...emptyContract(partial.clientId, partial.businessPartnerName),
    ...partial,
    id,
    documentNo,
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    audit: partial.audit?.length
      ? partial.audit
      : [
          {
            id: `aud-${id}`,
            lineNo: 1,
            auditDate: new Date().toISOString().slice(0, 10),
            changedBy: "SuperUser",
            action: "Created",
            description: "Contract created",
          },
        ],
  };
}

export function normalizeContract(contract: ContractRecord): ContractRecord {
  const audit = (contract.audit ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  return { ...contract, audit };
}
