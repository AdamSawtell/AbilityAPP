/**
 * Generates supabase/seed-entities.sql from TypeScript seed data.
 * Run: cd web && npx tsx ../scripts/generate-entity-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { initialRecords: enquiries } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "enquiry.ts")).href
);
const { initialClients } = await import(pathToFileURL(join(root, "web", "src", "lib", "client.ts")).href);
const { initialProducts, initialPriceLists } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "product.ts")).href
);
const { initialServiceAgreements } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "service-agreement.ts")).href
);
const { initialContracts } = await import(pathToFileURL(join(root, "web", "src", "lib", "contract.ts")).href);
const { initialSupportPlans, initialPlanDocuments } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "support-plan.ts")).href
);

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

const lines = [
  "-- Entity seed (generated from web/src/lib/* seed data)",
  "-- Re-run: npm run supabase:seed-entities",
  "",
];

function addInsert(table, columns, rows, conflict) {
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

// Enquiries
addInsert(
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
      sqlString(e.disability), sqlString(e.services), sqlString(e.isEnquiryForSelf),
      sqlString(e.thirdPartyConsent), sqlString(e.relationshipType), sqlString(e.phone),
      sqlString(e.email), sqlDate(e.birthday), sqlString(e.gender),
      sqlString(e.preferredCommunicationMethod), sqlString(e.bpName), sqlString(e.enquirySource),
      sqlString(e.description), sqlString(e.outcome), sqlString(e.additionalDisabilityInformation),
      sqlString(e.other), sqlString(e.createdBy), sqlString(e.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

const enquiryActivityRows = enquiries.flatMap((e) =>
  (e.activity ?? []).map((a) => {
    const v = [
      sqlString(a.id), sqlString(e.id), String(a.lineNo), sqlDate(a.date),
      sqlString(a.activityType), sqlString(a.subject), sqlString(a.description), sqlString(a.createdBy),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "enquiry_activity",
  ["id", "enquiry_id", "line_no", "activity_date", "activity_type", "subject", "description", "created_by"],
  enquiryActivityRows,
  "(id)"
);

// Price lists
addInsert(
  "price_list",
  ["id", "name", "schema_name", "base_price_list_id", "valid_from", "currency", "created_by", "updated_by"],
  initialPriceLists.map((p) => {
    const v = [
      sqlString(p.id), sqlString(p.name), sqlString(p.schema), sqlString(p.basePriceListId),
      sqlDate(p.validFrom), sqlString(p.currency), sqlString(p.createdBy), sqlString(p.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

// Products
addInsert(
  "product",
  [
    "id", "search_key", "name", "description", "product_category", "uom", "product_type", "active",
    "sold", "price_list_id", "ndis_support_item", "created_by", "updated_by",
  ],
  initialProducts.map((p) => {
    const v = [
      sqlString(p.id), sqlString(p.searchKey), sqlString(p.name), sqlString(p.description),
      sqlString(p.productCategory), sqlString(p.uom), sqlString(p.productType), sqlBool(p.active),
      sqlBool(p.sold), sqlString(p.priceListId), sqlString(p.ndisSupportItem ?? ""),
      sqlString(p.createdBy), sqlString(p.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

// Price list lines
const pllRows = initialPriceLists.flatMap((pl) =>
  pl.lines.map((line) => {
    const v = [
      sqlString(line.id), sqlString(pl.id), String(line.lineNo), sqlString(line.productId),
      sqlNum(line.listPrice), sqlNum(line.standardPrice), sqlNum(line.limitPrice),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "price_list_line",
  ["id", "price_list_id", "line_no", "product_id", "list_price", "standard_price", "limit_price"],
  pllRows,
  "(id)"
);

// Clients
addInsert(
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
  initialClients.map((c) => {
    const v = [
      sqlString(c.id), c.enquiryId?.trim() ? sqlString(c.enquiryId) : "null", sqlString(c.searchKey),
      sqlString(c.businessPartnerGroup), sqlString(c.name), sqlString(c.riskAlerts),
      sqlString(c.consentAlertList), sqlString(c.firstName), sqlString(c.preferredName),
      sqlString(c.lastName), sqlString(c.middleName), sqlString(c.email), sqlString(c.phone),
      sqlString(c.status), sqlDate(c.birthday), sqlBool(c.isEstimatedAge), sqlString(c.gender),
      sqlString(c.decisionMaking), sqlString(c.lgbtiqa), sqlString(c.livingArrangement),
      sqlString(c.salesRepresentative), sqlString(c.services), sqlString(c.fundingBody),
      sqlString(c.fundingBodyNumber), sqlDate(c.transitionedToPace), sqlDate(c.dateSupportCommencement),
      sqlDate(c.dateSupportCeased), sqlString(c.aboriginalTorresStraitIslander),
      sqlString(c.culturalAffiliation), sqlString(c.disability),
      sqlString(c.additionalDisabilityInformation), sqlString(c.createdBy), sqlString(c.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

const alertRows = initialClients.flatMap((c) =>
  (c.alerts ?? []).map((a) => {
    const v = [
      sqlString(a.id), sqlString(c.id), String(a.lineNo), sqlString(a.alertType),
      sqlString(a.showAsAlert), sqlString(a.name), sqlString(a.description),
      sqlDate(a.validFrom), sqlDate(a.validTo),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "client_alert",
  ["id", "client_id", "line_no", "alert_type", "show_as_alert", "name", "description", "valid_from", "valid_to"],
  alertRows,
  "(id)"
);

const activityRows = initialClients.flatMap((c) =>
  (c.activity ?? []).map((a) => {
    const v = [
      sqlString(a.id), sqlString(c.id), String(a.lineNo), sqlDate(a.date),
      sqlString(a.activityType), sqlString(a.subject), sqlString(a.description), sqlString(a.createdBy),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "client_activity",
  ["id", "client_id", "line_no", "activity_date", "activity_type", "subject", "description", "created_by"],
  activityRows,
  "(id)"
);

const locationRows = initialClients.flatMap((c) =>
  (c.locations ?? []).map((l) => {
    const v = [
      sqlString(l.id), sqlString(c.id), String(l.lineNo), sqlString(l.name), sqlString(l.addressType),
      sqlString(l.address1), sqlString(l.address2), sqlString(l.address3), sqlString(l.city),
      sqlString(l.state), sqlString(l.postcode), sqlString(l.country), sqlString(l.phone),
      sqlString(l.mobile), sqlString(l.email), sqlString(l.postToAddress), sqlString(l.invoiceAddress),
      sqlString(l.shipToAddress), sqlString(l.serviceDeliveryAddress), sqlString(l.active),
      sqlDate(l.validFrom), sqlDate(l.validTo), sqlString(l.accessNotes), sqlString(l.description),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "client_location",
  [
    "id", "client_id", "line_no", "name", "address_type", "address1", "address2", "address3", "city",
    "state", "postcode", "country", "phone", "mobile", "email", "post_to_address", "invoice_address",
    "ship_to_address", "service_delivery_address", "active", "valid_from", "valid_to", "access_notes",
    "description",
  ],
  locationRows,
  "(id)"
);

// Service agreements
addInsert(
  "service_agreement",
  [
    "id", "search_key", "name", "description", "client_id", "price_list_id", "term", "status",
    "execution_date", "contract_date", "finish_date", "review_date", "total_planned_amount",
    "created_by", "updated_by",
  ],
  initialServiceAgreements.map((s) => {
    const v = [
      sqlString(s.id), sqlString(s.searchKey), sqlString(s.name), sqlString(s.description),
      sqlString(s.clientId), sqlString(s.priceListId), sqlString(s.term), sqlString(s.status),
      sqlDate(s.executionDate), sqlDate(s.contractDate), sqlDate(s.finishDate), sqlDate(s.reviewDate),
      sqlNum(s.totalPlannedAmount), sqlString(s.createdBy), sqlString(s.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

const salRows = initialServiceAgreements.flatMap((s) =>
  s.lines.map((line) => {
    const v = [
      sqlString(line.id), sqlString(s.id), String(line.lineNo), sqlString(line.productId),
      sqlString(line.name), sqlString(line.description), sqlNum(line.plannedPrice),
      sqlString(line.registrationGroup), sqlString(line.fundingType), sqlString(line.fundingBody),
      sqlString(line.fundingManagementType), sqlString(line.budgetRules),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "service_agreement_line",
  [
    "id", "service_agreement_id", "line_no", "product_id", "name", "description", "planned_price",
    "registration_group", "funding_type", "funding_body", "funding_management_type", "budget_rules",
  ],
  salRows,
  "(id)"
);

// Contracts
addInsert(
  "contract",
  [
    "id", "document_no", "client_id", "business_partner_name", "contract_type", "name", "description",
    "contract_term", "execution_date", "start_date", "end_date", "review_date", "reference", "project",
    "created_by", "updated_by",
  ],
  initialContracts.map((c) => {
    const v = [
      sqlString(c.id), sqlString(c.documentNo), c.clientId?.trim() ? sqlString(c.clientId) : "null",
      sqlString(c.businessPartnerName), sqlString(c.contractType), sqlString(c.name),
      sqlString(c.description), sqlString(c.contractTerm), sqlDate(c.executionDate),
      sqlDate(c.startDate), sqlDate(c.endDate), sqlDate(c.reviewDate), sqlString(c.reference),
      sqlString(c.project), sqlString(c.createdBy), sqlString(c.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

const auditRows = initialContracts.flatMap((c) =>
  c.audit.map((a) => {
    const v = [
      sqlString(a.id), sqlString(c.id), String(a.lineNo), sqlDate(a.auditDate),
      sqlString(a.changedBy), sqlString(a.action), sqlString(a.description),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "contract_audit",
  ["id", "contract_id", "line_no", "audit_date", "changed_by", "action", "description"],
  auditRows,
  "(id)"
);

// Support plans
const spFields = [
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

addInsert(
  "support_plan",
  spFields,
  initialSupportPlans.map((s) => {
    const v = [
      sqlString(s.id), sqlString(s.clientId), sqlString(s.documentNo), sqlString(s.description),
      sqlDate(s.providedToReceiver), sqlDate(s.executionDate), sqlBool(s.active),
      sqlString(s.importantToMe), sqlString(s.howSupported), sqlString(s.hobbies),
      sqlString(s.culturalNeeds), sqlString(s.likes), sqlString(s.dislikes), sqlString(s.aboutOther),
      sqlString(s.primaryLanguage), sqlString(s.interpreterRequired), sqlString(s.communicationMethod),
      sqlString(s.medicationRequired), sqlString(s.medicationDetails), sqlString(s.knownAllergies),
      sqlString(s.medicalHistory), sqlString(s.behaviourSupportRequired),
      sqlString(s.behaviourDescription), sqlString(s.strategies), sqlString(s.relaxation),
      sqlString(s.stressCause), sqlString(s.morning), sqlString(s.daytime), sqlString(s.afternoon),
      sqlString(s.eveningNight), sqlString(s.weekly), sqlBool(s.activityAttendance),
      sqlString(s.activityDetails), sqlBool(s.personalCare), sqlString(s.dressing),
      sqlString(s.hairCare), sqlString(s.menstrualManagement), sqlString(s.oralHygiene),
      sqlString(s.nailCare), sqlString(s.shaving), sqlString(s.sleeping), sqlString(s.toiletUse),
      sqlString(s.showering), sqlString(s.personalCareOther), sqlBool(s.householdSupportRequired),
      sqlString(s.cooking), sqlString(s.cleaning), sqlString(s.gardening), sqlString(s.laundry),
      sqlString(s.makeBed), sqlString(s.grocery), sqlString(s.mobilitySupportRequired),
      sqlString(s.mobilityDetail), sqlString(s.eatingDrinkingSupport), sqlString(s.dietaryAllergies),
      sqlString(s.favouriteFoods), sqlString(s.dislikedFoods), sqlString(s.mealOther),
      sqlString(s.transportArrangements), sqlString(s.financialArrangement),
      sqlString(s.financialArrangementDetails), sqlString(s.createdBy), sqlString(s.updatedBy),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

const goalRows = initialSupportPlans.flatMap((s) =>
  s.goals.map((g) => {
    const v = [
      sqlString(g.id), sqlString(s.id), String(g.lineNo), sqlString(g.name), sqlString(g.goalNumber),
      sqlString(g.goalTerm), sqlString(g.goalType), sqlString(g.goal), sqlString(g.supportRequired),
      sqlDate(g.startDate), sqlDate(g.endDate),
    ];
    return `  (${v.join(", ")})`;
  })
);
addInsert(
  "support_plan_goal",
  [
    "id", "support_plan_id", "line_no", "name", "goal_number", "goal_term", "goal_type", "goal",
    "support_required", "start_date", "end_date",
  ],
  goalRows,
  "(id)"
);

addInsert(
  "plan_assessment_document",
  [
    "id", "client_id", "document_no", "document_type", "plan_type", "assessment_type", "review_date",
    "date_received", "document_status", "document_developer", "support_plan_id",
  ],
  initialPlanDocuments.map((d) => {
    const v = [
      sqlString(d.id), sqlString(d.clientId), sqlString(d.documentNo), sqlString(d.documentType),
      sqlString(d.planType), sqlString(d.assessmentType), sqlDate(d.reviewDate),
      sqlDate(d.dateReceived), sqlString(d.documentStatus), sqlString(d.documentDeveloper),
      sqlString(d.supportPlanId),
    ];
    return `  (${v.join(", ")})`;
  }),
  "(id)"
);

const outPath = join(root, "supabase", "seed-entities.sql");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
