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
  "-- Users, roles, and access seed",
  "-- Re-run: npm run supabase:seed-access",
  "",
];

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

const userRoles = SEED_USERS.flatMap((u) => u.roleIds.map((role_id) => ({ user_id: u.id, role_id })));
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
lines.push("delete from public.app_role_window where role_id in (" + SEED_ROLES.map((r) => sqlString(r.id)).join(", ") + ");");
if (roleWindows.length) {
  lines.push("insert into public.app_role_window (role_id, window_key, access_level)");
  lines.push("values");
  lines.push(
    roleWindows
      .map((r) => `  (${sqlString(r.role_id)}, ${sqlString(r.window_key)}, ${sqlString(r.access_level)})`)
      .join(",\n")
  );
  lines.push("on conflict (role_id, window_key) do update set access_level = excluded.access_level;");
}
lines.push("");

const roleProcesses = SEED_ROLES.flatMap((r) => r.processIds.map((process_id) => ({ role_id: r.id, process_id })));
lines.push("delete from public.app_role_process where role_id in (" + SEED_ROLES.map((r) => sqlString(r.id)).join(", ") + ");");
if (roleProcesses.length) {
  lines.push("insert into public.app_role_process (role_id, process_id)");
  lines.push("values");
  lines.push(roleProcesses.map((r) => `  (${sqlString(r.role_id)}, ${sqlString(r.process_id)})`).join(",\n"));
  lines.push("on conflict do nothing;");
}
lines.push("");

const roleReports = SEED_ROLES.flatMap((r) => (r.reportIds ?? []).map((report_id) => ({ role_id: r.id, report_id })));
lines.push("delete from public.app_role_report where role_id in (" + SEED_ROLES.map((r) => sqlString(r.id)).join(", ") + ");");
if (roleReports.length) {
  lines.push("insert into public.app_role_report (role_id, report_id)");
  lines.push("values");
  lines.push(roleReports.map((r) => `  (${sqlString(r.role_id)}, ${sqlString(r.report_id)})`).join(",\n"));
  lines.push("on conflict do nothing;");
}
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
lines.push("delete from public.app_role_task_type where role_id in (" + SEED_ROLES.map((r) => sqlString(r.id)).join(", ") + ");");
if (roleTaskTypes.length) {
  lines.push("insert into public.app_role_task_type (role_id, task_type_id, can_see, can_select, can_create)");
  lines.push("values");
  lines.push(
    roleTaskTypes
      .map(
        (r) =>
          `  (${sqlString(r.role_id)}, ${sqlString(r.task_type_id)}, ${r.can_see}, ${r.can_select}, ${r.can_create})`
      )
      .join(",\n")
  );
  lines.push("on conflict (role_id, task_type_id) do update set");
  lines.push("  can_see = excluded.can_see, can_select = excluded.can_select, can_create = excluded.can_create;");
}
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
