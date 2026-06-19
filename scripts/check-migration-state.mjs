import pg from "pg";
import { readFileSync } from "fs";

const env = readFileSync("web/.env.local", "utf8");
const m = env.match(/SUPABASE_DB_URL=(.+)/);
const client = new pg.Client({ connectionString: m[1].trim() });
await client.connect();

const { rows } = await client.query(
  "select version from supabase_migrations.schema_migrations order by version"
);
console.log("Applied migrations:", rows.length);
for (const r of rows) console.log(" ", r.version);

const audits = [
  ["user_session", "select count(*)::int as c from user_session"],
  ["user_session demo", "select count(*)::int as c from user_session where id like 'us-demo-%'"],
  ["process_audit", "select count(*)::int as c from process_audit"],
  ["ai_query_audit_meta", "select count(*)::int as c from ai_query_audit_meta"],
];

console.log("\nAudit tables:");
for (const [label, sql] of audits) {
  try {
    const { rows: r } = await client.query(sql);
    console.log(`  ${label}: ${r[0].c}`);
  } catch (e) {
    console.log(`  ${label}: ERROR ${e.message}`);
  }
}

await client.end();
