/**
 * Seed 5000 dummy process audit records for Process Audit testing.
 *
 * Usage:
 *   npm run supabase:seed-process-audit-demo
 *   npm run supabase:seed-process-audit-demo -- --clear
 */

import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "web", "package.json"));
const { createClient } = require("@supabase/supabase-js");

const COUNT = 5000;
const BATCH = 250;
const DEMO_PREFIX = "pa-demo-";

const PROCESS_IDS = [
  ["submit-leave-request", "Submit leave request"],
  ["approve-leave-request", "Approve leave request"],
  ["review-employee-credential", "Review employee credential"],
  ["assign-task", "Assign task"],
  ["action-task", "Action task"],
  ["report-incident", "Report incident"],
  ["enquiry-to-client", "Enquiry → Client"],
];
const OUTCOMES = ["success", "success", "success", "success", "failed", "denied"];
const RISK_LEVELS = ["none", "none", "none", "none", "low", "medium", "high", "critical"];
const RISK_STATUSES = ["new", "under_review", "accepted", "resolved"];
const BROWSERS = [
  ["Google Chrome", "Desktop — Windows"],
  ["Mozilla Firefox", "Desktop — Windows"],
  ["Apple Safari", "Desktop — macOS"],
  ["Microsoft Edge", "Desktop — Windows"],
];
const IPS = ["203.45.112.88", "192.168.1.42", "10.0.0.15", "118.127.44.201"];

function loadEnv() {
  const envPath = join(root, "web", ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing web/.env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStartedAt(now) {
  const daysAgo = Math.pow(Math.random(), 1.8) * 90;
  const d = new Date(now.getTime() - daysAgo * 86400000);
  d.setHours(randomInt(5, 23), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

function iso(d) {
  return d.toISOString();
}

async function fetchUsersWithRoles(supabase) {
  const { data: users, error: uErr } = await supabase
    .from("app_user")
    .select("id, first_name, last_name, username, active")
    .eq("active", true);
  if (uErr) throw uErr;
  const { data: links, error: lErr } = await supabase.from("app_user_role").select("user_id, role_id");
  if (lErr) throw lErr;
  const { data: roles, error: rErr } = await supabase.from("app_role").select("id, name");
  if (rErr) throw rErr;
  const roleName = Object.fromEntries((roles ?? []).map((r) => [r.id, r.name]));
  const byUser = new Map();
  for (const link of links ?? []) {
    if (!byUser.has(link.user_id)) byUser.set(link.user_id, []);
    byUser.get(link.user_id).push({ roleId: link.role_id, roleName: roleName[link.role_id] ?? link.role_id });
  }
  return (users ?? []).map((u) => ({
    userId: u.id,
    userName: `${u.first_name} ${u.last_name}`.trim() || u.username,
    roles: byUser.get(u.id) ?? [{ roleId: "role-support-worker", roleName: "Support Worker" }],
  }));
}

function buildRecords(users, now) {
  const audits = [];
  const events = [];
  const risks = [];

  for (let i = 0; i < COUNT; i++) {
    const user = users[randomInt(0, users.length - 1)];
    const role = user.roles[randomInt(0, user.roles.length - 1)];
    const [processId, processLabel] = PROCESS_IDS[randomInt(0, PROCESS_IDS.length - 1)];
    const outcome = OUTCOMES[randomInt(0, OUTCOMES.length - 1)];
    const status = outcome === "success" ? "completed" : outcome === "denied" ? "denied" : "failed";
    const startedAt = randomStartedAt(now);
    const durationMs = randomInt(200, 8000);
    const completedAt = new Date(startedAt.getTime() + durationMs);
    const [browser, deviceInfo] = BROWSERS[randomInt(0, BROWSERS.length - 1)];
    const id = `${DEMO_PREFIX}${String(i).padStart(5, "0")}`;
    const riskLevel = outcome === "success" ? RISK_LEVELS[randomInt(0, RISK_LEVELS.length - 1)] : outcome === "denied" ? "medium" : "none";
    const riskStatus = riskLevel === "none" ? "new" : RISK_STATUSES[randomInt(0, RISK_STATUSES.length - 1)];

    audits.push({
      id,
      user_id: user.userId,
      user_name: user.userName,
      role_id: role.roleId,
      role_name: role.roleName,
      session_id: `us-demo-${String(randomInt(0, 4999)).padStart(5, "0")}`,
      process_id: processId,
      process_label: processLabel,
      entity_type: "employee",
      entity_id: `emp-${randomInt(1, 200)}`,
      entity_label: `Demo Employee ${randomInt(1, 200)}`,
      outcome,
      status,
      ip_address: IPS[randomInt(0, IPS.length - 1)],
      browser,
      device_info: deviceInfo,
      user_agent: `DemoSeed/1.0 (${browser}; ${deviceInfo})`,
      detail: `Demo ${processLabel} — ${outcome}`,
      failure_reason: outcome === "failed" ? "Demo validation failure" : "",
      duration_ms: durationMs,
      risk_level: riskLevel,
      risk_status: riskStatus,
      started_at: iso(startedAt),
      completed_at: iso(completedAt),
      created_at: iso(startedAt),
      updated_at: iso(completedAt),
    });

    events.push({
      id: `pae-demo-${String(i).padStart(5, "0")}`,
      process_audit_id: id,
      event_type: status,
      detail: `Demo process ${status}`,
      created_at: iso(completedAt),
    });

    if (riskLevel !== "none") {
      risks.push({
        id: `par-demo-${String(i).padStart(5, "0")}`,
        process_audit_id: id,
        indicator_code: "demo_risk",
        indicator_label: "Demo risk indicator",
        severity: riskLevel,
        detail: "Generated for dashboard testing",
        created_at: iso(startedAt),
      });
    }
  }

  return { audits, events, risks };
}

function buildDailyStats(audits) {
  const byDate = new Map();
  for (const a of audits) {
    const date = a.started_at.slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, {
        stat_date: date,
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        denied_executions: 0,
        unique_users: new Set(),
        risk_events: 0,
        high_risk_events: 0,
        process_counts: new Map(),
        user_counts: new Map(),
        updated_at: new Date().toISOString(),
      });
    }
    const row = byDate.get(date);
    row.total_executions += 1;
    if (a.outcome === "success") row.successful_executions += 1;
    else if (a.outcome === "denied") row.denied_executions += 1;
    else row.failed_executions += 1;
    row.unique_users.add(a.user_id);
    if (a.risk_level !== "none") {
      row.risk_events += 1;
      if (a.risk_level === "high" || a.risk_level === "critical") row.high_risk_events += 1;
    }
    row.process_counts.set(a.process_id, (row.process_counts.get(a.process_id) ?? 0) + 1);
    row.user_counts.set(a.user_id, (row.user_counts.get(a.user_id) ?? 0) + 1);
  }

  return [...byDate.values()].map((row) => {
    let mostProcessId = "";
    let mostProcessCount = 0;
    for (const [pid, c] of row.process_counts) {
      if (c > mostProcessCount) {
        mostProcessCount = c;
        mostProcessId = pid;
      }
    }
    let mostUserId = "";
    let mostUserCount = 0;
    for (const [uid, c] of row.user_counts) {
      if (c > mostUserCount) {
        mostUserCount = c;
        mostUserId = uid;
      }
    }
    const sampleAudit = audits.find((a) => a.process_id === mostProcessId);
    const sampleUser = audits.find((a) => a.user_id === mostUserId);
    return {
      stat_date: row.stat_date,
      total_executions: row.total_executions,
      successful_executions: row.successful_executions,
      failed_executions: row.failed_executions,
      denied_executions: row.denied_executions,
      unique_users: row.unique_users.size,
      risk_events: row.risk_events,
      high_risk_events: row.high_risk_events,
      most_active_process_id: mostProcessId,
      most_active_process_label: sampleAudit?.process_label ?? "",
      most_active_process_count: mostProcessCount,
      most_active_user_id: mostUserId,
      most_active_user_name: sampleUser?.user_name ?? "",
      most_active_user_count: mostUserCount,
      updated_at: row.updated_at,
    };
  });
}

async function insertBatched(supabase, table, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`${table} batch ${i / BATCH + 1}: ${error.message}`);
    process.stdout.write(`  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`);
  }
  process.stdout.write("\n");
}

