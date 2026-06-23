/**
 * Generates bulk dummy staff and locations for review/testing.
 * Run: cd web && npx tsx ../scripts/generate-bulk-dummy-data.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const FIRST = [
  "Ava", "Noah", "Mia", "Liam", "Zoe", "Ethan", "Chloe", "Mason", "Ruby", "Lucas",
  "Grace", "Henry", "Ella", "Jack", "Sophie", "Levi", "Amelia", "Oscar", "Harper", "Finn",
  "Isabella", "Archie", "Charlotte", "Theo", "Lily", "Hudson", "Evie", "Cooper", "Sienna", "Xavier",
  "Matilda", "Kai", "Piper", "Jasper", "Willow", "Arlo", "Ivy", "Felix", "Hazel", "Miles",
  "Stella", "Declan", "Violet", "Elijah", "Audrey", "Caleb", "Naomi", "Jonah", "Clara", "Reid",
];

const LAST = [
  "Nguyen", "Patel", "Murphy", "Singh", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White",
  "Harris", "Martin", "Thompson", "Garcia", "Robinson", "Clark", "Lewis", "Lee", "Walker", "Hall",
  "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter",
  "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murray", "Bailey", "Cooper",
];

const SITES = ["Northern", "Glenelg", "Adelaide HQ", "Murray Bridge", "Southern"];
const EMP_TYPES = ["Full-time", "Part-time", "Casual"];
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

function pick(arr, i) {
  return arr[i % arr.length];
}

function searchKey(first, last) {
  return `${first.slice(0, 2)}${last.slice(0, 2)}${String.fromCharCode(65 + (first.charCodeAt(0) % 26))}`;
}

function startDateForIndex(i) {
  const year = 2019 + (i % 6);
  const month = String((i % 12) + 1).padStart(2, "0");
  const day = String((i % 27) + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function leaveBlock(empId, i) {
  if (i % 4 !== 0) return "leaveRequests: [],";
  const start = `2026-0${(i % 6) + 1}-${String((i % 20) + 5).padStart(2, "0")}`;
  const endDay = (i % 20) + 7;
  const end = `2026-0${(i % 6) + 1}-${String(Math.min(endDay, 28)).padStart(2, "0")}`;
  const status = i % 8 === 0 ? "Requested" : "Approved";
  return `leaveRequests: [
      {
        id: "leave-req-${empId}",
        lineNo: 1,
        leaveType: ${i % 3 === 0 ? '"Annual leave"' : '"Personal / carer\'s leave"'},
        startDate: "${start}",
        endDate: "${end}",
        daysRequested: ${Math.min(endDay - (i % 20) - 4, 5) || 1},
        status: "${status}",
        notes: "Seed leave for workforce calendar testing",
      },
    ],`;
}

function buildEmployee(i) {
  const num = 101 + i;
  const empNum = `EMP-${1000 + num}`;
  const first = pick(FIRST, i);
  const last = pick(LAST, i + 7);
  const name = `${first} ${last}`;
  const emailSlug = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
  const isSupportWorker = i < 32;
  const id = isSupportWorker ? `emp-sw-${String(i + 1).padStart(3, "0")}` : `emp-staff-${String(num).padStart(3, "0")}`;

  let jobTitle;
  let department;
  let reportsToId;
  let siteBranch;
  let costCentre;
  let employmentType;

  if (isSupportWorker) {
    jobTitle = "Support Worker";
    department = "Operations";
    reportsToId = i % 5 === 0 ? "emp-oliver" : "emp-michael";
    siteBranch = pick(SITES, i);
    costCentre = "CC-OPS";
    employmentType = pick(EMP_TYPES, i + 2);
  } else if (i < 38) {
    jobTitle = "Team Leader";
    department = "Operations";
    reportsToId = "emp-michael";
    siteBranch = pick(SITES, i);
    costCentre = "CC-OPS";
    employmentType = "Full-time";
  } else if (i < 43) {
    jobTitle = "Intake Officer";
    department = "Intake";
    reportsToId = "emp-gabriela";
    siteBranch = "Adelaide HQ";
    costCentre = "CC-INTAKE";
    employmentType = pick(EMP_TYPES, i);
  } else if (i < 47) {
    jobTitle = pick(["HR Officer", "Finance Officer", "Quality Officer"], i);
    department = pick(["HR", "Finance", "Quality"], i);
    reportsToId = "";
    siteBranch = "Adelaide HQ";
    costCentre = pick(["CC-HR", "CC-FIN", "CC-QUALITY"], i);
    employmentType = "Full-time";
  } else {
    jobTitle = pick(["Plan Developer", "Contract Administrator", "Compliance Analyst"], i);
    department = pick(["Client services", "Finance", "Quality"], i);
    reportsToId = i % 2 === 0 ? "emp-rose" : "emp-jessica";
    siteBranch = "Adelaide HQ";
    costCentre = pick(["CC-CLIENT", "CC-FIN", "CC-QUALITY"], i);
    employmentType = "Full-time";
  }

  const credStatus = i % 7 === 0 ? "Expiring soon" : "Current";
  const credExpiry = i % 7 === 0 ? "2026-08-15" : "2027-06-30";

  return `  {
    id: "${id}",
    searchKey: "${searchKey(first, last)}${num}",
    businessPartnerGroup: "Employee",
    name: "${name}",
    firstName: "${first}",
    lastName: "${last}",
    preferredName: "${first}",
    middleName: "",
    email: "${emailSlug}@abilityerp.local",
    phone: "",
    mobile: "04${String(10 + (i % 89)).padStart(2, "0")} ${String(100 + (i % 900)).padStart(3, "0")} ${String(100 + ((i * 7) % 900)).padStart(3, "0")}",
    jobTitle: "${jobTitle}",
    department: "${department}",
    employmentStatus: "Active",
    employmentType: "${employmentType}",
    startDate: "${startDateForIndex(i)}",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "",
    noticeDays: "",
    siteBranch: "${siteBranch}",
    costCentre: "${costCentre}",
    gender: "${pick(GENDERS, i)}",
    birthday: "${1985 + (i % 15)}-${String((i % 12) + 1).padStart(2, "0")}-15",
    employeeNumber: "${empNum}",
    reportsToId: ${reportsToId ? `"${reportsToId}"` : '""'},
    driverLicenceClass: ${isSupportWorker || i < 38 ? '"C"' : '""'},
    driverLicenceExpiry: ${isSupportWorker || i < 38 ? '"2027-12-01"' : '""'},
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "Australian citizen",
    bankName: "Commonwealth Bank",
    bankBsb: "065-000",
    bankAccountNumber: "${String(10000000 + num)}",
    payMethod: "Bank",
    tfn: "",
    taxDeclaration: "",
    superFund: "Australian Super",
    superMemberNumber: "AS-${10000 + num}",
    standardHoursPerWeek: "${employmentType === "Casual" ? "" : employmentType === "Part-time" ? "22" : "38"}",
    fte: "${employmentType === "Casual" ? "0" : employmentType === "Part-time" ? "0.58" : "1"}",
    leavePolicy: "${employmentType === "Casual" ? "Casual — no paid leave accrual" : "Standard award — 4 weeks annual"}",
    medicalRestrictionsNotes: "",
    notes: "Bulk seed employee ${num} for testing",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    credentials: [
      {
        id: "cred-${id}-wwcc",
        lineNo: 1,
        credentialType: "Working with Children Check",
        credentialNumber: "WWCC-${20000 + num}",
        issuingBody: "DHS Screening",
        issueDate: "2024-01-15",
        expiryDate: "${credExpiry}",
        status: "${credStatus}",
        documentRef: "",
        notes: "",
        createdBy: "SuperUser",
        updatedBy: "SuperUser",
      },
      {
        id: "cred-${id}-fa",
        lineNo: 2,
        credentialType: "First Aid Certificate",
        credentialNumber: "FA-${30000 + num}",
        issuingBody: "St John Ambulance",
        issueDate: "2025-01-10",
        expiryDate: "2027-01-10",
        status: "Current",
        documentRef: "",
        notes: "",
        createdBy: "SuperUser",
        updatedBy: "SuperUser",
      },
    ],
    locations: [
      {
        id: "loc-${id}-home",
        lineNo: 1,
        name: "Home",
        addressType: "Home",
        address1: "${10 + (i % 90)} ${pick(["Oak", "Pine", "River", "Station", "Main"], i)} Street",
        address2: "",
        address3: "",
        city: "${pick(["Adelaide", "Glenelg", "Salisbury", "Murray Bridge", "Noarlunga"], i)}",
        state: "SA",
        postcode: "${5000 + (i % 50)}",
        country: "Australia",
        phone: "",
        mobile: "04${String(10 + (i % 89)).padStart(2, "0")} ${String(100 + (i % 900)).padStart(3, "0")} ${String(100 + ((i * 7) % 900)).padStart(3, "0")}",
        email: "${emailSlug}@abilityerp.local",
        primaryAddress: "Yes",
        active: "Yes",
        validFrom: "${startDateForIndex(i)}",
        validTo: "",
        accessNotes: "",
        description: "",
      },
    ],
    emergencyContacts: [
      {
        id: "ec-${id}-1",
        lineNo: 1,
        contactType: "Emergency",
        name: "${pick(FIRST, i + 3)} ${last}",
        relationship: "${pick(["Spouse", "Parent", "Sibling", "Partner"], i)}",
        phone: "",
        mobile: "04${String(20 + (i % 79)).padStart(2, "0")} ${String(200 + (i % 800)).padStart(3, "0")} ${String(200 + ((i * 3) % 800)).padStart(3, "0")}",
        email: "",
        callOrder: 1,
        primaryContact: "Yes",
        notes: "",
      },
    ],
    alerts: [],
    skills: [
      {
        id: "skill-${id}-1",
        lineNo: 1,
        skillType: "Specialisation",
        name: "${isSupportWorker ? "Community access" : jobTitle}",
        proficiency: "${pick(["Intermediate", "Advanced", "Beginner"], i)}",
        notes: "",
      },
    ],
    documents: [],
    activities: [],
    leaveEntitlements: ${
      employmentType === "Casual"
        ? "[]"
        : `[
      {
        id: "leave-ent-${id}-annual",
        lineNo: 1,
        leaveType: "Annual leave",
        entitlementDays: ${employmentType === "Part-time" ? 11.6 : 20},
        balanceDays: ${(8 + (i % 10)).toFixed(1)},
        accrualNotes: "Accrued per award",
      },
    ]`
    },
    ${leaveBlock(id, i)}
  }`;
}

const employees = Array.from({ length: 50 }, (_, i) => buildEmployee(i)).join(",\n");

const employeeTs = `import type { EmployeeRecord } from "@/lib/employee";

/** Generated bulk staff — run scripts/generate-bulk-dummy-data.mjs to refresh. */
export const bulkEmployees: EmployeeRecord[] = [
${employees}
];

