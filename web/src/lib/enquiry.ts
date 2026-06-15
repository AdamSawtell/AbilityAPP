import model from "@/data/enquiry-model.json";
import { enquiryDropdowns } from "@/lib/reference-data";
import type { ClientActivityRow } from "@/lib/client-line-tables";

export type EnquiryActivityRow = ClientActivityRow;

export type EnquiryRecord = {
  id: string;
  documentNo: string;
  dateReceived: string;
  dateNextAction: string;
  status: string;
  firstName: string;
  lastName: string;
  fundingBody: string;
  disability: string;
  services: string;
  isEnquiryForSelf: string;
  thirdPartyConsent: string;
  relationshipType: string;
  phone: string;
  email: string;
  birthday: string;
  gender: string;
  preferredCommunicationMethod: string;
  bpName: string;
  enquirySource: string;
  description: string;
  outcome: string;
  additionalDisabilityInformation: string;
  other: string;
  createdBy: string;
  updatedBy: string;
  activity: EnquiryActivityRow[];
};

export type FieldDef = {
  key: keyof EnquiryRecord;
  label: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "select";
  optionsKey?: string;
  readOnly?: boolean;
};

export type FormSection = {
  title: string;
  fields: FieldDef[];
};

export const enquiryTabs = ["Enquiry details", "Participant", "Support needs", "Activity"] as const;

export type EnquiryTab = (typeof enquiryTabs)[number];

export const enquiryTabGroups: { label: string; tabs: EnquiryTab[] }[] = [
  { label: "Record", tabs: ["Enquiry details", "Participant", "Support needs"] },
  { label: "Work", tabs: ["Activity"] },
];

export const enquiryModel = model;
export const listColumns = model.listColumns;
export const queryNames = model.queryNames;
export const formSections = model.formSections as FormSection[];
export const dropdowns = enquiryDropdowns;

export function normalizeEnquiry(record: EnquiryRecord): EnquiryRecord {
  const activity = (record.activity ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  return { ...record, activity };
}

export const initialRecords = (model.records as EnquiryRecord[]).map(normalizeEnquiry);

export function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function statusTone(status: string) {
  if (status.startsWith("1_")) return "sky";
  if (status.startsWith("2_")) return "amber";
  if (status.startsWith("4_")) return "emerald";
  if (status.startsWith("5_")) return "zinc";
  return "slate";
}

export function emptyEnquiry(): EnquiryRecord {
  return {
    id: "",
    documentNo: "",
    dateReceived: new Date().toISOString().slice(0, 10),
    dateNextAction: "",
    status: "1_Initial Enquiry",
    firstName: "",
    lastName: "",
    fundingBody: "",
    disability: "",
    services: "",
    isEnquiryForSelf: "Yes",
    thirdPartyConsent: "Requested",
    relationshipType: "",
    phone: "",
    email: "",
    birthday: "",
    gender: "",
    preferredCommunicationMethod: "Email",
    bpName: "",
    enquirySource: "Phone Call",
    description: "",
    outcome: "",
    additionalDisabilityInformation: "",
    other: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    activity: [],
  };
}

export function nextEnquiryId(existing: EnquiryRecord[]): { id: string; documentNo: string } {
  const max = existing.reduce((highest, row) => {
    const n = Number.parseInt(row.id, 10);
    return Number.isFinite(n) && n > highest ? n : highest;
  }, 1_000_000);
  const next = String(max + 1);
  return { id: next, documentNo: next };
}

export function createEnquiry(
  partial: EnquiryRecord,
  existing: EnquiryRecord[]
): EnquiryRecord {
  const { id, documentNo } = nextEnquiryId(existing);
  return normalizeEnquiry({
    ...emptyEnquiry(),
    ...partial,
    id,
    documentNo,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}
