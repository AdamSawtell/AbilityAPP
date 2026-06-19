/**
 * Generates supabase/seed-employees.sql from TypeScript seed data.
 * Run: npm run supabase:seed-employees
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { initialEmployees } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "employee.ts")).href
);

function sqlString(value) {
  if (value === null || value === undefined) return "''";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlDate(value) {
  if (!value?.trim()) return "null";
  return sqlString(value);
}

function sqlNum(value) {
  if (value === null || value === undefined || value === "") return "null";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "null";
}

const lines = [
  "-- Employee seed",
  "-- Re-run: npm run supabase:seed-employees",
  "",
  "insert into public.employee (",
  "  id, search_key, business_partner_group, name, first_name, last_name,",
  "  preferred_name, middle_name, email, phone, mobile, job_title, department,",
  "  employment_status, employment_type, start_date, end_date, probation_end_date, confirmation_date, notice_days,",
  "  site_branch, cost_centre, gender, birthday, employee_number, reports_to_id,",
  "  driver_licence_class, driver_licence_expiry, visa_subclass, visa_expiry, work_rights_notes,",
  "  bank_name, bank_bsb, bank_account_number, pay_method, tfn, tax_declaration, super_fund, super_member_number,",
  "  standard_hours_per_week, fte, leave_policy, medical_restrictions_notes, notes, picture_url, created_by, updated_by",
  ")",
  "values",
];

lines.push(
  initialEmployees
    .map(
      (e) =>
        `  (${sqlString(e.id)}, ${sqlString(e.searchKey)}, ${sqlString(e.businessPartnerGroup)}, ${sqlString(e.name)}, ${sqlString(e.firstName)}, ${sqlString(e.lastName)}, ${sqlString(e.preferredName)}, ${sqlString(e.middleName)}, ${sqlString(e.email)}, ${sqlString(e.phone)}, ${sqlString(e.mobile)}, ${sqlString(e.jobTitle)}, ${sqlString(e.department)}, ${sqlString(e.employmentStatus)}, ${sqlString(e.employmentType)}, ${sqlDate(e.startDate)}, ${sqlDate(e.endDate)}, ${sqlDate(e.probationEndDate)}, ${sqlDate(e.confirmationDate)}, ${sqlNum(e.noticeDays)}, ${sqlString(e.siteBranch)}, ${sqlString(e.costCentre)}, ${sqlString(e.gender)}, ${sqlDate(e.birthday)}, ${sqlString(e.employeeNumber)}, ${e.reportsToId ? sqlString(e.reportsToId) : "null"}, ${sqlString(e.driverLicenceClass)}, ${sqlDate(e.driverLicenceExpiry)}, ${sqlString(e.visaSubclass)}, ${sqlDate(e.visaExpiry)}, ${sqlString(e.workRightsNotes)}, ${sqlString(e.bankName)}, ${sqlString(e.bankBsb)}, ${sqlString(e.bankAccountNumber)}, ${sqlString(e.payMethod)}, ${sqlString(e.tfn)}, ${sqlString(e.taxDeclaration)}, ${sqlString(e.superFund)}, ${sqlString(e.superMemberNumber)}, ${sqlNum(e.standardHoursPerWeek)}, ${sqlNum(e.fte)}, ${sqlString(e.leavePolicy)}, ${sqlString(e.medicalRestrictionsNotes)}, ${sqlString(e.notes)}, ${sqlString(e.pictureUrl ?? "")}, ${sqlString(e.createdBy)}, ${sqlString(e.updatedBy)})`
    )
    .join(",\n")
);

lines.push("on conflict (id) do update set");
lines.push(
  "  search_key = excluded.search_key, name = excluded.name, employment_type = excluded.employment_type, reports_to_id = excluded.reports_to_id, employment_status = excluded.employment_status, picture_url = excluded.picture_url, updated_by = excluded.updated_by;"
);
lines.push("");

function insertChildTable(table, columns, rows, mapRow, onConflict) {
  if (!rows.length) return;
  lines.push(`insert into public.${table} (`);
  lines.push(`  ${columns.join(", ")}`);
  lines.push(")");
  lines.push("values");
  lines.push(rows.map(mapRow).join(",\n"));
  lines.push("on conflict (id) do update set");
  lines.push(`  ${onConflict};`);
  lines.push("");
}

const allLocations = initialEmployees.flatMap((e) => (e.locations ?? []).map((l) => ({ ...l, employeeId: e.id })));
insertChildTable(
  "employee_location",
  ["id", "employee_id", "line_no", "name", "address_type", "address1", "address2", "address3", "city", "state", "postcode", "country", "phone", "mobile", "email", "primary_address", "active", "valid_from", "valid_to", "access_notes", "description"],
  allLocations,
  (l) =>
    `  (${sqlString(l.id)}, ${sqlString(l.employeeId)}, ${l.lineNo}, ${sqlString(l.name)}, ${sqlString(l.addressType)}, ${sqlString(l.address1)}, ${sqlString(l.address2)}, ${sqlString(l.address3)}, ${sqlString(l.city)}, ${sqlString(l.state)}, ${sqlString(l.postcode)}, ${sqlString(l.country)}, ${sqlString(l.phone)}, ${sqlString(l.mobile)}, ${sqlString(l.email)}, ${sqlString(l.primaryAddress)}, ${sqlString(l.active)}, ${sqlDate(l.validFrom)}, ${sqlDate(l.validTo)}, ${sqlString(l.accessNotes)}, ${sqlString(l.description)})`,
  "name = excluded.name, primary_address = excluded.primary_address"
);

const allEc = initialEmployees.flatMap((e) => (e.emergencyContacts ?? []).map((c) => ({ ...c, employeeId: e.id })));
insertChildTable(
  "employee_emergency_contact",
  ["id", "employee_id", "line_no", "contact_type", "name", "relationship", "phone", "mobile", "email", "call_order", "primary_contact", "notes"],
  allEc,
  (c) =>
    `  (${sqlString(c.id)}, ${sqlString(c.employeeId)}, ${c.lineNo}, ${sqlString(c.contactType)}, ${sqlString(c.name)}, ${sqlString(c.relationship)}, ${sqlString(c.phone)}, ${sqlString(c.mobile)}, ${sqlString(c.email)}, ${c.callOrder}, ${sqlString(c.primaryContact)}, ${sqlString(c.notes)})`,
  "name = excluded.name, primary_contact = excluded.primary_contact"
);

const allAlerts = initialEmployees.flatMap((e) => (e.alerts ?? []).map((a) => ({ ...a, employeeId: e.id })));
insertChildTable(
  "employee_alert",
  ["id", "employee_id", "line_no", "alert_type", "show_as_alert", "name", "description", "valid_from", "valid_to", "source"],
  allAlerts,
  (a) =>
    `  (${sqlString(a.id)}, ${sqlString(a.employeeId)}, ${a.lineNo}, ${sqlString(a.alertType)}, ${sqlString(a.showAsAlert)}, ${sqlString(a.name)}, ${sqlString(a.description)}, ${sqlDate(a.validFrom)}, ${sqlDate(a.validTo)}, ${sqlString(a.source)})`,
  "name = excluded.name, description = excluded.description"
);

const allSkills = initialEmployees.flatMap((e) => (e.skills ?? []).map((s) => ({ ...s, employeeId: e.id })));
insertChildTable(
  "employee_skill",
  ["id", "employee_id", "line_no", "skill_type", "name", "proficiency", "notes"],
  allSkills,
  (s) =>
    `  (${sqlString(s.id)}, ${sqlString(s.employeeId)}, ${s.lineNo}, ${sqlString(s.skillType)}, ${sqlString(s.name)}, ${sqlString(s.proficiency)}, ${sqlString(s.notes)})`,
  "name = excluded.name, proficiency = excluded.proficiency"
);

const allDocs = initialEmployees.flatMap((e) => (e.documents ?? []).map((d) => ({ ...d, employeeId: e.id })));
insertChildTable(
  "employee_document",
  ["id", "employee_id", "line_no", "document_type", "name", "document_ref", "issue_date", "expiry_date", "status", "notes"],
  allDocs,
  (d) =>
    `  (${sqlString(d.id)}, ${sqlString(d.employeeId)}, ${d.lineNo}, ${sqlString(d.documentType)}, ${sqlString(d.name)}, ${sqlString(d.documentRef)}, ${sqlDate(d.issueDate)}, ${sqlDate(d.expiryDate)}, ${sqlString(d.status)}, ${sqlString(d.notes)})`,
  "name = excluded.name, document_ref = excluded.document_ref"
);

const allActs = initialEmployees.flatMap((e) => (e.activities ?? []).map((a) => ({ ...a, employeeId: e.id })));
insertChildTable(
  "employee_activity",
  ["id", "employee_id", "line_no", "activity_date", "activity_type", "subject", "description", "created_by"],
  allActs,
  (a) =>
    `  (${sqlString(a.id)}, ${sqlString(a.employeeId)}, ${a.lineNo}, ${sqlDate(a.date)}, ${sqlString(a.activityType)}, ${sqlString(a.subject)}, ${sqlString(a.description)}, ${sqlString(a.createdBy)})`,
  "subject = excluded.subject, description = excluded.description"
);

const allLeave = initialEmployees.flatMap((e) => (e.leaveEntitlements ?? []).map((l) => ({ ...l, employeeId: e.id })));
insertChildTable(
  "employee_leave_entitlement",
  ["id", "employee_id", "line_no", "leave_type", "entitlement_days", "balance_days", "accrual_notes"],
  allLeave,
  (l) =>
    `  (${sqlString(l.id)}, ${sqlString(l.employeeId)}, ${l.lineNo}, ${sqlString(l.leaveType)}, ${l.entitlementDays}, ${l.balanceDays}, ${sqlString(l.accrualNotes)})`,
  "balance_days = excluded.balance_days"
);

const allCredentials = initialEmployees.flatMap((e) => (e.credentials ?? []).map((c) => ({ ...c, employeeId: e.id })));
insertChildTable(
  "employee_credential",
  ["id", "employee_id", "line_no", "credential_type", "credential_number", "issuing_body", "issue_date", "expiry_date", "status", "document_ref", "notes", "created_by", "updated_by"],
  allCredentials,
  (c) =>
    `  (${sqlString(c.id)}, ${sqlString(c.employeeId)}, ${c.lineNo}, ${sqlString(c.credentialType)}, ${sqlString(c.credentialNumber)}, ${sqlString(c.issuingBody)}, ${sqlDate(c.issueDate)}, ${sqlDate(c.expiryDate)}, ${sqlString(c.status)}, ${sqlString(c.documentRef)}, ${sqlString(c.notes)}, ${sqlString(c.createdBy)}, ${sqlString(c.updatedBy)})`,
  "credential_type = excluded.credential_type, expiry_date = excluded.expiry_date, status = excluded.status"
);

writeFileSync(join(root, "supabase", "seed-employees.sql"), lines.join("\n"), "utf8");
console.log("Wrote supabase/seed-employees.sql");
