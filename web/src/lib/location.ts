export type LocationAlertRow = {
  id: string;
  lineNo: number;
  alertType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type LocationClientLinkRow = {
  id: string;
  lineNo: number;
  clientId: string;
  assignmentRole: string;
  primaryAssignment: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

export type LocationEmployeeLinkRow = {
  id: string;
  lineNo: number;
  employeeId: string;
  assignmentRole: string;
  primaryAssignment: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

export type LocationProductLinkRow = {
  id: string;
  lineNo: number;
  productId: string;
  active: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

export type LocationActivityRow = {
  id: string;
  lineNo: number;
  date: string;
  activityType: string;
  subject: string;
  description: string;
  createdBy: string;
};

export type LocationRecord = {
  id: string;
  searchKey: string;
  name: string;
  description: string;
  locationType: string;
  status: string;
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
  accessNotes: string;
  pictureUrl: string;
  capacity: string;
  validFrom: string;
  validTo: string;
  createdBy: string;
  updatedBy: string;
  alerts: LocationAlertRow[];
  clientLinks: LocationClientLinkRow[];
  employeeLinks: LocationEmployeeLinkRow[];
  productLinks: LocationProductLinkRow[];
  activities: LocationActivityRow[];
};

export const locationTabs = [
  "Overview",
  "Contact & address",
  "Alerts",
  "Clients",
  "Employees",
  "Incidents",
  "Products & services",
  "Activity",
] as const;

export type LocationTab = (typeof locationTabs)[number];

export type LocationTabGroup = {
  label: string;
  tabs: LocationTab[];
};

export const locationTabGroups: LocationTabGroup[] = [
  { label: "Location", tabs: ["Overview", "Contact & address"] },
  { label: "Relationships", tabs: ["Alerts", "Clients", "Employees", "Incidents"] },
  { label: "Services", tabs: ["Products & services"] },
  { label: "History", tabs: ["Activity"] },
];

export const locationTypeOptions = [
  "SIL house",
  "Day program",
  "Community hub",
  "Office",
  "Respite",
  "Therapy room",
  "Other",
] as const;

export const locationStatusOptions = ["Active", "Inactive", "Planned", "Closed"] as const;

export const locationClientRoleOptions = ["Resident", "Regular attendee", "Occasional", "Visitor"] as const;

export const locationEmployeeRoleOptions = [
  "Site manager",
  "Support worker",
  "Team leader",
  "Relief staff",
  "Allied health",
  "Other",
] as const;

export const locationAlertTypeOptions = [
  "Safety",
  "Access",
  "Operational",
  "Clinical",
  "Maintenance",
  "Other",
] as const;

export const locationActivityTypeOptions = [
  "Site visit",
  "Maintenance",
  "Incident follow-up",
  "Phone call",
  "Note",
  "Other",
] as const;

export const locationDropdowns: Record<string, string[]> = {
  locationType: [...locationTypeOptions],
  locationStatus: [...locationStatusOptions],
  locationClientRole: [...locationClientRoleOptions],
  locationEmployeeRole: [...locationEmployeeRoleOptions],
  locationAlertType: [...locationAlertTypeOptions],
  locationActivityType: [...locationActivityTypeOptions],
  showAsAlert: ["Yes", "No"],
  yesNo: ["Yes", "No"],
};

export const locationOverviewFields: (keyof LocationRecord)[] = [
  "searchKey",
  "name",
  "locationType",
  "status",
  "description",
  "capacity",
  "validFrom",
  "validTo",
];

export const locationContactFields: (keyof LocationRecord)[] = [
  "address1",
  "address2",
  "address3",
  "city",
  "state",
  "postcode",
  "country",
  "phone",
  "mobile",
  "email",
  "accessNotes",
];

export function createLocation(
  partial: Partial<LocationRecord> & Pick<LocationRecord, "name">,
  existing: LocationRecord[] = []
): LocationRecord {
  const id = partial.id ?? `loc-${Date.now()}`;
  const used = new Set(existing.map((l) => l.searchKey.toLowerCase()));
  let searchKey =
    partial.searchKey ??
    (partial.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "LOC");
  if (used.has(searchKey.toLowerCase())) {
    searchKey = `${searchKey}${existing.length + 1}`;
  }
  return normalizeLocation({
    id,
    searchKey,
    name: partial.name,
    description: partial.description ?? "",
    locationType: partial.locationType ?? "SIL house",
    status: partial.status ?? "Active",
    address1: partial.address1 ?? "",
    address2: partial.address2 ?? "",
    address3: partial.address3 ?? "",
    city: partial.city ?? "",
    state: partial.state ?? "SA",
    postcode: partial.postcode ?? "",
    country: partial.country ?? "Australia",
    phone: partial.phone ?? "",
    mobile: partial.mobile ?? "",
    email: partial.email ?? "",
    accessNotes: partial.accessNotes ?? "",
    pictureUrl: partial.pictureUrl ?? "",
    capacity: partial.capacity ?? "",
    validFrom: partial.validFrom ?? new Date().toISOString().slice(0, 10),
    validTo: partial.validTo ?? "",
    createdBy: partial.createdBy ?? "SuperUser",
    updatedBy: partial.updatedBy ?? "SuperUser",
    alerts: partial.alerts ?? [],
    clientLinks: partial.clientLinks ?? [],
    employeeLinks: partial.employeeLinks ?? [],
    productLinks: partial.productLinks ?? [],
    activities: partial.activities ?? [],
  });
}

export function normalizeLocation(record: LocationRecord): LocationRecord {
  return {
    ...record,
    alerts: (record.alerts ?? []).map((a, i) => ({ ...a, lineNo: a.lineNo || i + 1 })),
    clientLinks: (record.clientLinks ?? []).map((l, i) => ({ ...l, lineNo: l.lineNo || i + 1 })),
    employeeLinks: (record.employeeLinks ?? []).map((l, i) => ({ ...l, lineNo: l.lineNo || i + 1 })),
    productLinks: (record.productLinks ?? []).map((l, i) => ({ ...l, lineNo: l.lineNo || i + 1 })),
    activities: (record.activities ?? []).map((a, i) => ({ ...a, lineNo: a.lineNo || i + 1 })),
  };
}

export function locationAddressLine(record: Pick<LocationRecord, "address1" | "city" | "state" | "postcode">) {
  const parts = [record.address1, record.city, record.state, record.postcode].filter(Boolean);
  return parts.join(", ");
}

export const initialLocations: LocationRecord[] = [
  {
    id: "loc-glenelg-sil",
    searchKey: "GLEN-SIL",
    name: "Glenelg SIL House",
    description: "Shared independent living — 3 residents, 24/7 active overnight support.",
    locationType: "SIL house",
    status: "Active",
    address1: "22 Partridge Street",
    address2: "",
    address3: "",
    city: "Glenelg",
    state: "SA",
    postcode: "5045",
    country: "Australia",
    phone: "08 8294 2200",
    mobile: "",
    email: "glenelg.sil@abilityapp.local",
    accessNotes: "Ramp at rear. Key safe code on file with on-call manager.",
    pictureUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=640&h=400&fit=crop",
    capacity: "3",
    validFrom: "2022-03-01",
    validTo: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    alerts: [
      {
        id: "loc-alert-glen-fire",
        lineNo: 1,
        alertType: "Safety",
        showAsAlert: "Yes",
        name: "Fire drill quarterly",
        description: "Residents require verbal prompting during evacuations.",
        validFrom: "2024-01-01",
        validTo: "",
      },
    ],
    clientLinks: [
      {
        id: "loc-cli-bern",
        lineNo: 1,
        clientId: "bp-bern",
        assignmentRole: "Resident",
        primaryAssignment: "Yes",
        validFrom: "2022-03-01",
        validTo: "",
        notes: "Primary SIL placement",
      },
    ],
    employeeLinks: [
      {
        id: "loc-emp-isla",
        lineNo: 1,
        employeeId: "emp-isla",
        assignmentRole: "Site manager",
        primaryAssignment: "Yes",
        validFrom: "2022-03-01",
        validTo: "",
        notes: "",
      },
      {
        id: "loc-emp-gab",
        lineNo: 2,
        employeeId: "emp-gabriela",
        assignmentRole: "Support worker",
        primaryAssignment: "No",
        validFrom: "2023-06-01",
        validTo: "",
        notes: "Regular weekday shifts",
      },
    ],
    productLinks: [
      {
        id: "loc-prod-glen-sil",
        lineNo: 1,
        productId: "prod-sil-wd",
        active: "Yes",
        validFrom: "2022-03-01",
        validTo: "",
        notes: "Primary SIL weekday service",
      },
      {
        id: "loc-prod-glen-trans",
        lineNo: 2,
        productId: "prod-transport",
        active: "Yes",
        validFrom: "2022-03-01",
        validTo: "",
        notes: "Provider travel for community access",
      },
    ],
    activities: [
      {
        id: "loc-act-glen-1",
        lineNo: 1,
        date: "2025-05-10",
        activityType: "Site visit",
        subject: "Quarterly safety walkthrough",
        description: "Checked exits, fire equipment, and access ramp condition.",
        createdBy: "Isla Robinson",
      },
    ],
  },
  {
    id: "loc-adelaide-hub",
    searchKey: "ADL-HUB",
    name: "Adelaide Day Hub",
    description: "Community participation and skills development — weekday program.",
    locationType: "Day program",
    status: "Active",
    address1: "100 King William Street",
    address2: "Level 2",
    address3: "",
    city: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "Australia",
    phone: "08 8123 4500",
    mobile: "",
    email: "dayhub@abilityapp.local",
    accessNotes: "Lift access from ground floor. Visitor sign-in at reception.",
    pictureUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=400&fit=crop",
    capacity: "20",
    validFrom: "2021-01-15",
    validTo: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    alerts: [],
    clientLinks: [],
    employeeLinks: [
      {
        id: "loc-emp-michael",
        lineNo: 1,
        employeeId: "emp-michael",
        assignmentRole: "Team leader",
        primaryAssignment: "Yes",
        validFrom: "2021-01-15",
        validTo: "",
        notes: "",
      },
    ],
    productLinks: [
      {
        id: "loc-prod-hub-cp",
        lineNo: 1,
        productId: "prod-cp",
        active: "Yes",
        validFrom: "2021-01-15",
        validTo: "",
        notes: "Core day program offering",
      },
    ],
    activities: [],
  },
];
