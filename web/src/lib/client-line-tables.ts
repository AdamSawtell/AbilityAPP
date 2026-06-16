export type LineColumnType = "text" | "date" | "select" | "textarea" | "number";

export type LineColumnDef<TRow extends { id: string }> = {
  key: keyof TRow & string;
  label: string;
  type: LineColumnType;
  optionsKey?: string;
  required?: boolean;
  className?: string;
};

export type ClientAlertRow = {
  id: string;
  lineNo: number;
  alertType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type ClientActivityRow = {
  id: string;
  lineNo: number;
  date: string;
  activityType: string;
  subject: string;
  description: string;
  createdBy: string;
};

export type ClientRestrictivePracticeRow = {
  id: string;
  lineNo: number;
  practiceType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type ClientConsentRow = {
  id: string;
  lineNo: number;
  consentType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type ClientLocationRow = {
  id: string;
  lineNo: number;
  name: string;
  addressType: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  postToAddress: string;
  invoiceAddress: string;
  shipToAddress: string;
  serviceDeliveryAddress: string;
  active: string;
  validFrom: string;
  validTo: string;
  accessNotes: string;
  description: string;
};

export type ClientLineCollectionKey =
  | "alerts"
  | "activity"
  | "locations"
  | "restrictivePractices"
  | "consents";

export type ClientTabTableConfig<TRow extends { id: string }> = {
  collectionKey: ClientLineCollectionKey;
  columns: LineColumnDef<TRow>[];
  emptyRow: (lineNo: number) => TRow;
  addLabel?: string;
  emptyMessage?: string;
};

let lineId = 0;
export function newLineId(prefix: string) {
  lineId += 1;
  return `${prefix}-${Date.now()}-${lineId}`;
}

export const alertTableConfig: ClientTabTableConfig<ClientAlertRow> = {
  collectionKey: "alerts",
  addLabel: "Add alert",
  emptyMessage: "No alerts yet. Add one to flag risks or incidents for this client.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "alertType", label: "Alert type", type: "select", optionsKey: "alertType", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("alert"),
    lineNo,
    alertType: "",
    showAsAlert: "No",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const activityTableConfig: ClientTabTableConfig<ClientActivityRow> = {
  collectionKey: "activity",
  addLabel: "Add activity",
  emptyMessage: "No activity logged yet. Record calls, visits, and notes here.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "activityType", label: "Type", type: "select", optionsKey: "activityType" },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "createdBy", label: "Created by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("activity"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Note",
    subject: "",
    description: "",
    createdBy: "SuperUser",
  }),
};

export const restrictivePracticeTableConfig: ClientTabTableConfig<ClientRestrictivePracticeRow> = {
  collectionKey: "restrictivePractices",
  addLabel: "Add restrictive practice",
  emptyMessage:
    "No restrictive practices recorded. Document any regulated restrictive practices authorised for this support receiver.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    {
      key: "practiceType",
      label: "Practice type",
      type: "select",
      optionsKey: "restrictivePracticeType",
      required: true,
    },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("rp"),
    lineNo,
    practiceType: "",
    showAsAlert: "Yes",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const consentTableConfig: ClientTabTableConfig<ClientConsentRow> = {
  collectionKey: "consents",
  addLabel: "Add consent or legal order",
  emptyMessage:
    "No consents or legal orders recorded. Add photo consent, information sharing agreements, guardianship orders, and similar items here.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "consentType", label: "Consent type", type: "select", optionsKey: "consentType", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("consent"),
    lineNo,
    consentType: "",
    showAsAlert: "Yes",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const clientTabTableConfigs = {
  Alerts: alertTableConfig,
  Activity: activityTableConfig,
  "Restrictive Practices": restrictivePracticeTableConfig,
  "Consents and Legal Orders": consentTableConfig,
} as const;

export function formatLocationAddress(loc: Pick<ClientLocationRow, "address1" | "address2" | "address3" | "city" | "state" | "postcode" | "country">) {
  const line = [loc.address1, loc.address2, loc.address3].filter(Boolean).join(", ");
  const locality = [loc.city, loc.state, loc.postcode].filter(Boolean).join(" ");
  return [line, locality, loc.country].filter(Boolean).join(" · ") || "—";
}

export function locationFlags(loc: ClientLocationRow) {
  const flags: string[] = [];
  if (loc.postToAddress === "Yes") flags.push("Post to");
  if (loc.invoiceAddress === "Yes") flags.push("Invoice");
  if (loc.shipToAddress === "Yes") flags.push("Ship to");
  if (loc.serviceDeliveryAddress === "Yes") flags.push("Service delivery");
  return flags;
}

export const emptyLocationRow = (lineNo: number): ClientLocationRow => ({
  id: newLineId("loc"),
  lineNo,
  name: "",
  addressType: "Home",
  address1: "",
  address2: "",
  address3: "",
  city: "",
  state: "SA",
  postcode: "",
  country: "Australia",
  phone: "",
  mobile: "",
  email: "",
  postToAddress: "No",
  invoiceAddress: "No",
  shipToAddress: "No",
  serviceDeliveryAddress: "No",
  active: "Yes",
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: "",
  accessNotes: "",
  description: "",
});

export type ClientTabWithTable = keyof typeof clientTabTableConfigs;

export function renumberLines<TRow extends { id: string; lineNo: number }>(rows: TRow[]): TRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

export function buildConsentAlertList(consents: ClientConsentRow[]): string {
  return consents
    .filter((c) => c.showAsAlert === "Yes" && (c.name.trim() || c.consentType.trim()))
    .map((c) => `Consent-${c.name.trim() || c.consentType}`)
    .join("; ");
}

export function transferActivitiesToClient(
  sourceActivities: ClientActivityRow[],
  existingClientActivities: ClientActivityRow[] = []
): ClientActivityRow[] {
  if (!sourceActivities.length) return existingClientActivities;
  const transferred = sourceActivities.map((row, index) => ({
    ...row,
    id: newLineId("activity"),
    lineNo: existingClientActivities.length + index + 1,
  }));
  return renumberLines([...existingClientActivities, ...transferred]);
}
