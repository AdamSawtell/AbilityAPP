/**
 * Record migrations already applied to the remote DB (e.g. via apply-migrations-direct.mjs)
 * so `supabase db push` stays in sync. Safe to re-run — skips versions already present.
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "web", ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing web/.env.local");
  process.exit(1);
}
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  const key = t.slice(0, eq).trim();
  if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim();
}

const url = process.env.SUPABASE_DB_URL?.trim();
if (!url) {
  console.error("Set SUPABASE_DB_URL in web/.env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

/** version → async check that migration effects exist */
const pending = [
  {
    version: "20260619120500",
    label: "workforce_review_access_fix",
    check: async () => {
      const { rows } = await client.query(
        `select 1 from public.app_role_process
         where role_id = 'role-ceo' and process_id = 'review-employee-credential' limit 1`
      );
      return rows.length > 0;
    },
  },
  {
    version: "20260620140500",
    label: "service_booking_abilityerp_parity",
    check: async () => {
      const { rows } = await client.query(
        `select column_name from information_schema.columns
         where table_schema = 'public' and table_name = 'service_booking'
           and column_name = 'target_document_type'`
      );
      return rows.length > 0;
    },
  },
  {
    version: "20260622120000",
    label: "ai_draft",
    check: async () => {
      const { rows } = await client.query(
        "select to_regclass('public.ai_draft') as r"
      );
      return Boolean(rows[0]?.r);
    },
  },
];

for (const m of pending) {
  const { rows: existing } = await client.query(
    "select 1 from supabase_migrations.schema_migrations where version = $1",
    [m.version]
  );
  if (existing.length) {
    console.log(`skip ${m.version} (${m.label}) — already recorded`);
    continue;
  }
  const ok = await m.check();
  if (!ok) {
    console.warn(`skip ${m.version} (${m.label}) — effects not found; run migration SQL first`);
    continue;
  }
  await client.query(
    "insert into supabase_migrations.schema_migrations (version) values ($1)",
    [m.version]
  );
  console.log(`recorded ${m.version} (${m.label})`);
}

await client.end();
console.log("Migration history repair complete.");
