import { readFileSync } from "fs";

const sql = readFileSync("supabase/seed-clients-bulk.sql", "utf8");
const m = sql.match(/insert into public\.support_plan \(([^)]+)\)\s*values\s*\n\s*(\([^]+?)\),/s);
const cols = m[1].split(",").map((s) => s.trim());
const tuple = m[2].slice(1);
function splitSqlValues(s) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && s[i - 1] !== "\\") {
      q = !q;
      cur += c;
      continue;
    }
    if (c === "," && !q) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const vals = splitSqlValues(tuple);
for (let i = 30; i < 52; i++) {
  console.log(i + 1, cols[i], "=>", vals[i]);
}
