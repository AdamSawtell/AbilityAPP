/**
 * Verifies every AppShell/SystemShell route resolves a how-to guide.
 * Exit 1 when articles or route mappings are missing.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { missingPageGuideArticles, resolvePageGuide } from "../src/lib/help/page-guides.ts";

const APP_DIR = join(import.meta.dirname, "../src/app");

const SKIP_SEGMENTS = new Set(["api", "login"]);
const SKIP_EXACT = new Set([
  "/help",
  "/help/[slug]",
  "/system/login",
  "/system/guides",
  "/system/guides/[slug]",
]);

function collectPageRoutes(dir, segments = []) {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (SKIP_SEGMENTS.has(entry)) continue;
      const next = entry.startsWith("[") && entry.endsWith("]")
        ? `[${entry.slice(1, -1)}]`
        : entry;
      routes.push(...collectPageRoutes(full, [...segments, next]));
      continue;
    }
    if (entry === "page.tsx") {
      const route = "/" + segments.join("/");
      routes.push(route === "/" ? "/" : route.replace(/\/$/, ""));
    }
  }
  return routes;
}

function samplePath(route) {
  return route
    .replace(/\[\.\.\.[^\]]+\]/g, "")
    .replace(/\[id\]/g, "sample-id")
    .replace(/\[section\]/g, "enquiries")
    .replace(/\[slug\]/g, "getting-started")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "") || "/";
}

const routes = collectPageRoutes(APP_DIR);
const missingGuides = [];
const checked = new Set();

for (const route of routes.sort()) {
  if (SKIP_EXACT.has(route)) continue;
  const path = samplePath(route);
  if (checked.has(path)) continue;
  checked.add(path);
  if (!resolvePageGuide(path)) {
    missingGuides.push(`${route} → ${path}`);
  }
}

const missingArticles = missingPageGuideArticles();
let failed = false;

if (missingArticles.length > 0) {
  failed = true;
  console.error("Missing help articles for slugs:", missingArticles.join(", "));
}

if (missingGuides.length > 0) {
  failed = true;
  console.error("Routes without a page guide mapping:");
  for (const line of missingGuides) console.error(`  ${line}`);
}

if (failed) {
  process.exit(1);
}

console.log(`page-guides:check OK (${checked.size} routes, ${missingArticles.length} article gaps)`);
