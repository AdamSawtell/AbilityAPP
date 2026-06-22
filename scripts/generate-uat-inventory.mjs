/**
 * Generates docs/testing/uat/UAT-INVENTORY.generated.md from access catalog.
 * Run: npm run uat:inventory
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "docs", "testing", "uat", "UAT-INVENTORY.generated.md");

const { ACCESS_WINDOWS, ACCESS_PROCESSES } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "access", "catalog.ts")).href
);
const { ACCESS_REPORTS } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "reports", "catalog.ts")).href
);

const PACK_BY_PARENT = {
  enquiries: "UAT-01",
  clients: "UAT-02",
  locations: "UAT-03",
  products: "UAT-03",
  "price-lists": "UAT-03",
  contracts: "UAT-03",
  "business-partners": "UAT-03",
  "service-agreements": "UAT-04",
  "service-bookings": "UAT-04",
  "service-planning": "UAT-05",
  "multi-provider-budget": "UAT-05",
  rostering: "UAT-05",
  timesheets: "UAT-06",
  "timesheet-approval": "UAT-06",
  "generate-timesheets": "UAT-06",
  claims: "UAT-07",
  "generate-claims": "UAT-07",
  invoices: "UAT-07",
  "generate-invoices": "UAT-07",
  "plan-reconciliation": "UAT-08",
  "claim-reconciliation": "UAT-08",
  "invoice-reconciliation": "UAT-08",
  "financial-close": "UAT-08",
  "ndis-audit-pack": "UAT-08",
  "board-reporting": "UAT-08",
  incidents: "UAT-09",
  complaints: "UAT-09",
  employees: "UAT-10",
  "workforce-planning": "UAT-10",
  "workforce-organisation": "UAT-10",
  "my-workplace": "UAT-11",
  my: "UAT-11",
  reports: "UAT-12",
  "reports-advance": "UAT-12",
  tasks: "UAT-12",
  home: "UAT-00",
  "admin-organization": "UAT-13",
  "admin-reference-data": "UAT-13",
  "admin-roles": "UAT-13",
};

function resolvePack(win) {
  if (win.key.startsWith("my-") || win.href?.startsWith("/my")) return "UAT-11";
  if (win.surface === "system") return "UAT-13";
  if (win.parentWindowKey && PACK_BY_PARENT[win.parentWindowKey]) {
    return PACK_BY_PARENT[win.parentWindowKey];
  }
  if (PACK_BY_PARENT[win.key]) return PACK_BY_PARENT[win.key];
  if (win.group === "Admin") return "UAT-13";
  if (win.key.startsWith("home-")) return "UAT-00";
  if (win.key.startsWith("enquiry-")) return "UAT-01";
  if (win.key.startsWith("client-")) return "UAT-02";
  if (win.key.startsWith("employee-")) return "UAT-10";
  if (win.key.startsWith("location-")) return "UAT-03";
  if (win.key.startsWith("incident")) return "UAT-09";
  return "UAT-99";
}

function uatWindowId(win, index) {
  const pack = resolvePack(win);
  const num = String(index + 1).padStart(3, "0");
  return `${pack}-W-${num}`;
}

const appWindows = ACCESS_WINDOWS.filter((w) => w.surface !== "system");
const systemWindows = ACCESS_WINDOWS.filter((w) => w.surface === "system");

const lines = [
  "# UAT window inventory (generated)",
  "",
  `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
  "**Do not edit by hand.** Regenerate with `npm run uat:inventory`.",
  "",
  "Use with [UAT-INDEX.md](../UAT-INDEX.md) module packs. Mark **Result**: Pass | Fail | Skip | N/A.",
  "",
  "## Summary",
  "",
  `| Metric | Count |`,
  `|--------|------:|`,
  `| App windows (incl. tabs) | ${appWindows.length} |`,
  `| System windows | ${systemWindows.length} |`,
  `| Access processes | ${ACCESS_PROCESSES.length} |`,
  `| Reports | ${ACCESS_REPORTS.length} |`,
  "",
];

const byPack = new Map();
for (let i = 0; i < ACCESS_WINDOWS.length; i++) {
  const win = ACCESS_WINDOWS[i];
  const pack = resolvePack(win);
  if (!byPack.has(pack)) byPack.set(pack, []);
  byPack.get(pack).push({ win, uatId: uatWindowId(win, byPack.get(pack).length) });
}

const packOrder = [
  "UAT-00",
  "UAT-01",
  "UAT-02",
  "UAT-03",
  "UAT-04",
  "UAT-05",
  "UAT-06",
  "UAT-07",
  "UAT-08",
  "UAT-09",
  "UAT-10",
  "UAT-11",
  "UAT-12",
  "UAT-13",
  "UAT-99",
];

for (const pack of packOrder) {
  const items = byPack.get(pack);
  if (!items?.length) continue;
  lines.push(`## ${pack}`);
  lines.push("");
  lines.push("| UAT ID | Window key | Label | Route / tab | Parent | Result |");
  lines.push("|--------|------------|-------|-------------|--------|--------|");
  for (const { win, uatId } of items) {
    const route = win.href ?? (win.detailTab ? `tab: ${win.detailTab}` : "—");
    const parent = win.parentWindowKey ?? "—";
    lines.push(
      `| ${uatId} | \`${win.key}\` | ${win.label} | ${route} | ${parent} | |`
    );
  }
  lines.push("");
}

lines.push("## Processes (UAT-15)");
lines.push("");
lines.push("| UAT ID | Process ID | Label | Parent window | Result |");
lines.push("|--------|------------|-------|---------------|--------|");
ACCESS_PROCESSES.forEach((p, i) => {
  const id = `UAT-15-P-${String(i + 1).padStart(3, "0")}`;
  lines.push(`| ${id} | \`${p.id}\` | ${p.label} | ${p.parentWindowKey ?? "—"} | |`);
});
lines.push("");

lines.push("## Reports (UAT-12)");
lines.push("");
lines.push("| UAT ID | Report ID | Label | Module | Result |");
lines.push("|--------|-----------|-------|--------|--------|");
ACCESS_REPORTS.forEach((r, i) => {
  const id = `UAT-12-R-${String(i + 1).padStart(3, "0")}`;
  lines.push(`| ${id} | \`${r.id}\` | ${r.label} | ${r.moduleGroup} | |`);
});
lines.push("");

writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath} (${ACCESS_WINDOWS.length} windows, ${ACCESS_PROCESSES.length} processes, ${ACCESS_REPORTS.length} reports)`);
