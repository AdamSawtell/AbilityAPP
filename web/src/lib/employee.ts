import { syncCredentialStatuses } from "@/lib/employee-compliance";
import { bulkEmployees } from "@/lib/employee-bulk-seed";
import { leadershipEmployees } from "@/lib/org-leadership-seed";
import { defaultReferenceData } from "@/lib/reference-data";

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
  evidenceRef?: string;
  notes: string;
  staffSubmitted?: boolean;
  submittedAt?: string;
  submittedByUserId?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdBy: string;
  updatedBy: string;
};

export type EmployeeLocationRow = {
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
  primaryAddress: string;
  active: string;
  validFrom: string;
  validTo: string;
  accessNotes: string;
  description: string;
};

export type EmployeeEmergencyContactRow = {
  id: string;
  lineNo: number;
  contactType: string;
  name: string;
  relationship: string;
  phone: string;
  mobile: string;
  email: string;
  callOrder: number;
  primaryContact: string;
  notes: string;
};

export type EmployeeAlertRow = {
  id: string;
  lineNo: number;
  alertType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
  source: string;
};

export type EmployeeSkillRow = {
  id: string;
  lineNo: number;
  skillType: string;
  name: string;
  proficiency: string;
  notes: string;
};

export type EmployeeDocumentRow = {
  id: string;
  lineNo: number;
  documentType: string;
  name: string;
  documentRef: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  notes: string;
  staffVisible?: boolean;
  requiresAcknowledgement?: boolean;
};

export type EmployeeActivityRow = {
  id: string;
  lineNo: number;
  date: string;
  activityType: string;
  subject: string;
  description: string;
  createdBy: string;
};

export type EmployeeLeaveEntitlementRow = {
  id: string;
  lineNo: number;
  leaveType: string;
  entitlementDays: number;
  balanceDays: number;
  accrualNotes: string;
};

export type EmployeeLeaveRequestRow = {
  id: string;
  lineNo: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: string;
  notes: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  declineReason?: string;
};

export type EmployeeAvailabilityRow = {
  id: string;
  lineNo: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  availability: string;
  notes: string;
};

export type EmployeeDocumentAcknowledgement = {
  id: string;
  documentId: string;
  acknowledgedAt: string;
  acknowledgedByUserId: string;
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
  employmentType: string;
  startDate: string;
  endDate: string;
  probationEndDate: string;
  confirmationDate: string;
  noticeDays: string;
  siteBranch: string;
  costCentre: string;
  gender: string;
  birthday: string;
  employeeNumber: string;
  reportsToId: string;
  driverLicenceClass: string;
  driverLicenceExpiry: string;
  visaSubclass: string;
  visaExpiry: string;
  workRightsNotes: string;
  bankName: string;
  bankBsb: string;
  bankAccountNumber: string;
  payMethod: string;
  tfn: string;
  taxDeclaration: string;
  superFund: string;
  superMemberNumber: string;
  standardHoursPerWeek: string;
  fte: string;
  leavePolicy: string;
  medicalRestrictionsNotes: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
  credentials: EmployeeCredentialRow[];
  locations: EmployeeLocationRow[];
  emergencyContacts: EmployeeEmergencyContactRow[];
  alerts: EmployeeAlertRow[];
  skills: EmployeeSkillRow[];
  documents: EmployeeDocumentRow[];
  activities: EmployeeActivityRow[];
  leaveEntitlements: EmployeeLeaveEntitlementRow[];
  leaveRequests: EmployeeLeaveRequestRow[];
};

export type EmployeeTabGroup = {
  label: string;
  tabs: string[];
};

export const employeeTabGroups: EmployeeTabGroup[] = [
  {
    label: "Employee",
    tabs: ["Overview", "Contact", "Address", "Emergency contacts", "Employment", "Work rights", "Payroll", "Leave", "Incidents"],
  },
  {
    label: "Compliance",
    tabs: ["Credentials Assigned", "Alerts"],
  },
  {
    label: "HR file",
    tabs: ["Documents", "Activity", "Skills & languages"],
  },
  {
    label: "Organisation",
    tabs: ["System access"],
  },
];

export const employeeOverviewFields: (keyof EmployeeRecord)[] = [
  "searchKey",
  "employeeNumber",
  "firstName",
  "lastName",
  "preferredName",
  "gender",
  "birthday",
  "employmentStatus",
  "businessPartnerGroup",
];

