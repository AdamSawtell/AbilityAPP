/**
 * Generates supabase/seed-access.sql
 * Run: cd web && npx tsx ../scripts/generate-access-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "web", "package.json"));
const bcrypt = require("bcryptjs");

const { SEED_USERS, SEED_ROLES } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "access", "seed.ts")).href
);
const { SEED_LOGIN_PASSWORDS } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "auth", "passwords.server.ts")).href
);

function sqlString(value) {
  if (value === null || value === undefined) return "''";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const lines = [
  "-- Users, roles, and access seed (BOOTSTRAP-ONLY — never reverts UI role config)",
  "-- Re-run: npm run supabase:seed-access",
  "--",
  "-- Role grant tables (app_role_window / _process / _report / _task_type) are seeded",
  "-- ONLY for roles that currently have no rows in that table. Once a role has any",
  "-- grant — including edits made in the Roles admin UI — the seed skips it entirely,",
  "-- so re-running this file can never revert a configured role (e.g. Support Worker)",
  "-- back to the seed default. Grant NEW feature windows to existing roles via a",
  "-- migration, not by re-running this seed.",
  "",
];

// Emit a per-role bootstrap-only grant insert: rows are only applied for roles that
// have NO existing rows in the target table, so UI-managed role config is preserved
// across seed re-runs. `valueRows` are pre-rendered `(...)` tuples.
function pushBootstrapInsert(table, columns, valueRows, conflictTarget) {
  if (!valueRows.length) return;
  const colList = columns.join(", ");
  const selectList = columns.map((c) => `v.${c}`).join(", ");
  lines.push(`insert into public.${table} (${colList})`);
  lines.push(`select ${selectList}`);
  lines.push("from (values");
  lines.push(valueRows.join(",\n"));
  lines.push(`) as v(${colList})`);
  lines.push("-- Bootstrap only: skip roles that already have grants (preserve UI config).");
  lines.push("where not exists (");
  lines.push(`  select 1 from public.${table} existing where existing.role_id = v.role_id`);
  lines.push(")");
  lines.push(`on conflict ${conflictTarget} do nothing;`);
}

lines.push("insert into public.app_role (id, role_key, name, description, active)");
lines.push("values");
lines.push(
  SEED_ROLES.map(
    (r) =>
      `  (${sqlString(r.id)}, ${sqlString(r.roleKey)}, ${sqlString(r.name)}, ${sqlString(r.description)}, ${r.active})`
  ).join(",\n")
);
lines.push("on conflict (id) do update set");
lines.push("  role_key = excluded.role_key, name = excluded.name, description = excluded.description, active = excluded.active;");
lines.push("");

lines.push("insert into public.app_user (id, username, email, first_name, last_name, phone, active, employee_bp_id, notes)");
lines.push("values");
lines.push(
  SEED_USERS.map(
    (u) =>
      `  (${sqlString(u.id)}, ${sqlString(u.username)}, ${sqlString(u.email)}, ${sqlString(u.firstName)}, ${sqlString(u.lastName)}, ${sqlString(u.phone)}, ${u.active}, ${u.employeeBpId ? sqlString(u.employeeBpId) : "null"}, ${sqlString(u.notes)})`
  ).join(",\n")
);
lines.push("on conflict (id) do update set");
lines.push(
  "  username = excluded.username, email = excluded.email, first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone, active = excluded.active, employee_bp_id = excluded.employee_bp_id, notes = excluded.notes;"
);
lines.push("");

const userRoles = SEED_USERS.flatMap((u) => {
  const roleIds =
    u.id === "user-superuser" ? SEED_ROLES.filter((r) => r.active).map((r) => r.id) : u.roleIds;
  return roleIds.map((role_id) => ({ user_id: u.id, role_id }));
});
lines.push("insert into public.app_user_role (user_id, role_id)");
lines.push("values");
lines.push(userRoles.map((r) => `  (${sqlString(r.user_id)}, ${sqlString(r.role_id)})`).join(",\n"));
lines.push("on conflict do nothing;");
lines.push("");

const roleWindows = SEED_ROLES.flatMap((r) =>
  Object.entries(r.windowAccess).map(([window_key, access_level]) => ({
    role_id: r.id,
    window_key,
    access_level,
  }))
);
pushBootstrapInsert(
  "app_role_window",
  ["role_id", "window_key", "access_level"],
  roleWindows.map(
    (r) => `  (${sqlString(r.role_id)}, ${sqlString(r.window_key)}, ${sqlString(r.access_level)})`
  ),
  "(role_id, window_key)"
);
lines.push("");

const roleProcesses = SEED_ROLES.flatMap((r) => r.processIds.map((process_id) => ({ role_id: r.id, process_id })));
pushBootstrapInsert(
  "app_role_process",
  ["role_id", "process_id"],
  roleProcesses.map((r) => `  (${sqlString(r.role_id)}, ${sqlString(r.process_id)})`),
  ""
);
lines.push("");

const roleReports = SEED_ROLES.flatMap((r) => (r.reportIds ?? []).map((report_id) => ({ role_id: r.id, report_id })));
pushBootstrapInsert(
  "app_role_report",
  ["role_id", "report_id"],
  roleReports.map((r) => `  (${sqlString(r.role_id)}, ${sqlString(r.report_id)})`),
  ""
);
lines.push("");

const roleTaskTypes = SEED_ROLES.flatMap((r) =>
  (r.taskTypePermissions ?? []).map((p) => ({
    role_id: r.id,
    task_type_id: p.taskTypeId,
    can_see: p.canSee,
    can_select: p.canSelect,
    can_create: p.canCreate,
  }))
);
pushBootstrapInsert(
  "app_role_task_type",
  ["role_id", "task_type_id", "can_see", "can_select", "can_create"],
  roleTaskTypes.map(
    (r) =>
      `  (${sqlString(r.role_id)}, ${sqlString(r.task_type_id)}, ${r.can_see}, ${r.can_select}, ${r.can_create})`
  ),
  "(role_id, task_type_id)"
);
lines.push("");

lines.push("-- Bcrypt passwords for seed logins (default password: welcome; SuperUser: flamingo)");
for (const user of SEED_USERS) {
  const plain = SEED_LOGIN_PASSWORDS[user.username] ?? "welcome";
  const hash = bcrypt.hashSync(plain, 10);
  lines.push(
    `update public.app_user set password = ${sqlString(hash)} where username = ${sqlString(user.username)};`
  );
}

writeFileSync(join(root, "supabase", "seed-access.sql"), lines.join("\n"), "utf8");
console.log("Wrote supabase/seed-access.sql");
