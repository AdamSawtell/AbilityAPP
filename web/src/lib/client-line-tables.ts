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

export type ClientLineCollectionKey = "alerts" | "activity" | "locations";

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

export const clientTabTableConfigs = {
  Alerts: alertTableConfig,
  Activity: activityTableConfig,
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
