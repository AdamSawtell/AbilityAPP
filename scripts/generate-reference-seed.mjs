/**
 * Generates supabase/seed.sql from web reference-data defaults.
 * Run: node scripts/generate-reference-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { defaultReferenceData, referenceDataMeta } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "reference-data.ts")).href
);

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const lines = [
  "-- Reference data seed (generated from web/src/lib/reference-data.ts)",
  "-- Re-run: node scripts/generate-reference-seed.mjs",
  "",
  "insert into public.reference_list (key, label, \"group\", description, sort_order)",
  "values",
];

const listRows = [];
let sortOrder = 0;
for (const key of Object.keys(referenceDataMeta)) {
  const meta = referenceDataMeta[key];
  const description = meta.description ? sqlString(meta.description) : "null";
  listRows.push(
    `  (${sqlString(key)}, ${sqlString(meta.label)}, ${sqlString(meta.group)}, ${description}, ${sortOrder++})`
  );
}

lines.push(listRows.join(",\n"));
lines.push("on conflict (key) do update set");
lines.push("  label = excluded.label,");
lines.push("  \"group\" = excluded.\"group\",");
lines.push("  description = excluded.description,");
lines.push("  sort_order = excluded.sort_order;");
lines.push("");

for (const [key, options] of Object.entries(defaultReferenceData)) {
  if (!Array.isArray(options) || !options.length) continue;
  lines.push(`-- ${key}`);
  lines.push(
    "insert into public.reference_option (list_id, value, label, sort_order, active)"
  );
  lines.push("select l.id, v.value, v.label, v.sort_order, true");
  lines.push("from public.reference_list l");
  lines.push("cross join (values");
  const valueRows = options.map(
    (opt, i) => `  (${sqlString(opt)}, ${sqlString(opt)}, ${i})`
  );
  lines.push(valueRows.join(",\n"));
  lines.push(`) as v(value, label, sort_order)`);
  lines.push(`where l.key = ${sqlString(key)}`);
  lines.push("on conflict (list_id, value) do update set");
  lines.push("  label = excluded.label,");
  lines.push("  sort_order = excluded.sort_order,");
  lines.push("  active = excluded.active;");
  lines.push("");
}

const outPath = join(root, "supabase", "seed.sql");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
