/**
 * Generates supabase/seed-glenelg-roster.sql — a full NDIS SIL house roster of
 * care for Glenelg SIL House (loc-glenelg-sil).
 *
 * Produces, idempotently (on conflict do update):
 *   - 2 additional residents (clients) + home address + service agreements/lines
 *   - support_location_client resident links (3 residents total)
 *   - Jason Brown support worker (30h) + address, emergency contact, credentials
 *   - support_location_employee team assignments (Glenelg-based pool)
 *   - roster_of_care + roster_of_care_line master templates per resident
 *     (AM 07:00-15:00, PM 15:00-22:00, Sleepover 22:00-07:00, Wed day program)
 *
 * Re-run: npm run supabase:seed-glenelg-roster
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function s(value) {
  if (value === null || value === undefined) return "''";
  return `'${String(value).replace(/'/g, "''")}'`;
}
function d(value) {
  if (!value || !String(value).trim()) return "null";
  return s(value);
}
function n(value) {
  if (value === null || value === undefined || value === "") return "null";
  const x = Number(value);
  return Number.isFinite(x) ? String(x) : "null";
}
function b(value) {
  return value ? "true" : "false";
}

const LOCATION_ID = "loc-glenelg-sil";
const HUB_ID = "loc-adelaide-hub";
const PRICE_LIST = "pl-ndis-2024";
const VALID_FROM = "2026-01-05"; // Monday — master template effective date
const CREATED_BY = "Isla Robinson";
const FUNDING_BODY = "NDIS - National Disability Insurance Scheme";

const WD = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// --- Residents -------------------------------------------------------------
// bp-bern already exists (Bernadette Rose) with service agreement sa-rose-ni
// (SIL line sal-1, CP line sal-2). New residents created below.
const residents = [
  {
    clientId: "bp-bern",
    label: "Bernadette Rose",
    rocId: "roc-glen-bern",
    serviceAgreementId: "sa-rose-ni",
    silLineId: "sal-1",
    cpLineId: "sal-2",
    isNew: false,
    dayProgram: true,
  },
  {
    clientId: "cli-glen-marcus",
    label: "Marcus Webb",
    rocId: "roc-glen-marcus",
    serviceAgreementId: "sa-glen-marcus",
    silLineId: "sal-marcus-sil",
    cpLineId: "sal-marcus-cp",
    isNew: true,
    dayProgram: true,
    client: {
      searchKey: "Webb",
      firstName: "Marcus",
      preferredName: "Marcus",
      lastName: "Webb",
      email: "marcus.webb@example.com",
      phone: "08 8294 2210",
      birthday: "1994-03-12",
      gender: "Male",
      decisionMaking: "Supported decision making",
      livingArrangement: "Lives in Supported Independent Living",
      commencement: "2022-08-01",
      disability: "ID - Intellectual Disability",
      additional:
        "Autism spectrum disorder with co-occurring intellectual disability. Positive behaviour support plan in place; benefits from consistent staff and predictable routine.",
      riskAlerts: "Behaviours of concern — follow behaviour support plan",
      consentAlert: "",
      home: { address1: "22 Partridge Street", address2: "Room 2" },
      sa: {
        searchKey: "WEBB_Marcus Webb",
        name: "NDIS Service Agreement",
        description: "High intensity SIL and community participation",
        total: 318450,
        silPrice: 301500,
        cpPrice: 16950,
      },
      emergency: { name: "Diane Webb", relationship: "Parent", mobile: "0412 700 211" },
    },
  },
  {
    clientId: "cli-glen-priya",
    label: "Priya Nair",
    rocId: "roc-glen-priya",
    serviceAgreementId: "sa-glen-priya",
    silLineId: "sal-priya-sil",
    cpLineId: "sal-priya-cp",
    isNew: true,
    dayProgram: false,
    client: {
      searchKey: "Nair",
      firstName: "Priya",
      preferredName: "Priya",
      lastName: "Nair",
      email: "priya.nair@example.com",
      phone: "08 8294 2220",
      birthday: "1998-11-05",
      gender: "Female",
      decisionMaking: "Supported decision making",
      livingArrangement: "Lives in Supported Independent Living",
      commencement: "2023-02-15",
      disability: "Down syndrome",
      additional:
        "Down syndrome with epilepsy. Seizure management plan and choking/mealtime management plan in place. Requires prompting and supervision for daily living.",
      riskAlerts: "Epilepsy — seizure management plan; mealtime/choking risk",
      consentAlert: "",
      home: { address1: "22 Partridge Street", address2: "Room 3" },
      sa: {
        searchKey: "NAIR_Priya Nair",
        name: "NDIS Service Agreement",
        description: "High intensity SIL and community participation",
        total: 305800,
        silPrice: 289000,
        cpPrice: 16800,
      },
      emergency: { name: "Anil Nair", relationship: "Sibling", mobile: "0412 700 222" },
    },
  },
];

// --- Workers ---------------------------------------------------------------
// Glenelg-based pool. Jason Brown is newly created at 30 standard hours.
const JASON = "emp-jason-brown";
const W = {
  noah: "emp-sw-002", // FT 38
  amelia: "emp-sw-017", // FT 38
  kai: "emp-sw-032", // FT 38
  ivy: "emp-staff-137", // Team Leader FT 38
  jason: JASON, // PT 30
  henry: "emp-sw-012", // PT 22
  evie: "emp-sw-027", // PT 22
  chloe: "emp-sw-007", // casual relief
  archie: "emp-sw-022", // casual relief
};

// Weekly rotation. AM/PM = 2 workers, Night sleepover = 1, Wed day program = 1.
// Indexed by weekday 0=Mon..6=Sun.
const rotation = [
  { am: [W.noah, W.amelia], pm: [W.kai, W.ivy], night: [W.chloe] }, // Mon
  { am: [W.noah, W.jason], pm: [W.amelia, W.kai], night: [W.archie] }, // Tue
  { am: [W.ivy, W.jason], pm: [W.noah, W.henry], night: [W.chloe], day: [W.evie] }, // Wed
  { am: [W.amelia, W.kai], pm: [W.ivy, W.jason], night: [W.archie] }, // Thu
  { am: [W.noah, W.henry], pm: [W.amelia, W.evie], night: [W.chloe] }, // Fri
  { am: [W.kai, W.evie], pm: [W.ivy, W.henry], night: [W.archie] }, // Sat
  { am: [W.noah, W.jason], pm: [W.kai, W.amelia], night: [W.chloe] }, // Sun
];

const SHIFTS = [
  { key: "AM", start: "07:00", end: "15:00", type: "Standard", ratio: "1:2", hours: 8, rotKey: "am" },
  { key: "PM", start: "15:00", end: "22:00", type: "Standard", ratio: "1:2", hours: 7, rotKey: "pm" },
  { key: "NIGHT", start: "22:00", end: "07:00", type: "Sleepover", ratio: "1:3", hours: 2, rotKey: "night" },
];

// --- Build SQL -------------------------------------------------------------
const out = [];
out.push("-- Glenelg SIL House — full roster of care master template (generated)");
out.push("-- Re-run: npm run supabase:seed-glenelg-roster");
out.push("-- Additive + idempotent (on conflict do update). Run after seed-locations.sql.");
out.push("");

// Hours summary (informational)
const hours = {};
function addHours(emp, h) {
  hours[emp] = (hours[emp] ?? 0) + h;
}
for (const day of rotation) {
  for (const sh of SHIFTS) {
    for (const emp of day[sh.rotKey] ?? []) addHours(emp, sh.hours);
  }
  for (const emp of day.day ?? []) addHours(emp, 4);
}
const nameByEmp = Object.fromEntries(Object.entries(W).map(([k, v]) => [v, k]));
out.push("-- Indicative weekly worker hours from this master roster:");
for (const [emp, h] of Object.entries(hours).sort((a, c) => c[1] - a[1])) {
  out.push(`--   ${nameByEmp[emp] ?? emp} (${emp}): ${h}h (sleepover counted as 2h active)`);
}
out.push("");

// New clients
const newResidents = residents.filter((r) => r.isNew);
out.push(
  "insert into public.client (id, enquiry_id, search_key, business_partner_group, name, risk_alerts, consent_alert_list, first_name, preferred_name, last_name, middle_name, email, phone, status, birthday, is_estimated_age, gender, decision_making, lgbtiqa, living_arrangement, sales_representative, services, funding_body, funding_body_number, transitioned_to_pace, date_support_commencement, date_support_ceased, aboriginal_torres_strait_islander, cultural_affiliation, disability, additional_disability_information, created_by, updated_by)"
);
out.push("values");
out.push(
  newResidents
    .map((r) => {
      const c = r.client;
      return `  (${s(r.clientId)}, null, ${s(c.searchKey)}, ${s("Support Receiver")}, ${s(r.label)}, ${s(
        c.riskAlerts
      )}, ${s(c.consentAlert)}, ${s(c.firstName)}, ${s(c.preferredName)}, ${s(c.lastName)}, '', ${s(c.email)}, ${s(
        c.phone
      )}, ${s("2_Active receiving support")}, ${s(c.birthday)}, false, ${s(c.gender)}, ${s(c.decisionMaking)}, '', ${s(
        c.livingArrangement
      )}, ${s(CREATED_BY)}, '', ${s(FUNDING_BODY)}, '', null, ${d(c.commencement)}, null, ${s("Neither")}, ${s(
        "Australian"
      )}, ${s(c.disability)}, ${s(c.additional)}, ${s(CREATED_BY)}, ${s("SuperUser")})`;
    })
    .join(",\n")
);
out.push("on conflict (id) do update set");
out.push(
  "  search_key = excluded.search_key, name = excluded.name, risk_alerts = excluded.risk_alerts, first_name = excluded.first_name, last_name = excluded.last_name, status = excluded.status, living_arrangement = excluded.living_arrangement, disability = excluded.disability, additional_disability_information = excluded.additional_disability_information, updated_by = excluded.updated_by;"
);
out.push("");

// New client home addresses
out.push(
  "insert into public.client_location (id, client_id, line_no, name, address_type, address1, address2, address3, city, state, postcode, country, phone, mobile, email, post_to_address, invoice_address, ship_to_address, service_delivery_address, active, valid_from, valid_to, access_notes, description)"
);
out.push("values");
out.push(
  newResidents
    .map((r) => {
      const c = r.client;
      return `  (${s(`loc-home-${r.clientId}`)}, ${s(r.clientId)}, 1, ${s("Home")}, ${s("Home")}, ${s(
        c.home.address1
      )}, ${s(c.home.address2)}, '', ${s("Glenelg")}, ${s("SA")}, ${s("5045")}, ${s("Australia")}, ${s(
        c.phone
      )}, '', ${s(c.email)}, ${s("No")}, ${s("Yes")}, ${s("Yes")}, ${s("Yes")}, ${s("Yes")}, ${d(
        r.client.home ? VALID_FROM : ""
      )}, null, ${s("Shared SIL residence — 24/7 support.")}, ${s("Primary SIL placement at Glenelg SIL House.")})`;
    })
    .join(",\n")
);
out.push("on conflict (id) do update set address1 = excluded.address1, description = excluded.description;");
out.push("");

// Service agreements (new residents only)
out.push(
  "insert into public.service_agreement (id, search_key, name, description, client_id, price_list_id, term, status, execution_date, contract_date, finish_date, review_date, total_planned_amount, created_by, updated_by)"
);
out.push("values");
out.push(
  newResidents
    .map((r) => {
      const sa = r.client.sa;
      return `  (${s(r.serviceAgreementId)}, ${s(sa.searchKey)}, ${s(sa.name)}, ${s(sa.description)}, ${s(
        r.clientId
      )}, ${s(PRICE_LIST)}, ${s("Fixed Term")}, ${s("Active")}, ${s("2026-01-01")}, ${s("2026-01-01")}, ${s(
        "2026-12-31"
      )}, ${s("2026-09-30")}, ${n(sa.total)}, ${s(CREATED_BY)}, ${s(CREATED_BY)})`;
    })
    .join(",\n")
);
out.push("on conflict (id) do update set name = excluded.name, description = excluded.description, total_planned_amount = excluded.total_planned_amount, updated_by = excluded.updated_by;");
out.push("");

// Service agreement lines (new residents only)
out.push(
  "insert into public.service_agreement_line (id, service_agreement_id, line_no, product_id, name, description, planned_price, registration_group, funding_type, funding_body, funding_management_type, budget_rules)"
);
out.push("values");
out.push(
  newResidents
    .flatMap((r) => {
      const sa = r.client.sa;
      return [
        `  (${s(r.silLineId)}, ${s(r.serviceAgreementId)}, 10, ${s("prod-sil-wd")}, ${s("SIL")}, ${s(
          "Supported Independent Living — 24/7 shared support"
        )}, ${n(sa.silPrice)}, ${s("Supported Independent Living")}, ${s("Funding Body")}, ${s(
          FUNDING_BODY
        )}, ${s("Portal Managed")}, ${s("Strict Limit")})`,
        `  (${s(r.cpLineId)}, ${s(r.serviceAgreementId)}, 20, ${s("prod-cp")}, ${s("Community Participation")}, ${s(
          "Assistance with social and community participation"
        )}, ${n(sa.cpPrice)}, ${s("Participation In Community And Social And Civic Activities")}, ${s(
          "Funding Body"
        )}, ${s(FUNDING_BODY)}, ${s("Portal Managed")}, ${s("Warning")})`,
      ];
    })
    .join(",\n")
);
out.push("on conflict (id) do update set name = excluded.name, planned_price = excluded.planned_price;");
out.push("");

// Resident links to the house
out.push(
  "insert into public.support_location_client (id, location_id, line_no, client_id, assignment_role, primary_assignment, valid_from, notes)"
);
out.push("values");
out.push(
  [
    `  (${s("loc-cli-glen-marcus")}, ${s(LOCATION_ID)}, 2, ${s("cli-glen-marcus")}, ${s("Resident")}, ${s(
      "Yes"
    )}, ${s("2022-08-01")}, ${s("SIL placement — Room 2")})`,
    `  (${s("loc-cli-glen-priya")}, ${s(LOCATION_ID)}, 3, ${s("cli-glen-priya")}, ${s("Resident")}, ${s("Yes")}, ${s(
      "2023-02-15"
    )}, ${s("SIL placement — Room 3")})`,
  ].join(",\n")
);
out.push(
  "on conflict (id) do update set client_id = excluded.client_id, assignment_role = excluded.assignment_role, notes = excluded.notes;"
);
out.push("");

// Jason Brown employee
out.push(
  "insert into public.employee (id, search_key, business_partner_group, name, first_name, last_name, preferred_name, middle_name, email, phone, mobile, job_title, department, employment_status, employment_type, start_date, end_date, probation_end_date, confirmation_date, notice_days, site_branch, cost_centre, gender, birthday, employee_number, reports_to_id, driver_licence_class, driver_licence_expiry, visa_subclass, visa_expiry, work_rights_notes, bank_name, bank_bsb, bank_account_number, pay_method, tfn, tax_declaration, super_fund, super_member_number, standard_hours_per_week, fte, leave_policy, medical_restrictions_notes, notes, created_by, updated_by)"
);
out.push("values");
out.push(
  `  (${s(JASON)}, ${s("JasBr")}, ${s("Employee")}, ${s("Jason Brown")}, ${s("Jason")}, ${s("Brown")}, ${s(
    "Jason"
  )}, '', ${s("jason.brown@abilityerp.local")}, '', ${s("0412 808 909")}, ${s("Support Worker")}, ${s(
    "Operations"
  )}, ${s("Active")}, ${s("Part-time")}, ${s("2024-09-01")}, null, ${s("2025-03-01")}, ${s(
    "2025-03-15"
  )}, 2, ${s("Glenelg")}, ${s("CC-OPS")}, ${s("Male")}, ${s("1990-09-09")}, ${s(
    "EMP-1201"
  )}, ${s("emp-staff-137")}, ${s("C")}, ${s("2028-09-01")}, '', null, ${s(
    "Australian citizen"
  )}, ${s("Commonwealth Bank")}, ${s("065-000")}, ${s("12012012")}, ${s("Bank")}, '', ${s(
    "Tax-free threshold claimed"
  )}, ${s("Australian Super")}, ${s("AS-12012")}, 30, 0.79, ${s(
    "Standard award — pro-rata"
  )}, '', ${s("Glenelg SIL House regular support worker — 30 hours")}, ${s("SuperUser")}, ${s("SuperUser")})`
);
out.push(
  "on conflict (id) do update set name = excluded.name, job_title = excluded.job_title, employment_type = excluded.employment_type, site_branch = excluded.site_branch, standard_hours_per_week = excluded.standard_hours_per_week, fte = excluded.fte, reports_to_id = excluded.reports_to_id, updated_by = excluded.updated_by;"
);
out.push("");

// Jason address, emergency contact, credentials
out.push(
  "insert into public.employee_location (id, employee_id, line_no, name, address_type, address1, address2, address3, city, state, postcode, country, phone, mobile, email, primary_address, active, valid_from, valid_to, access_notes, description)"
);
out.push("values");
out.push(
  `  (${s("loc-emp-jason-brown-home")}, ${s(JASON)}, 1, ${s("Home")}, ${s("Home")}, ${s(
    "9 Augusta Street"
  )}, '', '', ${s("Glenelg")}, ${s("SA")}, ${s("5045")}, ${s("Australia")}, '', ${s(
    "0412 808 909"
  )}, ${s("jason.brown@abilityerp.local")}, ${s("Yes")}, ${s("Yes")}, ${s("2024-09-01")}, null, '', '')`
);
out.push("on conflict (id) do update set name = excluded.name, primary_address = excluded.primary_address;");
out.push("");

out.push(
  "insert into public.employee_emergency_contact (id, employee_id, line_no, contact_type, name, relationship, phone, mobile, email, call_order, primary_contact, notes)"
);
out.push("values");
out.push(
  `  (${s("ec-emp-jason-brown-1")}, ${s(JASON)}, 1, ${s("Emergency")}, ${s("Karen Brown")}, ${s(
    "Spouse"
  )}, '', ${s("0412 808 910")}, '', 1, ${s("Yes")}, '')`
);
out.push("on conflict (id) do update set name = excluded.name, primary_contact = excluded.primary_contact;");
out.push("");

out.push(
  "insert into public.employee_credential (id, employee_id, line_no, credential_type, credential_number, issuing_body, issue_date, expiry_date, status, document_ref, notes, created_by, updated_by)"
);
out.push("values");
out.push(
  [
    `  (${s("cred-emp-jason-brown-wwcc")}, ${s(JASON)}, 1, ${s("Working with Children Check")}, ${s(
      "WWCC-12012"
    )}, ${s("DHS Screening")}, ${s("2024-08-01")}, ${s("2029-08-01")}, ${s("Current")}, '', '', ${s(
      "SuperUser"
    )}, ${s("SuperUser")})`,
    `  (${s("cred-emp-jason-brown-ndis")}, ${s(JASON)}, 2, ${s("NDIS Worker Screening")}, ${s(
      "NDIS-WS-12012"
    )}, ${s("NDIS Worker Screening Unit")}, ${s("2024-08-01")}, ${s("2029-08-01")}, ${s(
      "Current"
    )}, '', '', ${s("SuperUser")}, ${s("SuperUser")})`,
    `  (${s("cred-emp-jason-brown-fa")}, ${s(JASON)}, 3, ${s("First Aid Certificate")}, ${s("FA-12012")}, ${s(
      "St John Ambulance"
    )}, ${s("2025-01-10")}, ${s("2027-01-10")}, ${s("Current")}, '', '', ${s("SuperUser")}, ${s(
      "SuperUser"
    )})`,
  ].join(",\n")
);
out.push(
  "on conflict (id) do update set credential_type = excluded.credential_type, expiry_date = excluded.expiry_date, status = excluded.status;"
);
out.push("");

// Team assignments to the house
const team = [
  { line: 3, emp: "emp-staff-137", role: "Team leader", note: "Glenelg SIL team leader" },
  { line: 4, emp: JASON, role: "Support worker", note: "Regular roster — 30 hours" },
  { line: 5, emp: "emp-sw-002", role: "Support worker", note: "Full-time regular" },
  { line: 6, emp: "emp-sw-017", role: "Support worker", note: "Full-time regular" },
  { line: 7, emp: "emp-sw-032", role: "Support worker", note: "Full-time regular" },
  { line: 8, emp: "emp-sw-012", role: "Support worker", note: "Part-time" },
  { line: 9, emp: "emp-sw-027", role: "Support worker", note: "Part-time" },
  { line: 10, emp: "emp-sw-007", role: "Support worker", note: "Casual relief / sleepovers" },
  { line: 11, emp: "emp-sw-022", role: "Support worker", note: "Casual relief / sleepovers" },
];
out.push(
  "insert into public.support_location_employee (id, location_id, line_no, employee_id, assignment_role, primary_assignment, valid_from, notes)"
);
out.push("values");
out.push(
  team
    .map(
      (t) =>
        `  (${s(`loc-emp-glen-${t.emp}`)}, ${s(LOCATION_ID)}, ${t.line}, ${s(t.emp)}, ${s(t.role)}, ${s(
          "No"
        )}, ${s(VALID_FROM)}, ${s(t.note)})`
    )
    .join(",\n")
);
out.push(
  "on conflict (id) do update set employee_id = excluded.employee_id, assignment_role = excluded.assignment_role, notes = excluded.notes;"
);
out.push("");

// Roster of care headers
out.push("delete from public.roster_of_care_line where roster_of_care_id in (" + residents.map((r) => s(r.rocId)).join(", ") + ");");
out.push(
  "insert into public.roster_of_care (id, client_id, service_agreement_id, name, status, source, valid_from, valid_to, created_by, updated_by)"
);
out.push("values");
out.push(
  residents
    .map(
      (r) =>
        `  (${s(r.rocId)}, ${s(r.clientId)}, ${s(r.serviceAgreementId)}, ${s(
          "Glenelg SIL weekly roster"
        )}, ${s("Active")}, ${s("Manual")}, ${s(VALID_FROM)}, null, ${s(CREATED_BY)}, ${s(CREATED_BY)})`
    )
    .join(",\n")
);
out.push(
  "on conflict (id) do update set service_agreement_id = excluded.service_agreement_id, name = excluded.name, status = excluded.status, valid_from = excluded.valid_from, updated_by = excluded.updated_by;"
);
out.push("");

// Roster of care lines
const lineRows = [];
for (const r of residents) {
  let lineNo = 0;
  for (let wd = 0; wd < 7; wd += 1) {
    const day = rotation[wd];
    for (const sh of SHIFTS) {
      lineNo += 1;
      const sessionKey = `GLEN-${sh.key}-${WD[wd]}`;
      const workers = day[sh.rotKey] ?? [];
      const idx = residents.indexOf(r);
      // Spread the session's workers across the first N residents' lines so the
      // published session merges to the correct distinct worker set.
      const defaultEmp = idx < workers.length ? workers[idx] : "";
      const note =
        sh.key === "NIGHT"
          ? "Sleepover with active assistance as required"
          : sh.key === "AM"
          ? "Morning personal care, meals, community access prep"
          : "Evening meals, activities, settling";
      lineRows.push({
        id: `rocl-${r.rocId}-${WD[wd]}-${sh.key}`,
        rocId: r.rocId,
        lineNo,
        weekday: wd,
        start: sh.start,
        end: sh.end,
        type: sh.type,
        locationId: LOCATION_ID,
        salId: r.silLineId,
        defaultEmp,
        ratio: sh.ratio,
        sessionKey,
        notes: note,
      });
    }
    // Wednesday group day program (Community Participation) for attendees.
    if (wd === 2 && r.dayProgram) {
      lineNo += 1;
      const workers = day.day ?? [];
      const idx = residents.filter((x) => x.dayProgram).indexOf(r);
      const defaultEmp = idx < workers.length ? workers[idx] : "";
      lineRows.push({
        id: `rocl-${r.rocId}-WED-DAY`,
        rocId: r.rocId,
        lineNo,
        weekday: 2,
        start: "10:00",
        end: "14:00",
        type: "Standard",
        locationId: HUB_ID,
        salId: r.cpLineId,
        defaultEmp,
        ratio: "1:3",
        sessionKey: "GLEN-DAY-WED",
        notes: "Group community participation at Adelaide Day Hub",
      });
    }
  }
}

out.push(
  "insert into public.roster_of_care_line (id, roster_of_care_id, line_no, weekday, start_time, end_time, support_type, location_id, service_agreement_line_id, worker_requirement, default_employee_id, support_ratio, session_key, notes)"
);
out.push("values");
out.push(
  lineRows
    .map(
      (l) =>
        `  (${s(l.id)}, ${s(l.rocId)}, ${l.lineNo}, ${l.weekday}, ${s(l.start)}, ${s(l.end)}, ${s(
          l.type
        )}, ${s(l.locationId)}, ${s(l.salId)}, '', ${l.defaultEmp ? s(l.defaultEmp) : "null"}, ${s(
          l.ratio
        )}, ${s(l.sessionKey)}, ${s(l.notes)})`
    )
    .join(",\n") + ";"
);
out.push("");

writeFileSync(join(root, "supabase", "seed-glenelg-roster.sql"), out.join("\n"), "utf8");
console.log(
  `Wrote supabase/seed-glenelg-roster.sql — ${residents.length} residents, ${lineRows.length} RoC lines.`
);
