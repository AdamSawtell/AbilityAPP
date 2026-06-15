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

const lines = [
  "-- Employee seed",
  "-- Re-run: npm run supabase:seed-employees",
  "",
  "insert into public.employee (",
  "  id, search_key, business_partner_group, name, first_name, last_name,",
  "  preferred_name, middle_name, email, phone, mobile, job_title, department,",
  "  employment_status, start_date, end_date, created_by, updated_by",
  ")",
  "values",
];

lines.push(
  initialEmployees
    .map(
      (e) =>
        `  (${sqlString(e.id)}, ${sqlString(e.searchKey)}, ${sqlString(e.businessPartnerGroup)}, ${sqlString(e.name)}, ${sqlString(e.firstName)}, ${sqlString(e.lastName)}, ${sqlString(e.preferredName)}, ${sqlString(e.middleName)}, ${sqlString(e.email)}, ${sqlString(e.phone)}, ${sqlString(e.mobile)}, ${sqlString(e.jobTitle)}, ${sqlString(e.department)}, ${sqlString(e.employmentStatus)}, ${sqlDate(e.startDate)}, ${sqlDate(e.endDate)}, ${sqlString(e.createdBy)}, ${sqlString(e.updatedBy)})`
    )
    .join(",\n")
);

lines.push("on conflict (id) do update set");
lines.push(
  "  search_key = excluded.search_key, name = excluded.name, first_name = excluded.first_name, last_name = excluded.last_name, email = excluded.email, job_title = excluded.job_title, department = excluded.department, employment_status = excluded.employment_status, updated_by = excluded.updated_by;"
);
lines.push("");

const allCredentials = initialEmployees.flatMap((e) =>
  (e.credentials ?? []).map((c) => ({ ...c, employeeId: e.id }))
);

if (allCredentials.length) {
  lines.push("insert into public.employee_credential (");
  lines.push(
    "  id, employee_id, line_no, credential_type, credential_number, issuing_body, issue_date, expiry_date, status, document_ref, notes, created_by, updated_by"
  );
  lines.push(")");
  lines.push("values");
  lines.push(
    allCredentials
      .map(
        (c) =>
          `  (${sqlString(c.id)}, ${sqlString(c.employeeId)}, ${c.lineNo}, ${sqlString(c.credentialType)}, ${sqlString(c.credentialNumber)}, ${sqlString(c.issuingBody)}, ${sqlDate(c.issueDate)}, ${sqlDate(c.expiryDate)}, ${sqlString(c.status)}, ${sqlString(c.documentRef)}, ${sqlString(c.notes)}, ${sqlString(c.createdBy)}, ${sqlString(c.updatedBy)})`
      )
      .join(",\n")
  );
  lines.push("on conflict (id) do update set");
  lines.push(
    "  credential_type = excluded.credential_type, credential_number = excluded.credential_number, expiry_date = excluded.expiry_date, status = excluded.status, updated_by = excluded.updated_by;"
  );
}

writeFileSync(join(root, "supabase", "seed-employees.sql"), lines.join("\n"), "utf8");
console.log("Wrote supabase/seed-employees.sql");