export const bulkSupportWorkerIds = bulkEmployees
  .filter((e) => e.jobTitle === "Support Worker")
  .map((e) => e.id);

export const bulkStaffUserLinks: { userId: string; employeeId: string; username: string; firstName: string; lastName: string }[] = [
${Array.from({ length: 10 }, (_, i) => {
  const first = pick(FIRST, i);
  const last = pick(LAST, i + 7);
  const username = `${first}${last}`.replace(/[^a-zA-Z]/g, "");
  return `  { userId: "user-sw-${String(i + 1).padStart(2, "0")}", employeeId: "emp-sw-${String(i + 1).padStart(3, "0")}", username: "${username}", firstName: "${first}", lastName: "${last}" },`;
}).join("\n")}
];
`;

writeFileSync(join(root, "web", "src", "lib", "employee-bulk-seed.ts"), employeeTs, "utf8");

// --- Locations ---
const locDefs = [
  {
    id: "loc-northern-sil",
    searchKey: "NTH-SIL",
    name: "Northern SIL House",
    description: "Four-bedroom shared living in Salisbury — active overnight and weekend support.",
    locationType: "SIL house",
    address1: "45 Commercial Road",
    city: "Salisbury",
    postcode: "5108",
    phone: "08 8285 3300",
    email: "northern.sil@abilityvua.local",
    accessNotes: "Sensor lighting at entry. Staff parking at rear.",
    pictureUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=640&h=400&fit=crop",
    capacity: "4",
    validFrom: "2023-04-01",
    productId: "prod-sil-wd",
    productNotes: "Northern SIL weekday service",
    managerId: "emp-michael",
    managerRole: "Operations manager",
    swStart: 0,
    swCount: 11,
  },
  {
    id: "loc-southern-respite",
    searchKey: "STH-RSP",
    name: "Southern Respite Cottage",
    description: "Short-term respite and STA — two guest rooms, flexible roster.",
    locationType: "Respite",
    address1: "8 Jetty Road",
    city: "Brighton",
    postcode: "5048",
    phone: "08 8298 7700",
    email: "southern.respite@abilityvua.local",
    accessNotes: "Ground-floor only. Medication lockbox in kitchen.",
    pictureUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&h=400&fit=crop",
    capacity: "2",
    validFrom: "2024-01-15",
    productId: "prod-sil-wd",
    productNotes: "Short-term accommodation / respite",
    managerId: "emp-isla",
    managerRole: "Site coordinator",
    swStart: 11,
    swCount: 11,
  },
  {
    id: "loc-murray-bridge-day",
    searchKey: "MB-DAY",
    name: "Murray Bridge Day Program",
    description: "Regional day hub — life skills, community access, and transport.",
    locationType: "Day program",
    address1: "120 Bridge Street",
    city: "Murray Bridge",
    postcode: "5253",
    phone: "08 8531 4400",
    email: "murraybridge.day@abilityvua.local",
    accessNotes: "Bus bay at front. Evacuation assembly point is north carpark.",
    pictureUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=640&h=400&fit=crop",
    capacity: "15",
    validFrom: "2022-09-01",
    productId: "prod-cp",
    productNotes: "Regional community participation",
    managerId: "emp-oliver",
    managerRole: "Team leader",
    swStart: 22,
    swCount: 10,
  },
];

function swLink(loc, idx, swIndex) {
  const n = swIndex + 1;
  return `      {
        id: "loc-emp-${loc.id}-sw-${n}",
        lineNo: ${idx + 2},
        employeeId: "emp-sw-${String(n).padStart(3, "0")}",
        assignmentRole: "Support worker",
        primaryAssignment: "${idx === 0 ? "Yes" : "No"}",
        validFrom: "${loc.validFrom}",
        validTo: "",
        notes: "${idx % 3 === 0 ? "Regular weekday shifts" : idx % 3 === 1 ? "Weekend roster" : "Relief pool"}",
      }`;
}

const locationBlocks = locDefs.map((loc) => {
  const swLinks = Array.from({ length: loc.swCount }, (_, j) => swLink(loc, j, loc.swStart + j)).join(",\n");
  return `  {
    id: "${loc.id}",
    searchKey: "${loc.searchKey}",
    name: "${loc.name}",
    description: "${loc.description}",
    locationType: "${loc.locationType}",
    status: "Active",
    address1: "${loc.address1}",
    address2: "",
    address3: "",
    city: "${loc.city}",
    state: "SA",
    postcode: "${loc.postcode}",
    country: "Australia",
    phone: "${loc.phone}",
    mobile: "",
    email: "${loc.email}",
    accessNotes: "${loc.accessNotes}",
    pictureUrl: "${loc.pictureUrl}",
    capacity: "${loc.capacity}",
    validFrom: "${loc.validFrom}",
    validTo: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    alerts: [
      {
        id: "loc-alert-${loc.id}",
        lineNo: 1,
        alertType: "Operational",
        showAsAlert: "Yes",
        name: "Roster coverage check",
        description: "Verify minimum staffing before public holiday weekends.",
        validFrom: "2025-01-01",
        validTo: "",
      },
    ],
    clientLinks: [],
    employeeLinks: [
      {
        id: "loc-emp-${loc.id}-mgr",
        lineNo: 1,
        employeeId: "${loc.managerId}",
        assignmentRole: "${loc.managerRole}",
        primaryAssignment: "Yes",
        validFrom: "${loc.validFrom}",
        validTo: "",
        notes: "",
      },
${swLinks}
    ],
    productLinks: [
      {
        id: "loc-prod-${loc.id}-1",
        lineNo: 1,
        productId: "${loc.productId}",
        active: "Yes",
        validFrom: "${loc.validFrom}",
        validTo: "",
        notes: "${loc.productNotes}",
      },
    ],
    activities: [],
  }`;
});

const locationTs = `import type { LocationRecord } from "@/lib/location";

/** Generated bulk locations — run scripts/generate-bulk-dummy-data.mjs to refresh. */
export const bulkLocations: LocationRecord[] = [
${locationBlocks.join(",\n")}
];
`;

writeFileSync(join(root, "web", "src", "lib", "location-bulk-seed.ts"), locationTs, "utf8");

console.log("Wrote web/src/lib/employee-bulk-seed.ts (50 employees, 32 support workers)");
console.log("Wrote web/src/lib/location-bulk-seed.ts (3 locations)");
