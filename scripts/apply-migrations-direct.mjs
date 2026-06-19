/** Apply migration SQL files directly (bypasses duplicate version conflicts in schema_migrations). */
import pg from "pg";
import { readFileSync, existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "web", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  const key = t.slice(0, eq).trim();
  if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim();
}

const url = process.env.SUPABASE_DB_URL;
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const migrationsDir = join(root, "supabase/migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  process.stdout.write(`→ ${file} … `);
  try {
    await client.query(sql);
    console.log("ok");
  } catch (err) {
    console.log("skip/error:", err.message?.slice(0, 120));
  }
}

const checks = ["service_booking", "ai_draft"];
for (const t of checks) {
  const { rows } = await client.query("SELECT to_regclass($1) AS r", [`public.${t}`]);
  console.log(`${t}:`, rows[0].r ? "present" : "missing");
}

await client.end();
