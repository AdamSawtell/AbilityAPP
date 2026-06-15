export type EmployeeCredentialRow = {
  id: string;
  lineNo: number;
  credentialType: string;
  credentialNumber: string;
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  documentRef: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export type EmployeeRecord = {
  id: string;
  searchKey: string;
  businessPartnerGroup: string;
  name: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  middleName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  department: string;
  employmentStatus: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  updatedBy: string;
  credentials: EmployeeCredentialRow[];
};

export type EmployeeTabGroup = {
  label: string;
  tabs: string[];
};

/** Tab layout on Business Partner (Employee) — each tab maps to a dependent window in catalog.ts */
export const employeeTabGroups: EmployeeTabGroup[] = [
  {
    label: "Employee",
    tabs: ["Overview", "Contact", "Employment"],
  },
  {
    label: "Compliance",
    tabs: ["Credentials Assigned"],
  },
  {
    label: "Organisation",
    tabs: ["Locations", "System access"],
  },
];

export const employeeOverviewFields: (keyof EmployeeRecord)[] = [
  "searchKey",
  "name",
  "firstName",
  "lastName",
  "preferredName",
  "employmentStatus",
  "businessPartnerGroup",
];

export const employeeContactFields: (keyof EmployeeRecord)[] = [
  "email",
  "phone",
  "mobile",
  "middleName",
];

export const employeeEmploymentFields: (keyof EmployeeRecord)[] = [
  "jobTitle",
  "department",
  "startDate",
  "endDate",
];

export const employmentStatusOptions = ["Active", "On leave", "Terminated"] as const;

export const departmentOptions = [
  "Executive",
  "Intake",
  "Client services",
  "Support coordination",
  "Finance",
  "HR",
  "IT",
  "Operations",
] as const;

export const employeeListColumns = [
  { key: "searchKey" as const, label: "Search key" },
  { key: "name" as const, label: "Name" },
  { key: "jobTitle" as const, label: "Job title" },
  { key: "department" as const, label: "Department" },
  { key: "employmentStatus" as const, label: "Status" },
  { key: "email" as const, label: "Email" },
];

export const initialEmployees: EmployeeRecord[] = [
  {
    id: "emp-isla",
    searchKey: "IslaR",
    businessPartnerGroup: "Employee",
    name: "Isla Robinson",
    firstName: "Isla",
    lastName: "Robinson",
    preferredName: "Isla",
    middleName: "",
    email: "isla.robinson@abilityerp.local",
    phone: "08 8294 1100",
    mobile: "0412 111 222",
    jobTitle: "Support Coordinator",
    department: "Client services",
    employmentStatus: "Active",
    startDate: "2019-03-01",
    endDate: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [
      {
        id: "cred-isla-wwcc",
        lineNo: 1,
        credentialType: "Working with Children Check",
        credentialNumber: "WWCC-88421",
        issuingBody: "SA Department for Education",
        issueDate: "2023-04-01",
        expiryDate: "2028-04-01",
        status: "Current",
        documentRef: "DOC-WWCC-88421",
        notes: "",
        createdBy: "SuperUser",
        updatedBy: "SuperUser",
      },
      {
        id: "cred-isla-ndis",
        lineNo: 2,
        credentialType: "NDIS Worker Screening",
        credentialNumber: "NDIS-WS-442901",
        issuingBody: "NDIS Worker Screening Unit",
        issueDate: "2022-11-15",
        expiryDate: "2027-11-15",
        status: "Current",
        documentRef: "DOC-NDIS-442901",
        notes: "",
        createdBy: "SuperUser",
        updatedBy: "SuperUser",
      },
    ],
  },
  {
    id: "emp-gabriela",
    searchKey: "GabW",
    businessPartnerGroup: "Employee",
    name: "Gabriela Wilson",
    firstName: "Gabriela",
    lastName: "Wilson",
    preferredName: "Gabriela",
    middleName: "",
    email: "gabriela.wilson@abilityerp.local",
    phone: "",
    mobile: "0413 222 333",
    jobTitle: "Intake Officer",
    department: "Intake",
    employmentStatus: "Active",
    startDate: "2020-06-15",
    endDate: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [
      {
        id: "cred-gab-wwcc",
        lineNo: 1,
        credentialType: "Working with Children Check",
        credentialNumber: "WWCC-91002",
        issuingBody: "SA Department for Education",
        issueDate: "2024-01-10",
        expiryDate: "2029-01-10",
        status: "Current",
        documentRef: "",
        notes: "",
        createdBy: "SuperUser",
        updatedBy: "SuperUser",
      },
    ],
  },
  {
    id: "emp-michael",
    searchKey: "MichS",
    businessPartnerGroup: "Employee",
    name: "Michael Smith",
    firstName: "Michael",
    lastName: "Smith",
    preferredName: "Michael",
    middleName: "",
    email: "michael.smith@abilityerp.local",
    phone: "",
    mobile: "",
    jobTitle: "Team Leader",
    department: "Support coordination",
    employmentStatus: "Active",
    startDate: "2018-01-10",
    endDate: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [],
  },
  {
    id: "emp-oliver",
    searchKey: "OlvW",
    businessPartnerGroup: "Employee",
    name: "Oliver Williams",
    firstName: "Oliver",
    lastName: "Williams",
    preferredName: "Oliver",
    middleName: "",
    email: "oliver.williams@abilityerp.local",
    phone: "",
    mobile: "",
    jobTitle: "Support Worker",
    department: "Operations",
    employmentStatus: "Active",
    startDate: "2021-09-01",
    endDate: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [],
  },
  {
    id: "emp-rose",
    searchKey: "RoseD",
    businessPartnerGroup: "Employee",
    name: "Rose Dash",
    firstName: "Rose",
    lastName: "Dash",
    preferredName: "Rose",
    middleName: "",
    email: "rose.dash@abilityerp.local",
    phone: "",
    mobile: "",
    jobTitle: "Plan Developer",
    department: "Client services",
    employmentStatus: "Active",
    startDate: "2017-11-20",
    endDate: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [],
  },
  {
    id: "emp-jessica",
    searchKey: "JessH",
    businessPartnerGroup: "Employee",
    name: "Jessica Hancock",
    firstName: "Jessica",
    lastName: "Hancock",
    preferredName: "Jessica",
    middleName: "",
    email: "jessica.hancock@abilityerp.local",
    phone: "",
    mobile: "",
    jobTitle: "Contract Administrator",
    department: "Finance",
    employmentStatus: "Active",
    startDate: "2022-02-01",
    endDate: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [],
  },
];

export function normalizeEmployee(record: EmployeeRecord): EmployeeRecord {
  const name =
    record.name?.trim() ||
    `${record.firstName} ${record.lastName}`.trim() ||
    record.searchKey;
  const credentials = (record.credentials ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  return { ...record, name, businessPartnerGroup: record.businessPartnerGroup || "Employee", credentials };
}

export function createEmployee(
  partial: EmployeeRecord,
  existing: EmployeeRecord[]
): EmployeeRecord {
  const id = partial.id || `emp-${Date.now()}`;
  const used = new Set(existing.map((e) => e.searchKey.toLowerCase()));
  let searchKey = partial.searchKey || partial.firstName.slice(0, 3) + partial.lastName.slice(0, 1);
  if (used.has(searchKey.toLowerCase())) {
    searchKey = `${searchKey}${existing.length + 1}`;
  }
  return normalizeEmployee({
    ...partial,
    id,
    searchKey,
    businessPartnerGroup: "Employee",
    employmentStatus: partial.employmentStatus || "Active",
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
    credentials: partial.credentials ?? [],
  });
}

export function employeeProfileFields(): {
  key: keyof EmployeeRecord;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select";
  options?: readonly string[];
}[] {
  return [
    { key: "searchKey", label: "Search key", type: "text" },
    { key: "firstName", label: "First name", type: "text" },
    { key: "lastName", label: "Last name", type: "text" },
    { key: "preferredName", label: "Preferred name", type: "text" },
    { key: "middleName", label: "Middle name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "mobile", label: "Mobile", type: "tel" },
    { key: "jobTitle", label: "Job title", type: "text" },
    { key: "department", label: "Department", type: "select", options: departmentOptions },
    { key: "employmentStatus", label: "Employment status", type: "select", options: employmentStatusOptions },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
  ];
}
