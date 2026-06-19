import pg from "pg";
import { readFileSync } from "fs";

const env = readFileSync("web/.env.local", "utf8");
const m = env.match(/SUPABASE_DB_URL=(.+)/);
const client = new pg.Client({ connectionString: m[1].trim() });
await client.connect();

const queries = [
  ["total clients", "select count(*)::int as c from client"],
  ["bulk clients", "select count(*)::int as c from client where id like 'bp-bulk-%'"],
  ["employees", "select count(*)::int as c from employee"],
  ["tasks", "select count(*)::int as c from app_task"],
  ["bulk incidents", "select count(*)::int as c from incident where id like 'inc-bulk-%'"],
  ["ai_draft", "select count(*)::int as c from ai_draft"],
];

for (const [label, sql] of queries) {
  const { rows } = await client.query(sql);
  console.log(`${label}: ${rows[0].c}`);
}

await client.end();