export const employeeContactFields: (keyof EmployeeRecord)[] = ["email", "phone", "mobile", "middleName"];

export const employeeEmploymentFields: (keyof EmployeeRecord)[] = [
  "employmentType",
  "jobTitle",
  "department",
  "siteBranch",
  "costCentre",
  "startDate",
  "probationEndDate",
  "confirmationDate",
  "noticeDays",
  "endDate",
];

export const employeeWorkRightsFields: (keyof EmployeeRecord)[] = [
  "driverLicenceClass",
  "driverLicenceExpiry",
  "visaSubclass",
  "visaExpiry",
  "workRightsNotes",
  "medicalRestrictionsNotes",
];

export const employeePayrollFields: (keyof EmployeeRecord)[] = [
  "payMethod",
  "bankName",
  "bankBsb",
  "bankAccountNumber",
  "tfn",
  "taxDeclaration",
  "superFund",
  "superMemberNumber",
];

export const employeeLeaveFields: (keyof EmployeeRecord)[] = ["leavePolicy", "standardHoursPerWeek", "fte"];

export const genderOptions = defaultReferenceData.gender;
export const employmentStatusOptions = defaultReferenceData.employmentStatus;
export const employmentTypeOptions = defaultReferenceData.employmentType;
export const payMethodOptions = defaultReferenceData.payMethod;
export const departmentOptions = defaultReferenceData.department;

export const employeeListColumns = [
  { key: "searchKey" as const, label: "Search key" },
  { key: "name" as const, label: "Name" },
  { key: "jobTitle" as const, label: "Job title" },
  { key: "department" as const, label: "Department" },
  { key: "employmentStatus" as const, label: "Status" },
  { key: "email" as const, label: "Email" },
];

