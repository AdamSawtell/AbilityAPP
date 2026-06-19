/**
 * One-off remote setup: push pending migrations, then load demo data once.
 * After this, data stays in Postgres until you delete it or run a specific seed again.
 *
 * Usage:
 *   npm run supabase:setup-remote
 *
 * Migrations only (no seeds):
 *   npm run supabase:push-remote
 *
 * Seeds only (one-off):
 *   npm run supabase:seed-demo-once
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

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

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function pushMigrations() {
  loadEnvLocal();
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();
  const ref = process.env.SUPABASE_PROJECT_REF?.trim() || "yonkaaylolrdsjfgpvyp";

  if (dbUrl) {
    run("npx", ["supabase", "db", "push", "--yes", "--db-url", dbUrl]);
  } else if (process.env.SUPABASE_DB_PASSWORD?.trim()) {
    run("npx", ["supabase", "link", "--project-ref", ref, "--password", process.env.SUPABASE_DB_PASSWORD.trim(), "--yes"]);
    run("npx", ["supabase", "db", "push", "--yes"]);
  } else {
    console.error("Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in web/.env.local.");
    process.exit(1);
  }
}

const mode = process.argv[2] ?? "all";

if (mode === "push" || mode === "all") {
  pushMigrations();
}

if (mode === "seed" || mode === "all") {
  run("node", ["scripts/run-all-remote-seeds.mjs", ...process.argv.slice(3)]);
}
