/** Apply one migration file if not already recorded in schema_migrations. */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2];
if (!file?.endsWith(".sql")) {
  console.error("Usage: node scripts/apply-single-migration.mjs supabase/migrations/20260626200000_document_email_templates.sql");
  process.exit(1);
}

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

const version = file.replace(/^.*[\\/]/, "").replace(/_.*$/, "");
const name = file.replace(/^.*[\\/]/, "").replace(/\.sql$/, "").replace(/^\d+_/, "");
const sql = readFileSync(join(root, file), "utf8");

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows: existing } = await client.query(
  "select 1 from supabase_migrations.schema_migrations where version = $1",
  [version]
);
if (existing.length) {
  console.log(`skip ${version} — already recorded`);
  await client.end();
  process.exit(0);
}

console.log(`→ ${file} …`);
await client.query("begin");
try {
  await client.query(sql);
  await client.query(
    "insert into supabase_migrations.schema_migrations(version, name) values ($1, $2)",
    [version, name]
  );
  await client.query("commit");
  console.log("ok");
} catch (err) {
  await client.query("rollback");
  console.error("failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
