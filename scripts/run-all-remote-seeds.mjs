/**
 * One-off demo / dummy data load for remote Supabase (Postgres).
 * Data persists until you delete rows or re-run a seed that targets those ids.
 *
 * Requires SUPABASE_DB_URL in web/.env.local or the environment.
 *
 * Usage:
 *   npm run supabase:seed-demo-once
 *   npm run supabase:seed-demo-once -- --file supabase/seed-clients-bulk.sql
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

  const fileArg = process.argv.indexOf("--file");
  const files =
    fileArg >= 0 && process.argv[fileArg + 1]
      ? [process.argv[fileArg + 1]]
      : REMOTE_SEED_FILES;

  const dbUrl = resolveDbUrl();

  if (!dbUrl) {
    console.error(`
Could not connect to Supabase Postgres.

Add to web/.env.local (never commit this file):

  SUPABASE_DB_URL=postgresql://postgres.yonkaaylolrdsjfgpvyp:YOUR_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

Copy from Supabase → Database → Connect → Session pooler (port 5432).
Also add the same value as GitHub secret SUPABASE_DB_URL so CI applies seeds on push.
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
