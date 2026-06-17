/**
 * Runs workforce + automation Supabase seeds in dependency order.
 * Usage: npm run supabase:seed-workforce
 * Requires: npx supabase link (remote) or local supabase running.
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const linked = process.argv.includes("--linked") || !process.argv.includes("--local");

const seeds = [
  "supabase/seed-employees.sql",
  "supabase/seed-locations.sql",
  "supabase/seed-org-structure.sql",
  "supabase/seed-org-structure-bulk.sql",
  "supabase/seed-task-automation.sql",
];

function runSeed(file) {
  const path = join(root, file);
  const args = linked
    ? ["supabase", "db", "query", "--linked", "-f", path]
    : ["supabase", "db", "query", "-f", path];

  console.log(`\n→ ${file}`);
  const result = spawnSync("npx", args, { stdio: "inherit", cwd: root, shell: true });
  if (result.status !== 0) {
    console.error(`Failed: ${file}`);
    process.exit(result.status ?? 1);
  }
}

console.log(linked ? "Seeding linked Supabase project…" : "Seeding local Supabase…");
for (const file of seeds) {
  runSeed(file);
}
console.log("\nWorkforce seeds completed.");
