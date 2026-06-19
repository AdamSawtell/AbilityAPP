/**
 * Seed 5000 dummy user session records for User Session Audit testing.
 * Idempotent: skips if demo rows already exist. Real logins add rows via session audit.
 *
 * Usage:
 *   npm run supabase:seed-session-audit-demo
 *   npm run supabase:seed-session-audit-demo -- --clear   # remove demo rows, then seed again
 *
 * Requires web/.env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
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
const DEMO_PREFIX = "us-demo-";
const DEMO_MARKER_ID = `${DEMO_PREFIX}00000`;

const STATUSES = ["logged_out", "timed_out", "expired", "active", "failed_login", "system_terminated"];
const STATUS_WEIGHTS = [0.55, 0.12, 0.05, 0.03, 0.2, 0.05];
const BROWSERS = [
  ["Google Chrome", "Desktop — Windows"],
  ["Google Chrome", "Desktop — macOS"],
  ["Mozilla Firefox", "Desktop — Windows"],
  ["Apple Safari", "Desktop — macOS"],
  ["Microsoft Edge", "Desktop — Windows"],
  ["Google Chrome", "Mobile"],
  ["Apple Safari", "Mobile"],
];
const IPS = [
  "203.45.112.88",
  "203.45.112.91",
  "192.168.1.42",
  "10.0.0.15",
  "118.127.44.201",
  "45.76.128.33",
  "203.45.118.44",
];
const RISK_LEVELS = ["none", "none", "none", "none", "low", "medium", "high", "critical"];
const RISK_STATUSES = ["new", "under_review", "accepted", "resolved"];

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

function pickWeighted(items, weights) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Bias login times toward the last 30 days. */
function randomLoginAt(now) {
  const daysAgo = Math.pow(Math.random(), 1.8) * 90;
  const ms = now.getTime() - daysAgo * 86400000;
  const hour = randomInt(5, 23);
  const minute = randomInt(0, 59);
  const d = new Date(ms);
  d.setHours(hour, minute, randomInt(0, 59), 0);
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

function buildSessions(users, now) {
  const sessions = [];
  const events = [];
  const risks = [];

  for (let i = 0; i < COUNT; i++) {
    const user = users[randomInt(0, users.length - 1)];
    const role = user.roles[randomInt(0, user.roles.length - 1)];
    const loginAt = randomLoginAt(now);
    const status = pickWeighted(STATUSES, STATUS_WEIGHTS);
    const failed = status === "failed_login";
    const loginResult = failed ? "failed" : "success";
    const durationMin = failed ? null : randomInt(5, 480);
    const logoutAt =
      failed || status === "active"
        ? null
        : new Date(loginAt.getTime() + (durationMin ?? 30) * 60000);
    const durationSeconds =
      failed || status === "active" || !logoutAt
        ? null
        : Math.max(60, Math.floor((logoutAt.getTime() - loginAt.getTime()) / 1000));
    const [browser, deviceInfo] = BROWSERS[randomInt(0, BROWSERS.length - 1)];
    const ip = IPS[randomInt(0, IPS.length - 1)];
    const id = `${DEMO_PREFIX}${String(i).padStart(5, "0")}`;
    const riskLevel = failed ? "none" : RISK_LEVELS[randomInt(0, RISK_LEVELS.length - 1)];
    const riskStatus = riskLevel === "none" ? "new" : RISK_STATUSES[randomInt(0, RISK_STATUSES.length - 1)];
    const txnCount = failed ? 0 : randomInt(0, 45);

    sessions.push({
      id,
      user_id: user.userId,
      user_name: user.userName,
      role_id: role.roleId,
      role_name: role.roleName,
      login_at: iso(loginAt),
      logout_at: logoutAt ? iso(logoutAt) : null,
      duration_seconds: durationSeconds,
      status,
      ip_address: ip,
      browser,
      device_info: deviceInfo,
      user_agent: `DemoSeed/1.0 (${browser}; ${deviceInfo})`,
      auth_method: "password",
      mfa_status: "not_configured",
      login_result: loginResult,
      failure_reason: failed ? pickWeighted(["Invalid password", "Account locked", "Invalid username or password"], [0.7, 0.15, 0.15]) : "",
      risk_level: riskLevel,
      risk_status: riskStatus,
      transaction_count: txnCount,
      created_at: iso(loginAt),
      updated_at: logoutAt ? iso(logoutAt) : iso(loginAt),
    });

    events.push({
      id: `use-demo-${String(i).padStart(5, "0")}`,
      session_id: id,
      event_type: failed ? "failed_login" : "successful_login",
      detail: failed ? "Demo failed login" : `Demo login as ${role.roleName}`,
      created_at: iso(loginAt),
    });

    if (!failed && status !== "active" && status !== "failed_login") {
      events.push({
        id: `use-demo-${String(i).padStart(5, "0")}-end`,
        session_id: id,
        event_type: status === "timed_out" ? "session_timeout" : status === "expired" ? "session_expiry" : "logout",
        detail: "Demo session end",
        created_at: iso(logoutAt ?? loginAt),
      });
    }

    if (riskLevel !== "none") {
      risks.push({
        id: `usr-demo-${String(i).padStart(5, "0")}`,
        session_id: id,
        indicator_code: "demo_risk",
        indicator_label: "Demo risk indicator",
        severity: riskLevel,
        detail: "Generated for dashboard and filter testing",
        created_at: iso(loginAt),
      });
    }
  }

  return { sessions, events, risks };
}

function buildDailyStats(sessions) {
  const byDate = new Map();
  for (const s of sessions) {
    const date = s.login_at.slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, {
        stat_date: date,
        total_logins: 0,
        failed_logins: 0,
        unique_users: new Set(),
        total_duration_seconds: 0,
        session_count_for_avg: 0,
        longest_session_seconds: 0,
        risk_events: 0,
        high_risk_events: 0,
        user_counts: new Map(),
        role_counts: new Map(),
        updated_at: new Date().toISOString(),
      });
    }
    const row = byDate.get(date);
    if (s.login_result === "failed") row.failed_logins += 1;
    else row.total_logins += 1;
    row.unique_users.add(s.user_id);
    if (s.duration_seconds) {
      row.total_duration_seconds += s.duration_seconds;
      row.session_count_for_avg += 1;
      row.longest_session_seconds = Math.max(row.longest_session_seconds, s.duration_seconds);
    }
    if (s.risk_level !== "none") {
      row.risk_events += 1;
      if (s.risk_level === "high" || s.risk_level === "critical") row.high_risk_events += 1;
    }
    if (s.login_result === "success") {
      row.user_counts.set(s.user_id, (row.user_counts.get(s.user_id) ?? 0) + 1);
      row.role_counts.set(s.role_id, (row.role_counts.get(s.role_id) ?? 0) + 1);
    }
  }

  return [...byDate.values()].map((row) => {
    let mostUserId = "";
    let mostUserCount = 0;
    for (const [uid, c] of row.user_counts) {
      if (c > mostUserCount) {
        mostUserCount = c;
        mostUserId = uid;
      }
    }
    let mostRoleId = "";
    let mostRoleCount = 0;
    for (const [rid, c] of row.role_counts) {
      if (c > mostRoleCount) {
        mostRoleCount = c;
        mostRoleId = rid;
      }
    }
    const sampleUser = sessions.find((s) => s.user_id === mostUserId);
    const sampleRole = sessions.find((s) => s.role_id === mostRoleId);
    return {
      stat_date: row.stat_date,
      total_logins: row.total_logins,
      failed_logins: row.failed_logins,
      unique_users: row.unique_users.size,
      active_sessions_end_of_day: 0,
      total_duration_seconds: row.total_duration_seconds,
      session_count_for_avg: row.session_count_for_avg,
      longest_session_seconds: row.longest_session_seconds,
      risk_events: row.risk_events,
      high_risk_events: row.high_risk_events,
      most_active_user_id: mostUserId,
      most_active_user_name: sampleUser?.user_name ?? "",
      most_active_user_count: mostUserCount,
      most_active_role_id: mostRoleId,
      most_active_role_name: sampleRole?.role_name ?? "",
      most_active_role_count: mostRoleCount,
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
  console.log("Clearing existing demo session rows…");
  const { data: ids } = await supabase.from("user_session").select("id").like("id", `${DEMO_PREFIX}%`);
  const sessionIds = (ids ?? []).map((r) => r.id);
  if (!sessionIds.length) {
    console.log("  No demo rows found.");
    return;
  }
  for (let i = 0; i < sessionIds.length; i += BATCH) {
    const chunk = sessionIds.slice(i, i + BATCH);
    await supabase.from("user_session_risk").delete().in("session_id", chunk);
    await supabase.from("user_session_event").delete().in("session_id", chunk);
    await supabase.from("user_session").delete().in("id", chunk);
  }
  console.log(`  Removed ${sessionIds.length} demo sessions.`);
}

async function hasDemoData(supabase) {
  const { data, error } = await supabase.from("user_session").select("id").eq("id", DEMO_MARKER_ID).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function insertDailyStatsIfMissing(supabase, statsRows) {
  for (const row of statsRows) {
    const { data: existing } = await supabase
      .from("user_session_daily_stats")
      .select("stat_date")
      .eq("stat_date", row.stat_date)
      .maybeSingle();
    if (!existing) {
      await supabase.from("user_session_daily_stats").insert(row);
    }
  }
}

async function main() {
  const clear = process.argv.includes("--clear");
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase URL/key missing in web/.env.local");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const users = await fetchUsersWithRoles(supabase);
  if (!users.length) throw new Error("No active users in app_user");

  if (clear) await clearDemo(supabase);

  if (!clear && (await hasDemoData(supabase))) {
    console.log(`Demo session audit already seeded (${DEMO_MARKER_ID}). Skipping.`);
    console.log("  Live logins will continue to append rows. Use --clear to replace demo data.");
    return;
  }

  const now = new Date();
  console.log(`Generating ${COUNT} demo sessions (last 90 days, weighted recent)…`);
  const { sessions, events, risks } = buildSessions(users, now);
  const statsRows = buildDailyStats(sessions);

  console.log("Inserting sessions…");
  await insertBatched(supabase, "user_session", sessions);
  console.log("Inserting events…");
  await insertBatched(supabase, "user_session_event", events);
  if (risks.length) {
    console.log("Inserting risk indicators…");
    await insertBatched(supabase, "user_session_risk", risks);
  }
  console.log("Inserting daily stats (missing dates only)…");
  await insertDailyStatsIfMissing(supabase, statsRows);

  const oldest = sessions.reduce((a, s) => (s.login_at < a ? s.login_at : a), sessions[0].login_at);
  const newest = sessions.reduce((a, s) => (s.login_at > a ? s.login_at : a), sessions[0].login_at);
  console.log(`Done. ${COUNT} demo sessions from ${oldest.slice(0, 10)} to ${newest.slice(0, 10)}.`);
  console.log(`  Success: ${sessions.filter((s) => s.login_result === "success").length}`);
  console.log(`  Failed: ${sessions.filter((s) => s.login_result === "failed").length}`);
  console.log(`  With risk: ${sessions.filter((s) => s.risk_level !== "none").length}`);
  console.log(`  Active: ${sessions.filter((s) => s.status === "active").length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
