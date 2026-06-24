/** Agency worker — staffed via external vendor, not a full employee record. */
export type AgencyWorkerRecord = {
  id: string;
  searchKey: string;
  vendorBpId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  qualifications: string;
  skills: string;
  toolsNotes: string;
  active: boolean;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export const agencyWorkerDropdowns = {
  status: ["Active", "Inactive"],
};

export const initialAgencyWorkers: AgencyWorkerRecord[] = [
  {
    id: "aw-sp-jane",
    searchKey: "Jane Agency",
    vendorBpId: "bp-staffplus",
    firstName: "Jane",
    lastName: "Agency",
    name: "Jane Agency",
    email: "jane.agency@staffplus.example",
    phone: "0400 111 222",
    qualifications: "Cert III Individual Support",
    skills: "SIL, personal care, manual handling",
    toolsNotes: "Own vehicle",
    active: true,
    notes: "Regular relief at Glenelg SIL.",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  },
  {
    id: "aw-sp-mike",
    searchKey: "Mike Relief",
    vendorBpId: "bp-staffplus",
    firstName: "Mike",
    lastName: "Relief",
    name: "Mike Relief",
    email: "mike.relief@staffplus.example",
    phone: "0400 333 444",
    qualifications: "Cert IV Disability",
    skills: "Community access, behaviour support",
    toolsNotes: "",
    active: true,
    notes: "Weekend relief pool.",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  },
];

export function agencyWorkerDisplayName(record: AgencyWorkerRecord): string {
  return record.name?.trim() || `${record.firstName} ${record.lastName}`.trim() || record.searchKey;
}

export function normalizeAgencyWorker(record: AgencyWorkerRecord): AgencyWorkerRecord {
  const firstName = record.firstName?.trim() ?? "";
  const lastName = record.lastName?.trim() ?? "";
  const name =
    record.name?.trim() ||
    `${firstName} ${lastName}`.trim() ||
    record.searchKey?.trim() ||
    "Agency worker";
  return {
    ...record,
    searchKey: record.searchKey?.trim() || name,
    vendorBpId: record.vendorBpId ?? "",
    firstName,
    lastName,
    name,
    email: record.email ?? "",
    phone: record.phone ?? "",
    qualifications: record.qualifications ?? "",
    skills: record.skills ?? "",
    toolsNotes: record.toolsNotes ?? "",
    active: record.active !== false,
    notes: record.notes ?? "",
    createdBy: record.createdBy ?? "SuperUser",
    updatedBy: record.updatedBy ?? "SuperUser",
  };
}

export function createAgencyWorker(
  partial: Partial<AgencyWorkerRecord>,
  existing: AgencyWorkerRecord[]
): AgencyWorkerRecord {
  const id = partial.id?.trim() || `aw-${Date.now()}`;
  return normalizeAgencyWorker({
    id,
    searchKey: "",
    vendorBpId: "",
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    qualifications: "",
    skills: "",
    toolsNotes: "",
    active: true,
    notes: "",
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
    ...partial,
  });
}

export function agencyWorkersForVendor(
  workers: AgencyWorkerRecord[],
  vendorBpId: string,
  activeOnly = true
): AgencyWorkerRecord[] {
  return workers
    .filter((w) => w.vendorBpId === vendorBpId && (!activeOnly || w.active))
    .map(normalizeAgencyWorker);
}

export function isAgencyVendorPartner(partnerType: string): boolean {
  const t = partnerType?.trim().toLowerCase() ?? "";
  return t === "ndis agency" || t === "vendor";
}