async function clearDemo(supabase) {
  console.log("Clearing existing demo process audit rows…");
  const { data: ids } = await supabase.from("process_audit").select("id").like("id", `${DEMO_PREFIX}%`);
  const auditIds = (ids ?? []).map((r) => r.id);
  if (!auditIds.length) {
    console.log("  No demo rows found.");
    return;
  }
  for (let i = 0; i < auditIds.length; i += BATCH) {
    const chunk = auditIds.slice(i, i + BATCH);
    await supabase.from("process_audit_risk").delete().in("process_audit_id", chunk);
    await supabase.from("process_audit_event").delete().in("process_audit_id", chunk);
    await supabase.from("process_audit").delete().in("id", chunk);
  }
  console.log(`  Removed ${auditIds.length} demo process audits.`);
}

async function mergeDailyStats(supabase, statsRows) {
  for (const row of statsRows) {
    const { data: existing } = await supabase
      .from("process_audit_daily_stats")
      .select("*")
      .eq("stat_date", row.stat_date)
      .maybeSingle();
    if (!existing) {
      await supabase.from("process_audit_daily_stats").insert(row);
      continue;
    }
    await supabase
      .from("process_audit_daily_stats")
      .update({
        total_executions: Number(existing.total_executions) + row.total_executions,
        successful_executions: Number(existing.successful_executions) + row.successful_executions,
        failed_executions: Number(existing.failed_executions) + row.failed_executions,
        denied_executions: Number(existing.denied_executions) + row.denied_executions,
        unique_users: Math.max(Number(existing.unique_users), row.unique_users),
        risk_events: Number(existing.risk_events) + row.risk_events,
        high_risk_events: Number(existing.high_risk_events) + row.high_risk_events,
        updated_at: row.updated_at,
      })
      .eq("stat_date", row.stat_date);
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars in web/.env.local");

  const clear = process.argv.includes("--clear");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date();

  if (clear) await clearDemo(supabase);

  console.log("Loading users…");
  const users = await fetchUsersWithRoles(supabase);
  if (!users.length) throw new Error("No active users found");

  console.log(`Building ${COUNT} process audit records…`);
  const { audits, events, risks } = buildRecords(users, now);
  const statsRows = buildDailyStats(audits);

  console.log("Inserting…");
  await insertBatched(supabase, "process_audit", audits);
  await insertBatched(supabase, "process_audit_event", events);
  if (risks.length) await insertBatched(supabase, "process_audit_risk", risks);
  console.log("Merging daily stats…");
  await mergeDailyStats(supabase, statsRows);

  console.log(`Done — ${COUNT} process audit records seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
