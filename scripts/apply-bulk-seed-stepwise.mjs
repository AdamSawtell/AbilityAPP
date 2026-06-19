import pg from "pg";
import { readFileSync } from "fs";

const env = readFileSync("web/.env.local", "utf8");
const url = env.match(/^SUPABASE_DB_URL=(.+)$/m)[1].trim();
const sql = readFileSync("supabase/seed-clients-bulk.sql", "utf8");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const parts = sql.split(/(?=insert into public\.)/i);
for (const part of parts) {
  const trimmed = part.trim();
  if (!trimmed.startsWith("insert")) continue;
  const table = trimmed.match(/insert into public\.(\w+)/i)?.[1];
  try {
    await client.query(trimmed);
    console.log("ok", table);
  } catch (err) {
    console.error("FAIL", table, err.message);
    break;
  }
}

await client.end();
