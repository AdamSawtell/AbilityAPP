/**
 * Generates supabase/seed-locations.sql from location.ts seed data.
 * Run: npm run supabase:seed-locations
 *
 * ADDITIVE: upserts demo rows by id only — never deletes user-added location links.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { initialLocations } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "location.ts")).href
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
  "-- Support location seed (generated, ADDITIVE)",
  "-- Re-run: npm run supabase:seed-locations",
  "-- Upserts demo rows by id; user-added staff/client links are preserved.",
  "",
  "insert into public.support_location (",
  "  id, search_key, name, description, location_type, status,",
  "  address1, address2, city, state, postcode, country,",
  "  phone, email, access_notes, picture_url, capacity, valid_from, created_by, updated_by",
  ")",
  "values",
  initialLocations
    .map(
      (l) =>
        `  (${sqlString(l.id)}, ${sqlString(l.searchKey)}, ${sqlString(l.name)}, ${sqlString(l.description)}, ${sqlString(l.locationType)}, ${sqlString(l.status)}, ${sqlString(l.address1)}, ${sqlString(l.address2)}, ${sqlString(l.city)}, ${sqlString(l.state)}, ${sqlString(l.postcode)}, ${sqlString(l.country)}, ${sqlString(l.phone)}, ${sqlString(l.email)}, ${sqlString(l.accessNotes)}, ${sqlString(l.pictureUrl)}, ${sqlNum(l.capacity)}, ${sqlDate(l.validFrom)}, ${sqlString(l.createdBy)}, ${sqlString(l.updatedBy)})`
    )
    .join(",\n"),
  "on conflict (id) do update set",
  "  search_key = excluded.search_key, name = excluded.name, description = excluded.description,",
  "  location_type = excluded.location_type, status = excluded.status,",
  "  address1 = excluded.address1, address2 = excluded.address2, city = excluded.city,",
  "  state = excluded.state, postcode = excluded.postcode, country = excluded.country,",
  "  phone = excluded.phone, email = excluded.email, access_notes = excluded.access_notes,",
  "  picture_url = excluded.picture_url, capacity = excluded.capacity, valid_from = excluded.valid_from,",
  "  updated_by = excluded.updated_by;",
  "",
];

function upsertInsert(table, rows, columns, mapRow, updateSet) {
  if (!rows.length) {
    lines.push(`-- ${table}: no demo rows in seed source`);
    lines.push("");
    return;
  }
  lines.push(`insert into public.${table} (${columns.join(", ")})`);
  lines.push("values");
  lines.push(rows.map(mapRow).join(",\n"));
  lines.push(`on conflict (id) do update set ${updateSet};`);
  lines.push("");
}

const allAlerts = initialLocations.flatMap((l) => (l.alerts ?? []).map((a) => ({ ...a, locationId: l.id })));
upsertInsert(
  "support_location_alert",
  allAlerts,
  ["id", "location_id", "line_no", "alert_type", "show_as_alert", "name", "description", "valid_from"],
  (a) =>
    `  (${sqlString(a.id)}, ${sqlString(a.locationId)}, ${a.lineNo}, ${sqlString(a.alertType)}, ${sqlString(a.showAsAlert)}, ${sqlString(a.name)}, ${sqlString(a.description)}, ${sqlDate(a.validFrom)})`,
  "location_id = excluded.location_id, line_no = excluded.line_no, alert_type = excluded.alert_type, show_as_alert = excluded.show_as_alert, name = excluded.name, description = excluded.description, valid_from = excluded.valid_from"
);

const allClients = initialLocations.flatMap((l) => (l.clientLinks ?? []).map((c) => ({ ...c, locationId: l.id })));
upsertInsert(
  "support_location_client",
  allClients,
  ["id", "location_id", "line_no", "client_id", "assignment_role", "primary_assignment", "valid_from", "notes"],
  (c) =>
    `  (${sqlString(c.id)}, ${sqlString(c.locationId)}, ${c.lineNo}, ${sqlString(c.clientId)}, ${sqlString(c.assignmentRole)}, ${sqlString(c.primaryAssignment)}, ${sqlDate(c.validFrom)}, ${sqlString(c.notes)})`,
  "location_id = excluded.location_id, line_no = excluded.line_no, client_id = excluded.client_id, assignment_role = excluded.assignment_role, primary_assignment = excluded.primary_assignment, valid_from = excluded.valid_from, notes = excluded.notes"
);

const allEmployees = initialLocations.flatMap((l) => (l.employeeLinks ?? []).map((e) => ({ ...e, locationId: l.id })));
upsertInsert(
  "support_location_employee",
  allEmployees,
  ["id", "location_id", "line_no", "employee_id", "assignment_role", "primary_assignment", "valid_from", "notes"],
  (e) =>
    `  (${sqlString(e.id)}, ${sqlString(e.locationId)}, ${e.lineNo}, ${sqlString(e.employeeId)}, ${sqlString(e.assignmentRole)}, ${sqlString(e.primaryAssignment)}, ${sqlDate(e.validFrom)}, ${sqlString(e.notes)})`,
  "location_id = excluded.location_id, line_no = excluded.line_no, employee_id = excluded.employee_id, assignment_role = excluded.assignment_role, primary_assignment = excluded.primary_assignment, valid_from = excluded.valid_from, notes = excluded.notes"
);

const allActivities = initialLocations.flatMap((l) => (l.activities ?? []).map((a) => ({ ...a, locationId: l.id })));
upsertInsert(
  "support_location_activity",
  allActivities,
  ["id", "location_id", "line_no", "activity_date", "activity_type", "subject", "description", "created_by"],
  (a) =>
    `  (${sqlString(a.id)}, ${sqlString(a.locationId)}, ${a.lineNo}, ${sqlDate(a.date)}, ${sqlString(a.activityType)}, ${sqlString(a.subject)}, ${sqlString(a.description)}, ${sqlString(a.createdBy)})`,
  "location_id = excluded.location_id, line_no = excluded.line_no, activity_date = excluded.activity_date, activity_type = excluded.activity_type, subject = excluded.subject, description = excluded.description, created_by = excluded.created_by"
);

const allProducts = initialLocations.flatMap((l) => (l.productLinks ?? []).map((p) => ({ ...p, locationId: l.id })));
upsertInsert(
  "support_location_product",
  allProducts,
  ["id", "location_id", "line_no", "product_id", "active", "valid_from", "notes"],
  (p) =>
    `  (${sqlString(p.id)}, ${sqlString(p.locationId)}, ${p.lineNo}, ${sqlString(p.productId)}, ${sqlString(p.active)}, ${sqlDate(p.validFrom)}, ${sqlString(p.notes)})`,
  "location_id = excluded.location_id, line_no = excluded.line_no, product_id = excluded.product_id, active = excluded.active, valid_from = excluded.valid_from, notes = excluded.notes"
);

writeFileSync(join(root, "supabase", "seed-locations.sql"), lines.join("\n"), "utf8");
console.log(`Wrote supabase/seed-locations.sql (${initialLocations.length} locations, additive)`);
