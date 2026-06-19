/**
 * One-off bulk client seed — 20 rich dummy clients with converted enquiries,
 * full tab line data, service agreements, support plans, tasks, and location assignments.
 * Run: npm run supabase:seed-clients-bulk
 * Apply: npx supabase db query --linked -f supabase/seed-clients-bulk.sql
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COUNT = 20;

const FIRST = [
  "Ava", "Noah", "Mia", "Liam", "Zoe", "Ethan", "Chloe", "Mason", "Ruby", "Lucas",
  "Grace", "Henry", "Ella", "Jack", "Sophie", "Levi", "Amelia", "Oscar", "Harper", "Finn",
];

const LAST = [
  "Nguyen", "Patel", "Murphy", "Singh", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White",
  "Harris", "Martin", "Thompson", "Garcia", "Robinson", "Clark", "Lewis", "Lee", "Walker", "Hall",
];

const LOCATIONS = [
  { id: "loc-glenelg-sil", city: "Glenelg", postcode: "5045", role: "Resident", type: "SIL house" },
  { id: "loc-adelaide-hub", city: "Adelaide", postcode: "5000", role: "Participant", type: "Day program" },
  { id: "loc-northern-sil", city: "Salisbury", postcode: "5108", role: "Resident", type: "SIL house" },
  { id: "loc-southern-respite", city: "Brighton", postcode: "5048", role: "Guest", type: "Respite" },
  { id: "loc-murray-bridge-day", city: "Murray Bridge", postcode: "5253", role: "Participant", type: "Day program" },
];

const FUNDING = [
  "NDIS - National Disability Insurance Scheme",
  "DSOA - Disability Support for Older Australians",
  "Commonwealth Home Support Programme (CHSP)",
];

const DISABILITIES = [
  "PD - Spinal Cord Injury",
  "PD - Acquired Brain Injury",
  "PD - Multiple Sclerosis",
  "ID - Autism",
  "ID - Down Syndrome",
  "SD - Hearing Impairment",
  "PD - Stroke",
  "ID - Developmental Delay",
];

const SERVICES = [
  "Assistance with Self Care Activities; Community Participation",
  "Supported Independent Living; Assistance with Daily Life",
  "Short Term Accommodation; Community Access",
  "Day Program; Transport; Skills Development",
  "Respite; Personal Care; Household Tasks",
];

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const LIVING = ["Lives Alone", "Lives with Family", "Lives with Friends/Housemates"];
const DECISION = ["Independent", "Shared decision making", "Guardian appointed"];
const STAFF = ["Isla Robinson", "Gabriela Wilson", "Oliver Williams", "Rose Dash"];

const TASK_TYPES = [
  { id: "tt-review", legacy: "Review" },
  { id: "tt-approve", legacy: "Approve" },
  { id: "tt-check", legacy: "Check" },
  { id: "tt-develop", legacy: "Develop" },
];

const TASK_TITLES = [
  "Complete intake paperwork",
  "Review consent records",
  "Update support plan goals",
  "Annual plan review preparation",
  "Verify emergency contacts",
  "PACE transition check-in",
  "Schedule plan review meeting",
  "Confirm service agreement lines",
  "Upload signed consent forms",
  "Review restrictive practice register",
];

const STATUSES = ["Open", "In progress", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Normal", "High"];
const USERS = [
  { id: "user-superuser", name: "Super User" },
  { id: "user-isla", name: "Isla Robinson" },
  { id: "user-gabriela", name: "Gabriela Wilson" },
];
const ROLES = [
  { id: "role-coordinator", name: "Support Coordinator" },
  { id: "role-intake", name: "Intake Coordinator" },
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function sqlString(value) {
  if (value === null || value === undefined) return "''";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlDate(value) {
  if (!value?.trim()) return "null";
  return sqlString(value);
}

function sqlBool(value) {
  return value ? "true" : "false";
}

function sqlNum(value) {
  if (value === null || value === undefined || value === "") return "null";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "null";
}

function searchKey(first, last, i) {
  return `${first.slice(0, 2)}${last.slice(0, 2)}${pad(i)}`.toUpperCase();
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addInsert(lines, table, columns, rows, conflict = "(id)") {
  if (!rows.length) return;
  lines.push(`insert into public.${table} (${columns.join(", ")})`);
  lines.push("values");
  lines.push(rows.join(",\n"));
  lines.push(`on conflict ${conflict} do update set`);
  const updates = columns
    .filter((c) => c !== "id" && c !== "created_at")
    .map((c) => `  ${c} = excluded.${c}`);
  lines.push(updates.join(",\n") + ";");
  lines.push("");
}

function riskSummary(risks) {
  return risks
    .filter((r) => r.showAsAlert === "Yes")
    .map((r) => r.name)
    .join("; ");
}

function consentSummary(consents) {
  return consents
    .filter((c) => c.showAsAlert === "Yes")
    .map((c) => `Consent-${c.name}`)
    .join("; ");
}

const enquiries = [];
const enquiryActivities = [];
const clients = [];
const clientAlerts = [];
const clientActivities = [];
const clientLocations = [];
const restrictivePractices = [];
const consents = [];
const risks = [];
const bpAssociations = [];
const contactActivities = [];
const needsRules = [];
const locationClients = [];
const serviceAgreements = [];
const serviceAgreementLines = [];
const serviceBookings = [];
const serviceBookingLines = [];
const contracts = [];
const contractAudits = [];
const supportPlans = [];
const supportPlanGoals = [];
const progressReviews = [];
const planDocuments = [];
const incidents = [];
const incidentParties = [];
const incidentActions = [];
const tasks = [];

for (let i = 1; i <= COUNT; i++) {
  const p = pad(i);
  const first = pick(FIRST, i);
  const last = pick(LAST, i + 3);
  const preferred = i % 3 === 0 ? first : first;
  const name = `${first} ${last}`;
  const enqDoc = String(1000200 + i);
  const clientId = `bp-bulk-${p}`;
  const loc = pick(LOCATIONS, i - 1);
  const funding = pick(FUNDING, i);
  const disability = pick(DISABILITIES, i + 2);
  const services = pick(SERVICES, i);
  const sk = searchKey(first, last, i);
  const staff = pick(STAFF, i);
  const commence = addDays("2023-01-01", i * 14);
  const birthday = `${1985 + (i % 20)}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`;
  const ndisNum = `43${String(1000000 + i * 7919).slice(0, 7)}`;
  const email = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.local";

  const enqReceived = addDays(commence, -21);
  const enqConverted = addDays(commence, -7);

  enquiries.push({
    id: enqDoc,
    documentNo: enqDoc,
    dateReceived: enqReceived,
    dateNextAction: enqConverted,
    status: "4_Converted",
    firstName: first,
    lastName: last,
    fundingBody: funding,
    disability,
    services,
    outcome: `Converted to client ${sk} on ${enqConverted}.`,
    description: `Initial enquiry for ${services}. Family requested intake assessment and SIL/day program options.`,
    enquirySource: pick(["Referral", "Website", "Phone Call", "GP referral"], i),
    createdBy: staff,
    updatedBy: "SuperUser",
  });

  enquiryActivities.push(
    {
      id: `ea-bulk-${p}-1`,
      enquiryId: enqDoc,
      lineNo: 1,
      date: enqReceived,
      activityType: "Phone call",
      subject: "Initial intake call",
      description: `${first} and family discussed support needs, funding, and preferred location (${loc.city}).`,
      createdBy: staff,
    },
    {
      id: `ea-bulk-${p}-2`,
      enquiryId: enqDoc,
      lineNo: 2,
      date: enqConverted,
      activityType: "Meeting",
      subject: "Convert to client",
      description: `Enquiry converted. Client record ${sk} created. Service agreement draft started.`,
      createdBy: staff,
    }
  );

  const clientRisks = [
    {
      id: `risk-bulk-${p}-1`,
      lineNo: 1,
      riskType: pick(["Allergy", "Medical", "Behaviour", "Environmental"], i),
      showAsAlert: "Yes",
      name: pick(["Latex allergy", "Epilepsy — seizure plan", "Fall risk — mobility aid", "Choking risk — texture modified"], i),
      description: "Documented in support plan and shared with rostering. Staff briefed at handover.",
      validFrom: commence,
      validTo: "",
    },
    {
      id: `risk-bulk-${p}-2`,
      lineNo: 2,
      riskType: "Medical",
      showAsAlert: i % 4 === 0 ? "Yes" : "No",
      name: "Medication administration",
      description: "Requires staff with medication competency. Webster pack in kitchen.",
      validFrom: commence,
      validTo: "",
    },
  ];
  risks.push(...clientRisks.map((r) => ({ ...r, clientId })));

  const clientConsents = [
    {
      id: `consent-bulk-${p}-1`,
      lineNo: 1,
      consentType: pick(["Photo / video", "Information sharing", "Medical treatment"], i),
      showAsAlert: "Yes",
      name: pick(["Photo consent on file", "NDIS portal consent", "GP information release"], i),
      description: "Signed copy scanned to DMS. Review annually.",
      validFrom: commence,
      validTo: "",
    },
    {
      id: `consent-bulk-${p}-2`,
      lineNo: 2,
      consentType: "Restrictive practice",
      showAsAlert: "No",
      name: "Behaviour support plan consent",
      description: "Guardian signed BSP — valid to plan end date.",
      validFrom: commence,
      validTo: addDays(commence, 365),
    },
  ];
  consents.push(...clientConsents.map((c) => ({ ...c, clientId })));

  if (i % 3 !== 0) {
    restrictivePractices.push({
      id: `rp-bulk-${p}-1`,
      clientId,
      lineNo: 1,
      practiceType: pick(["Environmental restraint", "Mechanical restraint", "Physical restraint"], i),
      showAsAlert: "Yes",
      name: "Locked medication cupboard",
      description: "Environmental restrictive practice — authorised in BSP. Monthly review.",
      validFrom: commence,
      validTo: "",
    });
  }

  clientAlerts.push(
    {
      id: `alert-bulk-${p}-1`,
      clientId,
      lineNo: 1,
      alertType: pick(["Medical", "Safety", "Operational"], i),
      showAsAlert: "Yes",
      name: "Check support plan before roster changes",
      description: "Any roster or location change requires coordinator sign-off.",
      validFrom: commence,
      validTo: "",
    },
    {
      id: `alert-bulk-${p}-2`,
      clientId,
      lineNo: 2,
      alertType: "Incident",
      showAsAlert: "No",
      name: "Previous minor fall — monitor transfers",
      description: "Report any unsteadiness to team leader same shift.",
      validFrom: addDays(commence, 30),
      validTo: "",
    }
  );

  const acts = [
    {
      id: `act-bulk-${p}-1`,
      clientId,
      lineNo: 1,
      date: enqConverted,
      activityType: "Meeting",
      subject: "Intake and conversion",
      description: `Converted from enquiry ${enqDoc}. Welcome pack provided.`,
      createdBy: staff,
    },
    {
      id: `act-bulk-${p}-2`,
      clientId,
      lineNo: 2,
      date: addDays(commence, 7),
      activityType: "Home visit",
      subject: "Initial home safety check",
      description: "Verified access, equipment, and emergency contacts on file.",
      createdBy: staff,
    },
    {
      id: `act-bulk-${p}-3`,
      clientId,
      lineNo: 3,
      date: addDays(commence, 45),
      activityType: "Phone call",
      subject: "Plan review check-in",
      description: `${preferred} reported satisfaction with support team and community outings.`,
      createdBy: pick(STAFF, i + 1),
    },
    {
      id: `act-bulk-${p}-4`,
      clientId,
      lineNo: 4,
      date: addDays(commence, 120),
      activityType: "Email",
      subject: "NDIS plan variation",
      description: "Requested quote for additional community participation hours.",
      createdBy: staff,
    },
  ];
  clientActivities.push(...acts);

  clientLocations.push(
    {
      id: `cloc-bulk-${p}-home`,
      clientId,
      lineNo: 1,
      name: "Home",
      addressType: "Home",
      address1: `${10 + i} ${pick(["Ocean", "King", "Bridge", "Park", "Station"], i)} Street`,
      address2: i % 2 === 0 ? `Unit ${i}` : "",
      city: loc.city,
      state: "SA",
      postcode: loc.postcode,
      country: "Australia",
      phone: `08 8${String(200 + i).padStart(3, "0")} ${String(1000 + i * 11).slice(-4)}`,
      mobile: `04${String(10 + i).padStart(2, "0")} ${String(100 + i * 3).padStart(3, "0")} ${String(200 + i * 7).padStart(3, "0")}`,
      email,
      postToAddress: "No",
      invoiceAddress: "Yes",
      shipToAddress: "Yes",
      serviceDeliveryAddress: "Yes",
      active: "Yes",
      validFrom: commence,
      accessNotes: loc.type.includes("SIL") ? "Agency-managed property. Key safe on site." : "Level access. Buzzer entry.",
      description: `Primary ${loc.type.toLowerCase()} address.`,
    },
    {
      id: `cloc-bulk-${p}-post`,
      clientId,
      lineNo: 2,
      name: "Postal",
      addressType: "Postal",
      address1: `PO Box ${800 + i}`,
      city: loc.city,
      state: "SA",
      postcode: loc.postcode,
      country: "Australia",
      postToAddress: "Yes",
      invoiceAddress: "No",
      active: "Yes",
      validFrom: commence,
      description: "Official correspondence.",
    }
  );

  bpAssociations.push(
    {
      id: `bpa-bulk-${p}-1`,
      clientId,
      lineNo: 1,
      associatedBpName: pick(["Sarah (mother)", "James (brother)", "Maria (sister)", "David (father)"], i),
      associationType: "Family / friend",
      relationship: pick(["Parent", "Sibling", "Guardian"], i),
      mobile: `04${String(11 + i).padStart(2, "0")} 555 ${String(100 + i).padStart(3, "0")}`,
      primaryContact: "Yes",
      validFrom: commence,
      notes: "Primary emergency contact. Available weekdays after 5pm.",
    },
    {
      id: `bpa-bulk-${p}-2`,
      clientId,
      lineNo: 2,
      associatedBpName: pick(["Dr Chen", "Dr Patel", "Adelaide GP Clinic"], i),
      associationType: "Health professional",
      relationship: "GP",
      phone: "08 8221 5500",
      primaryContact: "No",
      validFrom: commence,
      notes: "Annual health summary requested each plan review.",
    }
  );

  contactActivities.push(
    {
      id: `cact-bulk-${p}-1`,
      clientId,
      lineNo: 1,
      date: addDays(commence, 3),
      activityType: "Phone call",
      contactName: "Family contact",
      subject: "Welcome call post-intake",
      description: "Confirmed transport arrangements and first week roster.",
      createdBy: staff,
    },
    {
      id: `cact-bulk-${p}-2`,
      clientId,
      lineNo: 2,
      date: addDays(commence, 60),
      activityType: "Email",
      contactName: "Support coordinator",
      subject: "Goal progress update",
      description: "Shared quarterly progress against NDIS goals 1 and 2.",
      createdBy: pick(STAFF, i + 2),
    },
    {
      id: `cact-bulk-${p}-3`,
      clientId,
      lineNo: 3,
      date: addDays(commence, 150),
      activityType: "Meeting",
      contactName: "Plan meeting attendees",
      subject: "Annual plan review",
      description: "Participant, family, and coordinator reviewed goals and service mix.",
      createdBy: staff,
    }
  );

  needsRules.push(
    {
      id: `need-bulk-${p}-1`,
      clientId,
      lineNo: 1,
      category: pick(["Personal care", "Communication", "Meals", "Mobility"], i),
      name: pick(["Morning routine", "AAC device", "Texture-modified meals", "Two-person transfer"], i),
      ruleText: "Follow support plan section. Document variances in shift notes same day.",
      showAsAlert: "Yes",
      validFrom: commence,
    },
    {
      id: `need-bulk-${p}-2`,
      clientId,
      lineNo: 2,
      category: "Community access",
      name: "Transport preferences",
      ruleText: "Prefers same support worker for community outings where possible. Allow 15 min transition time.",
      showAsAlert: "No",
      validFrom: commence,
    }
  );

  locationClients.push({
    id: `loc-cli-bulk-${p}`,
    locationId: loc.id,
    lineNo: (Math.floor((i - 1) / 5) % 4) + 1,
    clientId,
    assignmentRole: loc.role,
    primaryAssignment: "Yes",
    validFrom: commence,
    notes: `Bulk seed placement — ${loc.type} at ${loc.city}.`,
  });

  const saId = `sa-bulk-${p}`;
  const silPrice = (8500 + i * 127.5).toFixed(2);
  const cpPrice = (350 + i * 12.3).toFixed(2);
  const totalSa = (Number(silPrice) + Number(cpPrice)).toFixed(2);

  serviceAgreements.push({
    id: saId,
    searchKey: `${sk}_NDIS`,
    name: "NDIS Service Agreement",
    description: `${services} — active agreement for ${name}`,
    clientId,
    priceListId: "pl-ndis-2024",
    term: "Fixed Term",
    status: "Active",
    executionDate: commence,
    contractDate: commence,
    finishDate: addDays(commence, 365),
    reviewDate: addDays(commence, 300),
    totalPlannedAmount: totalSa,
    createdBy: staff,
    updatedBy: staff,
  });

  serviceAgreementLines.push(
    {
      id: `sal-bulk-${p}-1`,
      serviceAgreementId: saId,
      lineNo: 10,
      productId: "prod-sil-wd",
      name: "SIL",
      description: "Supported Independent Living — weekday",
      plannedPrice: silPrice,
      registrationGroup: "Supported Independent Living",
      fundingType: "Funding Body",
      fundingBody: funding,
      fundingManagementType: "Portal Managed",
      budgetRules: "Strict Limit",
    },
    {
      id: `sal-bulk-${p}-2`,
      serviceAgreementId: saId,
      lineNo: 20,
      productId: "prod-cp",
      name: "Community Participation",
      description: "Assistance with social and community participation",
      plannedPrice: cpPrice,
      registrationGroup: "Participation In Community And Social And Civic Activities",
      fundingType: "Funding Body",
      fundingBody: funding,
      fundingManagementType: "Portal Managed",
      budgetRules: "Warning",
    }
  );

  const sbDone = `sb-bulk-${p}-done`;
  const sbDraft = `sb-bulk-${p}-draft`;
  serviceBookings.push(
    {
      id: sbDone,
      documentNo: String(60000 + i),
      description: `SIL weekly block — ${sk}`,
      clientId,
      serviceAgreementId: saId,
      startDate: addDays(commence, 14),
      endDate: addDays(commence, 20),
      totalLines: 591,
      grandTotal: 591,
      documentStatus: "Completed",
      createdBy: staff,
      updatedBy: staff,
    },
    {
      id: sbDraft,
      documentNo: String(61000 + i),
      description: `Community participation — ${sk}`,
      clientId,
      serviceAgreementId: saId,
      startDate: addDays(commence, 90),
      endDate: addDays(commence, 90),
      totalLines: 261.88,
      grandTotal: 261.88,
      documentStatus: "Drafted",
      createdBy: staff,
      updatedBy: staff,
    }
  );

  serviceBookingLines.push(
    {
      id: `sbl-bulk-${p}-1`,
      serviceBookingId: sbDone,
      lineNo: 10,
      readyToClaim: true,
      orderedQuantity: 6,
      quantityInvoiced: 6,
      datePromised: addDays(commence, 20),
      productId: "prod-sil-wd",
      startDate: addDays(commence, 14),
      endDate: addDays(commence, 20),
      uom: "Hour",
      price: 98.5,
      lineAmount: 591,
    },
    {
      id: `sbl-bulk-${p}-2`,
      serviceBookingId: sbDraft,
      lineNo: 10,
      orderedQuantity: 4,
      datePromised: addDays(commence, 90),
      productId: "prod-cp",
      startDate: addDays(commence, 90),
      endDate: addDays(commence, 90),
      uom: "Hour",
      price: 65.47,
      lineAmount: 261.88,
    }
  );

  const ctrId = `ctr-bulk-${p}`;
  contracts.push({
    id: ctrId,
    documentNo: String(2000000 + i),
    clientId,
    businessPartnerName: name,
    contractType: "NDIS Service Agreement",
    name: `NDIS Support Agreement — ${name}`,
    description: `Signed agreement covering SIL and community supports for ${sk}.`,
    contractTerm: "Fixed",
    executionDate: commence,
    startDate: commence,
    endDate: addDays(commence, 365),
    reviewDate: addDays(commence, 300),
    reference: `NDIS-${sk}`,
    createdBy: staff,
    updatedBy: "SuperUser",
  });

  contractAudits.push(
    {
      id: `aud-bulk-${p}-1`,
      contractId: ctrId,
      lineNo: 1,
      auditDate: commence,
      changedBy: staff,
      action: "Created",
      description: `Linked to client ${sk}`,
    },
    {
      id: `aud-bulk-${p}-2`,
      contractId: ctrId,
      lineNo: 2,
      auditDate: addDays(commence, 180),
      changedBy: pick(STAFF, i + 1),
      action: "Reviewed",
      description: "Mid-term review — no material changes.",
    }
  );

  const spId = `sp-bulk-${p}`;
  const spDoc = String(1000300 + i);
  supportPlans.push({
    id: spId,
    clientId,
    documentNo: spDoc,
    description: `Active support plan for ${preferred} — reviewed with participant and family.`,
    providedToReceiver: addDays(commence, 5),
    executionDate: addDays(commence, 5),
    active: true,
    importantToMe: pick(["Family time on weekends", "Independence in daily routines", "Community volunteering", "Creative arts"], i),
    howSupported: "I like to try tasks myself first and will ask for help when needed.",
    hobbies: pick(["Gardening", "Music", "Swimming", "Reading", "Cooking"], i),
    likes: pick(["Quiet mornings", "Beach walks", "Coffee outings", "Pet therapy visits"], i),
    dislikes: pick(["Loud crowded spaces", "Sudden routine changes"], i),
    primaryLanguage: "English",
    interpreterRequired: "No",
    knownAllergies: clientRisks[0].name.includes("allergy") ? "See risk register" : "None documented",
    morning: "Wake, personal care, breakfast with preferred routine.",
    daytime: loc.type.includes("Day") ? "Attend day program activities." : "Community access or appointments.",
    afternoon: "Rest period. Light household tasks with support.",
    eveningNight: "Dinner, leisure time, evening medication if prescribed.",
    weekly: "Plan review touchpoint each Wednesday with key worker.",
    activityAttendance: true,
    activityDetails: services,
    personalCare: true,
    dressing: "Chooses own clothes; occasional assistance with fasteners.",
    mobilitySupportRequired: true,
    mobilityDetail: "Uses mobility aid. Follow manual handling plan.",
    transportArrangements: "Agency transport or accessible public transport.",
    financialArrangement: "Plan managed",
    financialArrangementDetails: "Plan manager handles invoices; participant approves major purchases.",
    createdBy: staff,
    updatedBy: staff,
  });

  const goalIds = [1, 2, 3].map((g) => `goal-bulk-${p}-${g}`);
  const goalNames = [
    "Increase community participation",
    "Build daily living skills",
    "Maintain health and wellbeing",
  ];
  goalIds.forEach((gid, gi) => {
    supportPlanGoals.push({
      id: gid,
      supportPlanId: spId,
      lineNo: gi + 1,
      name: goalNames[gi],
      goalNumber: `${gi + 1}-${pick(["One", "Two", "Three"], gi)}`,
      goalTerm: gi < 2 ? "Medium/Long Term Goal" : "Short Term Goal",
      goalType: "NDIS Goal",
      goal: goalNames[gi],
      supportRequired: `Coordinated supports via ${loc.city} team. Progress reviewed quarterly.`,
      startDate: addDays(commence, 14),
      endDate: addDays(commence, 365),
    });
    progressReviews.push({
      id: `pr-bulk-${p}-${gi + 1}`,
      goalId: gid,
      lineNo: 1,
      progressReviewType: "Quarterly review",
      reviewDate: addDays(commence, 90 + gi * 30),
      goalProgress: pick(["On track", "Some progress", "Achieved partial outcome"], i + gi),
      progressTaken: "Continued scheduled supports and family check-ins.",
      receiverFeeling: pick(["Happy with progress", "Wants more community outings", "Proud of achievements"], i),
      nextSteps: "Maintain current supports; revisit at next plan meeting.",
      createdBy: staff,
      updatedBy: staff,
    });
  });

  planDocuments.push({
    id: `pad-bulk-${p}`,
    clientId,
    documentNo: String(1000400 + i),
    documentType: "Plan",
    planType: "Support Plan",
    reviewDate: addDays(commence, 300),
    documentStatus: "Published",
    documentDeveloper: staff,
    supportPlanId: spId,
  });

  const incId = `inc-bulk-${p}`;
  const incOccurred = addDays(commence, 60 + i);
  incidents.push({
    id: incId,
    documentNo: `INC-B${pad(i)}`,
    title: pick(["Minor fall during transfer", "Medication timing variance", "Behaviour escalation — de-escalated", "Near miss in community outing", "Skin integrity check follow-up"], i),
    status: pick(["Closed", "Under investigation", "Submitted", "Draft"], i),
    severity: pick(["Low", "Medium", "High"], i),
    category: pick(["Near miss", "Operational", "Injury", "Behaviour"], i),
    serviceType: loc.type.includes("SIL") ? "SIL" : loc.type.includes("Day") ? "Day program" : "Respite",
    isReportable: i % 5 === 0,
    reportableType: i % 5 === 0 ? "Serious injury" : "",
    occurredAt: `${incOccurred}T14:30:00+00`,
    awareAt: `${incOccurred}T14:45:00+00`,
    reportedAt: incOccurred,
    primaryClientId: clientId,
    primaryEmployeeId: `emp-sw-${String((i % 32) + 1).padStart(3, "0")}`,
    primaryLocationId: loc.id,
    description: `Incident involving ${name} at ${loc.city}. Documented per organisational policy; family notified where required.`,
    immediateActions: "Participant checked, area secured, shift leader and coordinator informed same day.",
    investigationSummary: i % 2 === 0 ? "Reviewed roster notes and witness statements. No systemic issue identified." : "",
    correctiveActions: i % 3 === 0 ? "Additional briefing added to next team meeting." : "",
    lessonsLearned: "Reinforce manual handling and documentation standards.",
    createdBy: staff,
    updatedBy: pick(STAFF, i + 1),
  });
  incidentParties.push(
    {
      id: `ip-bulk-${p}-1`,
      incidentId: incId,
      lineNo: 1,
      partyType: "Client",
      entityId: clientId,
      partyName: name,
      roleInIncident: "Participant",
      notes: "",
    },
    {
      id: `ip-bulk-${p}-2`,
      incidentId: incId,
      lineNo: 2,
      partyType: "Employee",
      entityId: `emp-sw-${String((i % 32) + 1).padStart(3, "0")}`,
      partyName: "Support worker on shift",
      roleInIncident: "Witness",
      notes: "Completed incident statement.",
    }
  );
  incidentActions.push({
    id: `ia-bulk-${p}-1`,
    incidentId: incId,
    lineNo: 1,
    actionDate: addDays(incOccurred, 1),
    actionType: "Follow-up",
    description: "Coordinator called family and updated risk register if required.",
    evidenceRef: `INC-B${pad(i)}-notes`,
    owner: staff,
    outcome: pick(["Closed — no further action", "Monitoring for 7 days", "Referral to OT"], i),
  });

  clients.push({
    id: clientId,
    enquiryId: enqDoc,
    searchKey: sk,
    name,
    firstName: first,
    preferredName: preferred,
    lastName: last,
    email,
    phone: `08 8${String(200 + i).padStart(3, "0")} ${String(1000 + i).slice(-4)}`,
    status: "Active",
    birthday,
    gender: pick(GENDERS, i),
    decisionMaking: pick(DECISION, i),
    livingArrangement: pick(LIVING, i),
    salesRepresentative: "AbilityAPP",
    services,
    fundingBody: funding,
    fundingBodyNumber: funding.includes("NDIS") ? ndisNum : "",
    transitionedToPace: funding.includes("NDIS") ? addDays(commence, 200) : "",
    dateSupportCommencement: commence,
    aboriginalTorresStraitIslander: pick(["No", "Aboriginal", "Torres Strait Islander", "Both", "Prefer not to say"], i),
    culturalAffiliation: pick(["None specified", "Italian", "Vietnamese", "Greek", "Lebanese"], i),
    disability,
    additionalDisabilityInformation: `Primary diagnosis: ${disability}. Additional notes in support plan ${spDoc}.`,
    riskAlerts: riskSummary(clientRisks),
    consentAlertList: consentSummary(clientConsents),
    createdBy: staff,
    updatedBy: "SuperUser",
  });

  for (let t = 1; t <= 4; t++) {
    const taskSeq = i * 10 + t;
    const taskType = pick(TASK_TYPES, taskSeq);
    const status = pick(STATUSES, taskSeq);
    const priority = pick(PRIORITIES, taskSeq + 1);
    const assignToRole = taskSeq % 3 === 0;
    const user = pick(USERS, taskSeq);
    const role = pick(ROLES, taskSeq);
    const createdDay = addDays(commence, t * 5);
    const dueDate = addDays(createdDay, (taskSeq % 10) + 3);
    const entityType = t % 2 === 0 ? "service-agreement" : "client";
    const entityId = entityType === "client" ? clientId : saId;
    const entityLabel =
      entityType === "client" ? `${sk} — ${name}` : `SA-${sk} — ${name} NDIS`;
    const completed = status === "Completed" || status === "Cancelled";
    const title = `${pick(TASK_TITLES, taskSeq)} — ${name}`;
    const description = [
      `Task for ${name} (${sk}) linked to ${entityType.replace("-", " ")}.`,
      `Priority: ${priority}. Location: ${loc.city} (${loc.id}).`,
      `Funding: ${funding}. Services: ${services}.`,
      `Coordinator notes: follow support plan ${spDoc} and verify consent/risk tabs before completing.`,
    ].join(" ");

    tasks.push({
      id: `task-bulk-${p}-${t}`,
      documentNo: `REQ-B${String(3000 + taskSeq)}`,
      title,
      description,
      status,
      actionType: taskType.legacy,
      taskTypeId: taskType.id,
      priority,
      dueDate,
      assignmentType: assignToRole ? "role" : "user",
      assigneeUserId: assignToRole ? null : user.id,
      assigneeRoleId: assignToRole ? role.id : null,
      entityType,
      entityId,
      entityLabel,
      createdByUserId: "user-superuser",
      createdBy: "Super User",
      updatedBy: user.name,
      completedBy: completed ? user.name : "",
      completedAt: completed ? `${dueDate}T16:00:00.000Z` : null,
      resolutionNotes: completed && status === "Completed" ? "Completed during bulk client seed review." : "",
      updates: [
        {
          id: `tu-bulk-${p}-${t}-0`,
          at: `${createdDay}T09:00:00.000Z`,
          byUserId: user.id,
          byName: user.name,
          action: "created",
          summary: assignToRole ? `Assigned to role ${role.name}` : `Assigned to ${user.name}`,
          detail: `Linked to ${entityLabel}.`,
        },
      ],
    });
  }
}

const lines = [
  "-- Bulk client seed — 20 rich dummy clients (one-off data dump)",
  "-- Generate: npm run supabase:seed-clients-bulk",
  "-- Apply: npx supabase db query --linked -f supabase/seed-clients-bulk.sql",
  "",
  "delete from public.app_task where id like 'task-bulk-%';",
  "delete from public.incident_action where id like 'ia-bulk-%';",
  "delete from public.incident_party where id like 'ip-bulk-%';",
  "delete from public.incident where id like 'inc-bulk-%';",
  "delete from public.service_booking_line where id like 'sbl-bulk-%';",
  "delete from public.service_booking where id like 'sb-bulk-%';",
  "delete from public.service_agreement_line where id like 'sal-bulk-%';",
  "delete from public.service_agreement where id like 'sa-bulk-%';",
  "delete from public.contract_audit where id like 'aud-bulk-%';",
  "delete from public.contract where id like 'ctr-bulk-%';",
  "delete from public.support_plan_goal_progress_review where id like 'pr-bulk-%';",
  "delete from public.support_plan_goal where id like 'goal-bulk-%';",
  "delete from public.plan_assessment_document where id like 'pad-bulk-%';",
  "delete from public.support_plan where id like 'sp-bulk-%';",
  "delete from public.support_location_client where id like 'loc-cli-bulk-%';",
  "delete from public.client_restrictive_practice where id like 'rp-bulk-%';",
  "delete from public.client_consent where id like 'consent-bulk-%';",
  "delete from public.client_risk where id like 'risk-bulk-%';",
  "delete from public.client_bp_association where id like 'bpa-bulk-%';",
  "delete from public.client_contact_activity where id like 'cact-bulk-%';",
  "delete from public.client_support_receiver_need_rule where id like 'need-bulk-%';",
  "delete from public.client_alert where id like 'alert-bulk-%';",
  "delete from public.client_activity where id like 'act-bulk-%';",
  "delete from public.client_location where id like 'cloc-bulk-%';",
  "delete from public.client where id like 'bp-bulk-%';",
  "delete from public.enquiry_activity where id like 'ea-bulk-%';",
  "delete from public.enquiry where id between '1000201' and '1000220';",
  "",
];

const sbDefaults = {
  organization: "AbilityERP",
  targetDocumentType: "Service Booking - Standard",
  isTemplate: false,
  readyToClaimRule: "Manual Tick",
  programOfSupports: false,
  dateOrdered: null,
  datePromised: null,
  invoicePartner: "NDIS - National Disability Insurance Scheme",
  bookingGeneratorRef: "",
};

addInsert(
  lines,
  "enquiry",
  [
    "id", "document_no", "date_received", "date_next_action", "status", "first_name", "last_name",
    "funding_body", "disability", "services", "is_enquiry_for_self", "third_party_consent",
    "relationship_type", "phone", "email", "birthday", "gender", "preferred_communication_method",
    "bp_name", "enquiry_source", "description", "outcome", "additional_disability_information",
    "other", "created_by", "updated_by",
  ],
  enquiries.map((e) => {
    const v = [
      sqlString(e.id), sqlString(e.documentNo), sqlDate(e.dateReceived), sqlDate(e.dateNextAction),
      sqlString(e.status), sqlString(e.firstName), sqlString(e.lastName), sqlString(e.fundingBody),
      sqlString(e.disability), sqlString(e.services), sqlString("Yes"), sqlString("Received"),
      sqlString(""), sqlString(""), sqlString(""), "null", sqlString(""), sqlString("Phone Call"),
      sqlString(""), sqlString(e.enquirySource), sqlString(e.description), sqlString(e.outcome),
      sqlString(""), sqlString(""), sqlString(e.createdBy), sqlString(e.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "enquiry_activity",
  ["id", "enquiry_id", "line_no", "activity_date", "activity_type", "subject", "description", "created_by"],
  enquiryActivities.map((a) =>
    `  (${[sqlString(a.id), sqlString(a.enquiryId), String(a.lineNo), sqlDate(a.date), sqlString(a.activityType), sqlString(a.subject), sqlString(a.description), sqlString(a.createdBy)].join(", ")})`
  )
);

addInsert(
  lines,
  "client",
  [
    "id", "enquiry_id", "search_key", "business_partner_group", "name", "risk_alerts",
    "consent_alert_list", "first_name", "preferred_name", "last_name", "middle_name", "email", "phone",
    "status", "birthday", "is_estimated_age", "gender", "decision_making", "lgbtiqa",
    "living_arrangement", "sales_representative", "services", "funding_body", "funding_body_number",
    "transitioned_to_pace", "date_support_commencement", "date_support_ceased",
    "aboriginal_torres_strait_islander", "cultural_affiliation", "disability",
    "additional_disability_information", "created_by", "updated_by",
  ],
  clients.map((c) => {
    const v = [
      sqlString(c.id), sqlString(c.enquiryId), sqlString(c.searchKey), sqlString("Client"),
      sqlString(c.name), sqlString(c.riskAlerts), sqlString(c.consentAlertList),
      sqlString(c.firstName), sqlString(c.preferredName), sqlString(c.lastName), sqlString(""),
      sqlString(c.email), sqlString(c.phone), sqlString(c.status), sqlDate(c.birthday), sqlBool(false),
      sqlString(c.gender), sqlString(c.decisionMaking), sqlString(""),
      sqlString(c.livingArrangement), sqlString(c.salesRepresentative), sqlString(c.services),
      sqlString(c.fundingBody), sqlString(c.fundingBodyNumber), sqlDate(c.transitionedToPace),
      sqlDate(c.dateSupportCommencement), "null", sqlString(c.aboriginalTorresStraitIslander),
      sqlString(c.culturalAffiliation), sqlString(c.disability),
      sqlString(c.additionalDisabilityInformation), sqlString(c.createdBy), sqlString(c.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "client_alert",
  ["id", "client_id", "line_no", "alert_type", "show_as_alert", "name", "description", "valid_from", "valid_to"],
  clientAlerts.map((a) =>
    `  (${[sqlString(a.id), sqlString(a.clientId), String(a.lineNo), sqlString(a.alertType), sqlString(a.showAsAlert), sqlString(a.name), sqlString(a.description), sqlDate(a.validFrom), sqlDate(a.validTo ?? "")].join(", ")})`
  )
);

addInsert(
  lines,
  "client_activity",
  ["id", "client_id", "line_no", "activity_date", "activity_type", "subject", "description", "created_by"],
  clientActivities.map((a) =>
    `  (${[sqlString(a.id), sqlString(a.clientId), String(a.lineNo), sqlDate(a.date), sqlString(a.activityType), sqlString(a.subject), sqlString(a.description), sqlString(a.createdBy)].join(", ")})`
  )
);

addInsert(
  lines,
  "client_location",
  [
    "id", "client_id", "line_no", "name", "address_type", "address1", "address2", "address3", "city",
    "state", "postcode", "country", "phone", "mobile", "email", "post_to_address", "invoice_address",
    "ship_to_address", "service_delivery_address", "active", "valid_from", "valid_to", "access_notes",
    "description",
  ],
  clientLocations.map((l) => {
    const v = [
      sqlString(l.id), sqlString(l.clientId), String(l.lineNo), sqlString(l.name), sqlString(l.addressType),
      sqlString(l.address1), sqlString(l.address2 ?? ""), sqlString(l.address3 ?? ""), sqlString(l.city),
      sqlString(l.state), sqlString(l.postcode), sqlString(l.country), sqlString(l.phone ?? ""),
      sqlString(l.mobile ?? ""), sqlString(l.email ?? ""), sqlString(l.postToAddress), sqlString(l.invoiceAddress ?? "No"),
      sqlString(l.shipToAddress ?? "No"), sqlString(l.serviceDeliveryAddress ?? "No"), sqlString(l.active),
      sqlDate(l.validFrom), sqlDate(l.validTo ?? ""), sqlString(l.accessNotes ?? ""), sqlString(l.description ?? ""),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "client_restrictive_practice",
  ["id", "client_id", "line_no", "practice_type", "show_as_alert", "name", "description", "valid_from", "valid_to"],
  restrictivePractices.map((r) =>
    `  (${[sqlString(r.id), sqlString(r.clientId), String(r.lineNo), sqlString(r.practiceType), sqlString(r.showAsAlert), sqlString(r.name), sqlString(r.description), sqlDate(r.validFrom), sqlDate(r.validTo ?? "")].join(", ")})`
  )
);

addInsert(
  lines,
  "client_consent",
  ["id", "client_id", "line_no", "consent_type", "show_as_alert", "name", "description", "valid_from", "valid_to"],
  consents.map((c) =>
    `  (${[sqlString(c.id), sqlString(c.clientId), String(c.lineNo), sqlString(c.consentType), sqlString(c.showAsAlert), sqlString(c.name), sqlString(c.description), sqlDate(c.validFrom), sqlDate(c.validTo ?? "")].join(", ")})`
  )
);

addInsert(
  lines,
  "client_risk",
  ["id", "client_id", "line_no", "risk_type", "show_as_alert", "name", "description", "valid_from", "valid_to"],
  risks.map((r) =>
    `  (${[sqlString(r.id), sqlString(r.clientId), String(r.lineNo), sqlString(r.riskType), sqlString(r.showAsAlert), sqlString(r.name), sqlString(r.description), sqlDate(r.validFrom), sqlDate(r.validTo ?? "")].join(", ")})`
  )
);

addInsert(
  lines,
  "client_bp_association",
  [
    "id", "client_id", "line_no", "associated_bp_name", "association_type", "relationship", "phone",
    "mobile", "email", "primary_contact", "valid_from", "valid_to", "notes",
  ],
  bpAssociations.map((b) =>
    `  (${[sqlString(b.id), sqlString(b.clientId), String(b.lineNo), sqlString(b.associatedBpName), sqlString(b.associationType), sqlString(b.relationship), sqlString(b.phone ?? ""), sqlString(b.mobile ?? ""), sqlString(b.email ?? ""), sqlString(b.primaryContact), sqlDate(b.validFrom), sqlDate(b.validTo ?? ""), sqlString(b.notes ?? "")].join(", ")})`
  )
);

addInsert(
  lines,
  "client_contact_activity",
  ["id", "client_id", "line_no", "activity_date", "activity_type", "contact_name", "subject", "description", "created_by"],
  contactActivities.map((a) =>
    `  (${[sqlString(a.id), sqlString(a.clientId), String(a.lineNo), sqlDate(a.date), sqlString(a.activityType), sqlString(a.contactName), sqlString(a.subject), sqlString(a.description), sqlString(a.createdBy)].join(", ")})`
  )
);

addInsert(
  lines,
  "client_support_receiver_need_rule",
  ["id", "client_id", "line_no", "category", "name", "rule_text", "show_as_alert", "valid_from", "valid_to"],
  needsRules.map((n) =>
    `  (${[sqlString(n.id), sqlString(n.clientId), String(n.lineNo), sqlString(n.category), sqlString(n.name), sqlString(n.ruleText), sqlString(n.showAsAlert), sqlDate(n.validFrom), sqlDate(n.validTo ?? "")].join(", ")})`
  )
);

addInsert(
  lines,
  "support_location_client",
  ["id", "location_id", "line_no", "client_id", "assignment_role", "primary_assignment", "valid_from", "notes"],
  locationClients.map((l) =>
    `  (${[sqlString(l.id), sqlString(l.locationId), String(l.lineNo), sqlString(l.clientId), sqlString(l.assignmentRole), sqlString(l.primaryAssignment), sqlDate(l.validFrom), sqlString(l.notes)].join(", ")})`
  )
);

addInsert(
  lines,
  "service_agreement",
  [
    "id", "search_key", "name", "description", "client_id", "price_list_id", "term", "status",
    "execution_date", "contract_date", "finish_date", "review_date", "total_planned_amount",
    "created_by", "updated_by",
  ],
  serviceAgreements.map((s) => {
    const v = [
      sqlString(s.id), sqlString(s.searchKey), sqlString(s.name), sqlString(s.description),
      sqlString(s.clientId), sqlString(s.priceListId), sqlString(s.term), sqlString(s.status),
      sqlDate(s.executionDate), sqlDate(s.contractDate), sqlDate(s.finishDate), sqlDate(s.reviewDate),
      sqlNum(s.totalPlannedAmount), sqlString(s.createdBy), sqlString(s.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "service_agreement_line",
  [
    "id", "service_agreement_id", "line_no", "product_id", "name", "description", "planned_price",
    "registration_group", "funding_type", "funding_body", "funding_management_type", "budget_rules",
  ],
  serviceAgreementLines.map((l) =>
    `  (${[sqlString(l.id), sqlString(l.serviceAgreementId), String(l.lineNo), sqlString(l.productId), sqlString(l.name), sqlString(l.description), sqlNum(l.plannedPrice), sqlString(l.registrationGroup), sqlString(l.fundingType), sqlString(l.fundingBody), sqlString(l.fundingManagementType), sqlString(l.budgetRules)].join(", ")})`
  )
);

addInsert(
  lines,
  "service_booking",
  [
    "id", "document_no", "organization", "description", "target_document_type", "is_template",
    "ready_to_claim_rule", "program_of_supports", "date_ordered", "date_promised", "start_date",
    "end_date", "client_id", "invoice_partner", "service_agreement_id", "booking_generator_ref",
    "total_lines", "grand_total", "document_status", "created_by", "updated_by",
  ],
  serviceBookings.map((b) => {
    const v = [
      sqlString(b.id), sqlString(b.documentNo), sqlString(sbDefaults.organization), sqlString(b.description),
      sqlString(sbDefaults.targetDocumentType), sqlBool(sbDefaults.isTemplate),
      sqlString(sbDefaults.readyToClaimRule), sqlBool(sbDefaults.programOfSupports),
      sqlDate(b.startDate), sqlDate(b.endDate), sqlDate(b.startDate), sqlDate(b.endDate),
      sqlString(b.clientId), sqlString(sbDefaults.invoicePartner), sqlString(b.serviceAgreementId),
      sqlString(sbDefaults.bookingGeneratorRef), sqlNum(b.totalLines), sqlNum(b.grandTotal),
      sqlString(b.documentStatus), sqlString(b.createdBy), sqlString(b.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "service_booking_line",
  [
    "id", "service_booking_id", "line_no", "manual_hold", "ready_to_claim", "ordered_quantity",
    "quantity_invoiced", "date_promised", "product_id", "claim_type", "use_time_based_quantity",
    "start_date", "end_date", "uom", "price", "line_amount",
  ],
  serviceBookingLines.map((l) =>
    `  (${[
      sqlString(l.id), sqlString(l.serviceBookingId), String(l.lineNo), sqlBool(false),
      sqlBool(l.readyToClaim ?? false), sqlNum(l.orderedQuantity), sqlNum(l.quantityInvoiced ?? 0),
      sqlDate(l.datePromised), sqlString(l.productId), sqlString(""), sqlBool(true),
      sqlDate(l.startDate), sqlDate(l.endDate), sqlString(l.uom), sqlNum(l.price), sqlNum(l.lineAmount),
    ].join(", ")})`
  )
);

addInsert(
  lines,
  "contract",
  [
    "id", "document_no", "client_id", "business_partner_name", "contract_type", "name", "description",
    "contract_term", "execution_date", "start_date", "end_date", "review_date", "reference", "project",
    "created_by", "updated_by",
  ],
  contracts.map((c) => {
    const v = [
      sqlString(c.id), sqlString(c.documentNo), sqlString(c.clientId), sqlString(c.businessPartnerName),
      sqlString(c.contractType), sqlString(c.name), sqlString(c.description), sqlString(c.contractTerm),
      sqlDate(c.executionDate), sqlDate(c.startDate), sqlDate(c.endDate), sqlDate(c.reviewDate),
      sqlString(c.reference), sqlString(""), sqlString(c.createdBy), sqlString(c.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "contract_audit",
  ["id", "contract_id", "line_no", "audit_date", "changed_by", "action", "description"],
  contractAudits.map((a) =>
    `  (${[sqlString(a.id), sqlString(a.contractId), String(a.lineNo), sqlDate(a.auditDate), sqlString(a.changedBy), sqlString(a.action), sqlString(a.description)].join(", ")})`
  )
);

const spCols = [
  "id", "client_id", "document_no", "description", "provided_to_receiver", "execution_date", "active",
  "important_to_me", "how_supported", "hobbies", "cultural_needs", "likes", "dislikes", "about_other",
  "primary_language", "interpreter_required", "communication_method", "medication_required",
  "medication_details", "known_allergies", "medical_history", "behaviour_support_required",
  "behaviour_description", "strategies", "relaxation", "stress_cause", "morning", "daytime", "afternoon",
  "evening_night", "weekly", "activity_attendance", "activity_details", "personal_care", "dressing",
  "hair_care", "menstrual_management", "oral_hygiene", "nail_care", "shaving", "sleeping", "toilet_use",
  "showering", "personal_care_other", "household_support_required", "cooking", "cleaning", "gardening",
  "laundry", "make_bed", "grocery", "mobility_support_required", "mobility_detail",
  "eating_drinking_support", "dietary_allergies", "favourite_foods", "disliked_foods", "meal_other",
  "transport_arrangements", "financial_arrangement", "financial_arrangement_details", "created_by",
  "updated_by",
];

function supportPlanValues(s) {
  const byCol = {
    id: sqlString(s.id),
    client_id: sqlString(s.clientId),
    document_no: sqlString(s.documentNo),
    description: sqlString(s.description),
    provided_to_receiver: sqlDate(s.providedToReceiver),
    execution_date: sqlDate(s.executionDate),
    active: sqlBool(s.active),
    important_to_me: sqlString(s.importantToMe),
    how_supported: sqlString(s.howSupported),
    hobbies: sqlString(s.hobbies),
    cultural_needs: sqlString(""),
    likes: sqlString(s.likes),
    dislikes: sqlString(s.dislikes),
    about_other: sqlString(""),
    primary_language: sqlString(s.primaryLanguage),
    interpreter_required: sqlString(s.interpreterRequired),
    communication_method: sqlString(""),
    medication_required: sqlString("No"),
    medication_details: sqlString(""),
    known_allergies: sqlString(s.knownAllergies),
    medical_history: sqlString(""),
    behaviour_support_required: sqlString("No"),
    behaviour_description: sqlString(""),
    strategies: sqlString(""),
    relaxation: sqlString(""),
    stress_cause: sqlString(""),
    morning: sqlString(s.morning),
    daytime: sqlString(s.daytime),
    afternoon: sqlString(s.afternoon),
    evening_night: sqlString(s.eveningNight),
    weekly: sqlString(s.weekly),
    activity_attendance: sqlBool(s.activityAttendance),
    activity_details: sqlString(s.activityDetails),
    personal_care: sqlBool(s.personalCare),
    dressing: sqlString(s.dressing),
    mobility_support_required: sqlString(s.mobilitySupportRequired ? "Yes" : "No"),
    mobility_detail: sqlString(s.mobilityDetail),
    transport_arrangements: sqlString(s.transportArrangements),
    financial_arrangement: sqlString(s.financialArrangement),
    financial_arrangement_details: sqlString(s.financialArrangementDetails),
    created_by: sqlString(s.createdBy),
    updated_by: sqlString(s.updatedBy),
    household_support_required: sqlBool(false),
  };
  const v = spCols.map((col) => byCol[col] ?? sqlString(""));
  if (v.length !== spCols.length) throw new Error(`support_plan column mismatch: ${spCols.length} cols, ${v.length} vals`);
  return `  (${v.join(", ")})`;
}

addInsert(
  lines,
  "support_plan",
  spCols,
  supportPlans.map((s) => supportPlanValues(s))
);

addInsert(
  lines,
  "support_plan_goal",
  [
    "id", "support_plan_id", "line_no", "name", "goal_number", "goal_term", "goal_type", "goal",
    "support_required", "start_date", "end_date",
  ],
  supportPlanGoals.map((g) =>
    `  (${[sqlString(g.id), sqlString(g.supportPlanId), String(g.lineNo), sqlString(g.name), sqlString(g.goalNumber), sqlString(g.goalTerm), sqlString(g.goalType), sqlString(g.goal), sqlString(g.supportRequired), sqlDate(g.startDate), sqlDate(g.endDate)].join(", ")})`
  )
);

addInsert(
  lines,
  "support_plan_goal_progress_review",
  [
    "id", "goal_id", "line_no", "progress_review_type", "review_date", "goal_progress",
    "progress_taken", "receiver_feeling", "next_steps", "created_by", "updated_by",
  ],
  progressReviews.map((p) =>
    `  (${[sqlString(p.id), sqlString(p.goalId), String(p.lineNo), sqlString(p.progressReviewType), sqlDate(p.reviewDate), sqlString(p.goalProgress), sqlString(p.progressTaken), sqlString(p.receiverFeeling), sqlString(p.nextSteps), sqlString(p.createdBy), sqlString(p.updatedBy)].join(", ")})`
  )
);

addInsert(
  lines,
  "plan_assessment_document",
  [
    "id", "client_id", "document_no", "document_type", "plan_type", "assessment_type", "review_date",
    "date_received", "document_status", "document_developer", "support_plan_id",
  ],
  planDocuments.map((d) =>
    `  (${[sqlString(d.id), sqlString(d.clientId), sqlString(d.documentNo), sqlString(d.documentType), sqlString(d.planType), sqlString(""), sqlDate(d.reviewDate), "null", sqlString(d.documentStatus), sqlString(d.documentDeveloper), sqlString(d.supportPlanId)].join(", ")})`
  )
);

addInsert(
  lines,
  "incident",
  [
    "id", "document_no", "title", "status", "severity", "category", "service_type",
    "is_reportable", "reportable_type", "restrictive_practice_caused_harm",
    "occurred_at", "aware_at", "reported_at", "report_deadline_at",
    "ndis_notified_at", "ndis_notification_ref",
    "primary_client_id", "primary_employee_id", "primary_location_id",
    "linked_restrictive_practice_id", "manager_reviewed_at", "manager_reviewed_by",
    "description", "immediate_actions", "investigation_summary", "corrective_actions", "lessons_learned",
    "created_by", "updated_by",
  ],
  incidents.map((inc) => {
    const v = [
      sqlString(inc.id), sqlString(inc.documentNo), sqlString(inc.title), sqlString(inc.status),
      sqlString(inc.severity), sqlString(inc.category), sqlString(inc.serviceType),
      sqlBool(inc.isReportable), sqlString(inc.reportableType), sqlBool(false),
      sqlString(inc.occurredAt), sqlString(inc.awareAt), sqlDate(inc.reportedAt), "null",
      "null", sqlString(""),
      sqlString(inc.primaryClientId), sqlString(inc.primaryEmployeeId), sqlString(inc.primaryLocationId),
      sqlString(""), "null", sqlString(""),
      sqlString(inc.description), sqlString(inc.immediateActions), sqlString(inc.investigationSummary),
      sqlString(inc.correctiveActions), sqlString(inc.lessonsLearned),
      sqlString(inc.createdBy), sqlString(inc.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  })
);

addInsert(
  lines,
  "incident_party",
  ["id", "incident_id", "line_no", "party_type", "entity_id", "party_name", "role_in_incident", "notes"],
  incidentParties.map((p) =>
    `  (${[sqlString(p.id), sqlString(p.incidentId), String(p.lineNo), sqlString(p.partyType), sqlString(p.entityId), sqlString(p.partyName), sqlString(p.roleInIncident), sqlString(p.notes)].join(", ")})`
  )
);

addInsert(
  lines,
  "incident_action",
  ["id", "incident_id", "line_no", "action_date", "action_type", "description", "evidence_ref", "owner", "outcome"],
  incidentActions.map((a) =>
    `  (${[sqlString(a.id), sqlString(a.incidentId), String(a.lineNo), sqlDate(a.actionDate), sqlString(a.actionType), sqlString(a.description), sqlString(a.evidenceRef), sqlString(a.owner), sqlString(a.outcome)].join(", ")})`
  )
);

lines.push("insert into public.app_task (");
lines.push(
  "  id, document_no, title, description, status, action_type, task_type_id, priority, due_date,"
);
lines.push(
  "  assignment_type, assignee_user_id, assignee_role_id, entity_type, entity_id, entity_label,"
);
lines.push(
  "  created_by_user_id, created_by, updated_by, completed_by, completed_at, resolution_notes, updates"
);
lines.push(") values");
lines.push(
  tasks
    .map((t, i) => {
      const suffix = i === tasks.length - 1 ? "" : ",";
      return `  (${sqlString(t.id)}, ${sqlString(t.documentNo)}, ${sqlString(t.title)}, ${sqlString(t.description)}, ${sqlString(t.status)}, ${sqlString(t.actionType)}, ${sqlString(t.taskTypeId)}, ${sqlString(t.priority)}, ${sqlString(t.dueDate)}, ${sqlString(t.assignmentType)}, ${t.assigneeUserId ? sqlString(t.assigneeUserId) : "null"}, ${t.assigneeRoleId ? sqlString(t.assigneeRoleId) : "null"}, ${sqlString(t.entityType)}, ${sqlString(t.entityId)}, ${sqlString(t.entityLabel)}, ${sqlString(t.createdByUserId)}, ${sqlString(t.createdBy)}, ${sqlString(t.updatedBy)}, ${sqlString(t.completedBy)}, ${t.completedAt ? sqlString(t.completedAt) : "null"}, ${sqlString(t.resolutionNotes)}, ${sqlString(JSON.stringify(t.updates))}::jsonb)${suffix}`;
    })
    .join("\n")
);
lines.push("on conflict (id) do update set");
lines.push("  document_no = excluded.document_no,");
lines.push("  title = excluded.title,");
lines.push("  description = excluded.description,");
lines.push("  status = excluded.status,");
lines.push("  updates = excluded.updates;");
lines.push("");

const outPath = join(root, "supabase", "seed-clients-bulk.sql");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${COUNT} clients (${tasks.length} tasks) to ${outPath}`);
