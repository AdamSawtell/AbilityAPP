import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "web", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error("SUPABASE_DB_URL missing");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const sql = readFileSync(join(root, "supabase/migrations/20260622120000_ai_draft.sql"), "utf8");
  await client.query(sql);
  const { rows } = await client.query("SELECT to_regclass('public.ai_draft') AS t");
  console.log("ai_draft:", rows[0].t ? "ok" : "missing");
} finally {
  await client.end();
}
