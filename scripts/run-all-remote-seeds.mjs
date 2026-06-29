/**
 * One-off demo / dummy data load for remote Supabase (Postgres).
 * Data persists until you delete rows or re-run a seed that targets those ids.
 *
 * Requires SUPABASE_DB_URL in web/.env.local or the environment.
 *
 * Usage:
 *   npm run supabase:seed-demo-once -- supabase/seed-clients-bulk.sql   (single file — recommended)
 *   npm run supabase:seed-demo-once -- --file supabase/seed-clients-bulk.sql
 *   npm run supabase:seed-demo-once -- --all                            (FULL destructive manifest)
 *
 * SAFETY: running with no target now ERRORS instead of silently applying the
 * entire manifest. The full manifest is destructive (it deletes + reinserts
 * support_location_employee and all role grants), so it must be opted into with
 * --all. Any argument ending in .sql is treated as a target file, so the npm
 * "--file" flag being stripped can no longer trigger an accidental full reseed.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { REMOTE_SEED_FILES } from "./seed-manifest.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const envPath = join(root, "web", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function resolveDbUrl() {
  if (process.env.SUPABASE_DB_URL?.trim()) return process.env.SUPABASE_DB_URL.trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = process.env.SUPABASE_PROJECT_REF?.trim() || "yonkaaylolrdsjfgpvyp";
  if (!password) return null;
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`;
}

async function ensurePg() {
  try {
    return await import("pg");
  } catch {
    console.log("Installing pg for SQL seed runner…");
    const install = spawnSync("npm", ["install", "pg", "--no-save"], { cwd: root, stdio: "inherit", shell: true });
    if (install.status !== 0) throw new Error("Failed to install pg");
    return import("pg");
  }
}

async function runWithPg(dbUrl, sqlPath) {
  const pg = await ensurePg();
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const sql = readFileSync(sqlPath, "utf8");
    await client.query(sql);
  } finally {
    await client.end();
  }
}

function runWithSupabaseCli(flag, sqlPath) {
  const args = ["supabase", "db", "query", flag, "-f", sqlPath];
  const result = spawnSync("npx", args, { cwd: root, stdio: "inherit", shell: true });
  return result.status === 0;
}

async function main() {
  loadEnvLocal();

  const argv = process.argv.slice(2);
  const wantsAll = argv.includes("--all");

  // Collect explicit targets: anything ending in .sql (covers both the
  // "--file X.sql" form, where npm may strip "--file", and bare positional X.sql).
  const explicitFiles = argv.filter((a) => a.toLowerCase().endsWith(".sql"));

  let files;
  if (explicitFiles.length) {
    files = explicitFiles;
  } else if (wantsAll) {
    files = REMOTE_SEED_FILES;
  } else {
    console.error(`
Refusing to run the FULL seed manifest without an explicit target.

The full manifest is destructive — it deletes and reinserts support_location_employee
(employee↔location links) and every role's window/process/report/task grants.

Run one of:
  node scripts/run-all-remote-seeds.mjs supabase/seed-ai.sql   # single file (recommended)
  node scripts/run-all-remote-seeds.mjs --all                  # full manifest (destructive)
`);
    process.exit(1);
  }

  const dbUrl = resolveDbUrl();

  if (!dbUrl) {
    console.error(`
Could not connect to Supabase Postgres.

Add to web/.env.local (never commit this file):

  SUPABASE_DB_URL=postgresql://postgres.yonkaaylolrdsjfgpvyp:YOUR_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

Copy from Supabase → Database → Connect → Session pooler (port 5432).
Also add the same value as GitHub secret SUPABASE_DB_URL for Actions → Supabase seed demo data.
`);
    process.exit(1);
  }

  console.log("Using SUPABASE_DB_URL.");

  for (const file of files) {
    const sqlPath = join(root, file);
    if (!existsSync(sqlPath)) {
      console.error(`Missing seed file: ${file}`);
      process.exit(1);
    }
    console.log(`\n→ ${file}`);
    try {
      await runWithPg(dbUrl, sqlPath);
    } catch (err) {
      console.error(`Failed: ${file}`, err);
      process.exit(1);
    }
  }

  console.log("\nAll seeds applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