const emptyLineCollections = {
  credentials: [] as EmployeeCredentialRow[],
  locations: [] as EmployeeLocationRow[],
  emergencyContacts: [] as EmployeeEmergencyContactRow[],
  alerts: [] as EmployeeAlertRow[],
  skills: [] as EmployeeSkillRow[],
  documents: [] as EmployeeDocumentRow[],
  activities: [] as EmployeeActivityRow[],
  leaveEntitlements: [] as EmployeeLeaveEntitlementRow[],
  leaveRequests: [] as EmployeeLeaveRequestRow[],
};

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
    employmentType: "Full-time",
    startDate: "2019-03-01",
    endDate: "",
    probationEndDate: "2019-09-01",
    confirmationDate: "2019-09-15",
    noticeDays: "4",
    siteBranch: "Adelaide HQ",
    costCentre: "CC-CLIENT",
    gender: "Female",
    birthday: "1988-06-12",
    employeeNumber: "EMP-1001",
    reportsToId: "emp-michael",
    driverLicenceClass: "C",
    driverLicenceExpiry: "2027-08-01",
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "Australian citizen",
    bankName: "Commonwealth Bank",
    bankBsb: "065-000",
    bankAccountNumber: "12345678",
    payMethod: "Bank",
    tfn: "",
    taxDeclaration: "Tax-free threshold claimed",
    superFund: "Australian Super",
    superMemberNumber: "AS-88421",
    standardHoursPerWeek: "38",
    fte: "1",
    leavePolicy: "Standard award — 4 weeks annual",
    medicalRestrictionsNotes: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    locations: [
      {
        id: "loc-isla-home",
        lineNo: 1,
        name: "Home",
        addressType: "Home",
        address1: "12 Ward Street",
        address2: "",
        address3: "",
        city: "Adelaide",
        state: "SA",
        postcode: "5000",
        country: "Australia",
        phone: "08 8294 1100",
        mobile: "0412 111 222",
        email: "isla.robinson@abilityerp.local",
        primaryAddress: "Yes",
        active: "Yes",
        validFrom: "2019-03-01",
        validTo: "",
        accessNotes: "",
        description: "",
      },
      {
        id: "loc-isla-postal",
        lineNo: 2,
        name: "Postal",
        addressType: "Postal",
        address1: "PO Box 442",
        address2: "",
        address3: "",
        city: "Adelaide",
        state: "SA",
        postcode: "5001",
        country: "Australia",
        phone: "",
        mobile: "",
        email: "",
        primaryAddress: "No",
        active: "Yes",
        validFrom: "2019-03-01",
        validTo: "",
        accessNotes: "",
        description: "",
      },
    ],
    emergencyContacts: [
      {
        id: "ec-isla-james",
        lineNo: 1,
        contactType: "Emergency",
        name: "James Robinson",
        relationship: "Spouse",
        phone: "",
        mobile: "0411 999 888",
        email: "james.robinson@example.com",
        callOrder: 1,
        primaryContact: "Yes",
        notes: "",
      },
      {
        id: "ec-isla-mary",
        lineNo: 2,
        contactType: "Next of kin",
        name: "Mary Robinson",
        relationship: "Parent",
        phone: "08 8294 2200",
        mobile: "",
        email: "",
        callOrder: 2,
        primaryContact: "No",
        notes: "",
      },
    ],
    alerts: [
      {
        id: "alert-isla-supervision",
        lineNo: 1,
        alertType: "Operational",
        showAsAlert: "Yes",
        name: "New team member supervision",
        description: "Pair with senior coordinator for complex behaviour support cases until Q3 review.",
        validFrom: "2025-01-01",
        validTo: "2025-09-30",
        source: "Manual",
      },
    ],
    skills: [
      { id: "skill-isla-en", lineNo: 1, skillType: "Language", name: "English", proficiency: "Native", notes: "" },
      {
        id: "skill-isla-coord",
        lineNo: 2,
        skillType: "Specialisation",
        name: "Support coordination",
        proficiency: "Advanced",
        notes: "",
      },
      {
        id: "skill-isla-autism",
        lineNo: 3,
        skillType: "Specialisation",
        name: "Autism support",
        proficiency: "Intermediate",
        notes: "",
      },
    ],
    documents: [
      {
        id: "doc-isla-contract",
        lineNo: 1,
        documentType: "Employment contract",
        name: "Permanent employment agreement",
        documentRef: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf",
        issueDate: "2019-03-01",
        expiryDate: "",
        status: "Current",
        notes: "",
        staffVisible: true,
        requiresAcknowledgement: true,
      },
    ],
    activities: [
      {
        id: "act-isla-onboard",
        lineNo: 1,
        date: "2019-03-01",
        activityType: "Onboarding",
        subject: "Induction completed",
        description: "Policy pack signed, systems access provisioned.",
        createdBy: "SuperUser",
      },
    ],
    leaveEntitlements: [
      {
        id: "leave-isla-annual",
        lineNo: 1,
        leaveType: "Annual leave",
        entitlementDays: 20,
        balanceDays: 11.5,
        accrualNotes: "Accrued per award",
      },
      {
        id: "leave-isla-personal",
        lineNo: 2,
        leaveType: "Personal / carer's leave",
        entitlementDays: 10,
        balanceDays: 8,
        accrualNotes: "",
      },
    ],
    leaveRequests: [
      {
        id: "leave-req-isla-jun",
        lineNo: 1,
        leaveType: "Annual leave",
        startDate: "2026-06-22",
        endDate: "2026-06-24",
        daysRequested: 3,
        status: "Approved",
        notes: "Family leave",
      },
    ],
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
    employmentType: "Part-time",
    startDate: "2020-06-15",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "2020-12-01",
    noticeDays: "2",
    siteBranch: "Adelaide HQ",
    costCentre: "CC-INTAKE",
    gender: "Female",
    birthday: "1992-02-20",
    employeeNumber: "EMP-1002",
    reportsToId: "emp-michael",
    driverLicenceClass: "",
    driverLicenceExpiry: "",
    visaSubclass: "482",
    visaExpiry: "2026-07-15",
    workRightsNotes: "Sponsored visa — monitor expiry",
    bankName: "",
    bankBsb: "",
    bankAccountNumber: "",
    payMethod: "Bank",
    tfn: "",
    taxDeclaration: "",
    superFund: "",
    superMemberNumber: "",
    standardHoursPerWeek: "22",
    fte: "0.58",
    leavePolicy: "Part-time pro-rata",
    medicalRestrictionsNotes: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    locations: [
      {
        id: "loc-gab-home",
        lineNo: 1,
        name: "Home",
        addressType: "Home",
        address1: "8 King William Street",
        address2: "Unit 4",
        address3: "",
        city: "Adelaide",
        state: "SA",
        postcode: "5000",
        country: "Australia",
        phone: "",
        mobile: "0413 222 333",
        email: "gabriela.wilson@abilityerp.local",
        primaryAddress: "Yes",
        active: "Yes",
        validFrom: "2020-06-15",
        validTo: "",
        accessNotes: "",
        description: "",
      },
    ],
    emergencyContacts: [
      {
        id: "ec-gab-maria",
        lineNo: 1,
        contactType: "Emergency",
        name: "Maria Wilson",
        relationship: "Parent",
        phone: "",
        mobile: "0412 555 444",
        email: "",
        callOrder: 1,
        primaryContact: "Yes",
        notes: "",
      },
    ],
    alerts: [],
    skills: [
      { id: "skill-gab-en", lineNo: 1, skillType: "Language", name: "English", proficiency: "Native", notes: "" },
      { id: "skill-gab-es", lineNo: 2, skillType: "Language", name: "Spanish", proficiency: "Fluent", notes: "" },
    ],
    documents: [
      {
        id: "doc-gab-contract",
        lineNo: 1,
        documentType: "Employment contract",
        name: "Part-time employment agreement",
        documentRef: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf",
        issueDate: "2020-06-15",
        expiryDate: "",
        status: "Current",
        notes: "",
        staffVisible: true,
        requiresAcknowledgement: true,
      },
    ],
    activities: [],
    leaveEntitlements: [
      {
        id: "leave-gab-annual",
        lineNo: 1,
        leaveType: "Annual leave",
        entitlementDays: 11.6,
        balanceDays: 6,
        accrualNotes: "Pro-rata part-time",
      },
    ],
    leaveRequests: [
      {
        id: "leave-req-gab-jul",
        lineNo: 1,
        leaveType: "Personal / carer's leave",
        startDate: "2026-07-03",
        endDate: "2026-07-03",
        daysRequested: 1,
        status: "Requested",
        notes: "Medical appointment",
      },
    ],
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
    jobTitle: "Operations Executive",
    department: "Operations",
    employmentStatus: "Active",
    employmentType: "Full-time",
    startDate: "2018-01-10",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "",
    noticeDays: "",
    siteBranch: "Adelaide HQ",
    costCentre: "CC-CLIENT",
    gender: "",
    birthday: "",
    employeeNumber: "EMP-1003",
    reportsToId: "emp-ceo",
    driverLicenceClass: "",
    driverLicenceExpiry: "",
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "",
    bankName: "",
    bankBsb: "",
    bankAccountNumber: "",
    payMethod: "",
    tfn: "",
    taxDeclaration: "",
    superFund: "",
    superMemberNumber: "",
    standardHoursPerWeek: "38",
    fte: "1",
    leavePolicy: "",
    medicalRestrictionsNotes: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...emptyLineCollections,
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
    employmentType: "Casual",
    startDate: "2021-09-01",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "",
    noticeDays: "",
    siteBranch: "Northern",
    costCentre: "CC-OPS",
    gender: "",
    birthday: "",
    employeeNumber: "EMP-1004",
    reportsToId: "emp-michael",
    driverLicenceClass: "C",
    driverLicenceExpiry: "2026-07-01",
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "",
    bankName: "",
    bankBsb: "",
    bankAccountNumber: "",
    payMethod: "Bank",
    tfn: "",
    taxDeclaration: "",
    superFund: "",
    superMemberNumber: "",
    standardHoursPerWeek: "",
    fte: "0",
    leavePolicy: "Casual — no paid leave accrual",
    medicalRestrictionsNotes: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...emptyLineCollections,
    credentials: [
      {
        id: "cred-oliver-fa",
        lineNo: 1,
        credentialType: "First Aid Certificate",
        credentialNumber: "FA-22001",
        issuingBody: "St John Ambulance",
        issueDate: "2024-07-01",
        expiryDate: "2026-07-01",
        status: "Expiring soon",
        documentRef: "",
        notes: "Renew before rostering community shifts",
        createdBy: "SuperUser",
        updatedBy: "SuperUser",
      },
    ],
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
    employmentType: "Full-time",
    startDate: "2017-11-20",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "",
    noticeDays: "",
    siteBranch: "",
    costCentre: "",
    gender: "",
    birthday: "",
    employeeNumber: "",
    reportsToId: "",
    driverLicenceClass: "",
    driverLicenceExpiry: "",
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "",
    bankName: "",
    bankBsb: "",
    bankAccountNumber: "",
    payMethod: "",
    tfn: "",
    taxDeclaration: "",
    superFund: "",
    superMemberNumber: "",
    standardHoursPerWeek: "",
    fte: "",
    leavePolicy: "",
    medicalRestrictionsNotes: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...emptyLineCollections,
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
    employmentType: "Full-time",
    startDate: "2022-02-01",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "",
    noticeDays: "",
    siteBranch: "",
    costCentre: "",
    gender: "",
    birthday: "",
    employeeNumber: "",
    reportsToId: "",
    driverLicenceClass: "",
    driverLicenceExpiry: "",
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "",
    bankName: "",
    bankBsb: "",
    bankAccountNumber: "",
    payMethod: "",
    tfn: "",
    taxDeclaration: "",
    superFund: "",
    superMemberNumber: "",
    standardHoursPerWeek: "",
    fte: "",
    leavePolicy: "",
    medicalRestrictionsNotes: "",
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...emptyLineCollections,
  },
  ...leadershipEmployees,
  ...bulkEmployees,
];

