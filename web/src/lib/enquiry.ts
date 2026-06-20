import model from "@/data/enquiry-model.json";
import { enquiryDropdowns } from "@/lib/reference-data";
import type { ClientActivityRow } from "@/lib/client-line-tables";
import {
  enquiryPipelineTone,
  normalizeEnquiryPipeline,
} from "@/lib/enquiry-pipeline";
import { applyEnquiryQualification, normalizeEnquiryQualification } from "@/lib/enquiry-qualification";
import { readStoredOrganization } from "@/lib/organization";

export type EnquiryActivityRow = ClientActivityRow;

export type EnquiryRecord = {
  id: string;
  documentNo: string;
  dateReceived: string;
  dateNextAction: string;
  status: string;
  lossReason: string;
  ndisNumber: string;
  planStatus: string;
  planManagementType: string;
  postcode: string;
  supportCategories: string;
  urgency: string;
  qualificationScore: number;
  qualificationTier: string;
  qualificationSummary: string;
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

export const enquiryTabs = [
  "Enquiry details",
  "Qualification",
  "Activity",
  "Participant",
  "Support needs",
] as const;

export type EnquiryTab = (typeof enquiryTabs)[number];

export const enquiryTabGroups: { label: string; tabs: EnquiryTab[] }[] = [
  { label: "Record", tabs: ["Enquiry details", "Qualification", "Activity", "Participant", "Support needs"] },
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
  const withPipeline = normalizeEnquiryPipeline({ ...record, activity });
  return applyEnquiryQualification(normalizeEnquiryQualification(withPipeline), readStoredOrganization());
}

export const initialRecords = (model.records as EnquiryRecord[]).map(normalizeEnquiry);

export function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function statusTone(status: string) {
  return enquiryPipelineTone(status);
}

export function emptyEnquiry(): EnquiryRecord {
  return {
    id: "",
    documentNo: "",
    dateReceived: new Date().toISOString().slice(0, 10),
    dateNextAction: "",
    status: "1_Enquiry received",
    lossReason: "",
    ndisNumber: "",
    planStatus: "",
    planManagementType: "",
    postcode: "",
    supportCategories: "",
    urgency: "",
    qualificationScore: 0,
    qualificationTier: "Not qualified",
    qualificationSummary: "",
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