export function formatEmployeeAddress(loc: EmployeeLocationRow): string {
  const line = [loc.address1, loc.address2, loc.address3].filter(Boolean).join(", ");
  const locality = [loc.city, loc.state, loc.postcode].filter(Boolean).join(" ");
  return [line, locality, loc.country].filter(Boolean).join(" · ") || "—";
}

export function primaryEmployeeLocation(employee: EmployeeRecord): EmployeeLocationRow | undefined {
  return (
    employee.locations.find((l) => l.primaryAddress === "Yes" && l.active === "Yes") ??
    employee.locations.find((l) => l.primaryAddress === "Yes") ??
    employee.locations[0]
  );
}

function renumber<T extends { lineNo: number }>(rows: T[]): T[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

export function normalizeEmployee(record: EmployeeRecord): EmployeeRecord {
  const name =
    record.name?.trim() ||
    `${record.firstName} ${record.lastName}`.trim() ||
    record.searchKey;
  return {
    ...record,
    name,
    businessPartnerGroup: record.businessPartnerGroup || "Employee",
    credentials: syncCredentialStatuses(renumber(record.credentials ?? [])),
    locations: renumber(record.locations ?? []),
    emergencyContacts: renumber(record.emergencyContacts ?? []),
    alerts: renumber(record.alerts ?? []),
    skills: renumber(record.skills ?? []),
    documents: renumber(record.documents ?? []),
    activities: renumber(record.activities ?? []),
    leaveEntitlements: renumber(record.leaveEntitlements ?? []),
    leaveRequests: renumber(record.leaveRequests ?? []),
  };
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
    locations: partial.locations ?? [],
    emergencyContacts: partial.emergencyContacts ?? [],
    alerts: partial.alerts ?? [],
    skills: partial.skills ?? [],
    documents: partial.documents ?? [],
    activities: partial.activities ?? [],
    leaveEntitlements: partial.leaveEntitlements ?? [],
    leaveRequests: partial.leaveRequests ?? [],
  });
}

export function employeeProfileFields(): {
  key: keyof EmployeeRecord;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select" | "number";
  optionsKey?: string;
}[] {
  return [
    { key: "searchKey", label: "Search key", type: "text" },
    { key: "firstName", label: "First name", type: "text" },
    { key: "lastName", label: "Last name", type: "text" },
    { key: "preferredName", label: "Preferred name", type: "text" },
    { key: "middleName", label: "Middle name", type: "text" },
    { key: "gender", label: "Gender", type: "select", optionsKey: "gender" },
    { key: "birthday", label: "Date of birth", type: "date" },
    { key: "employeeNumber", label: "Employee number", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "mobile", label: "Mobile", type: "tel" },
    { key: "employmentType", label: "Employment type", type: "select", optionsKey: "employmentType" },
    { key: "jobTitle", label: "Job title", type: "text" },
    { key: "department", label: "Department", type: "select", optionsKey: "department" },
    { key: "employmentStatus", label: "Employment status", type: "select", optionsKey: "employmentStatus" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "notes", label: "Notes", type: "text" },
  ];
}
