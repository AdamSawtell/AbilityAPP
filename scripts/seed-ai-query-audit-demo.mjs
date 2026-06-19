/**
 * Seed 5000 dummy AI query records for AI Query Audit testing.
 * Idempotent: skips if demo rows already exist. Live AI chat adds rows via the app.
 *
 * Usage:
 *   npm run supabase:seed-ai-query-audit-demo
 *   npm run supabase:seed-ai-query-audit-demo -- --clear   # remove demo rows, then seed again
 */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "web", "package.json"));
const { createClient } = require("@supabase/supabase-js");

const COUNT = 5000;
const BATCH = 250;
const DEMO_AGENT_PREFIX = "agent-demo-";

/** Stable UUID per demo index (app_ai_chat_log.id is uuid, not text). */
function demoChatLogId(index) {
  const h = createHash("sha256").update(`abilityapp-ai-query-demo-${index}`).digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const DEMO_MARKER_ID = demoChatLogId(0);

const USER_MESSAGES = [
  "How many clients are active this month?",
  "Show me pending leave requests",
  "What tasks are overdue?",
  "Summarise incident trends for Q2",
  "List employees at North Sydney location",
  "Help me draft a credential review note",
  "What is the NDIS reportable incident timeframe?",
  "Find enquiries waiting more than 7 days",
];
const ASSISTANT_MESSAGES = [
  "There are 142 active clients this month based on current records.",
  "You have 8 pending leave requests in the review queue.",
  "12 tasks are overdue across your assigned locations.",
  "Incident reports increased 6% compared to last quarter.",
  "North Sydney has 24 active employees assigned.",
  "Here is a draft note you can edit before saving.",
  "Reportable incidents must be notified within 24 hours.",
  "7 enquiries have been open for more than 7 days.",
];
const AGENTS = [
  ["agent-home", "Home assistant"],
  ["agent-hr", "HR assistant"],
  ["agent-ops", "Operations assistant"],
];
const OUTCOMES = ["success", "success", "success", "success", "error"];
const RISK_LEVELS = ["none", "none", "none", "none", "low", "medium", "high"];
const RISK_STATUSES = ["new", "under_review", "accepted", "resolved"];
const BROWSERS = [
  ["Google Chrome", "Desktop — Windows"],
  ["Apple Safari", "Desktop — macOS"],
  ["Microsoft Edge", "Desktop — Windows"],
];
const IPS = ["203.45.112.88", "192.168.1.42", "10.0.0.15"];

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

function randomCreatedAt(now) {
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
  const chatLogs = [];
  const metaRows = [];
  const risks = [];

  for (let i = 0; i < COUNT; i++) {
    const user = users[randomInt(0, users.length - 1)];
    const role = user.roles[randomInt(0, user.roles.length - 1)];
    const [agentId, agentName] = AGENTS[randomInt(0, AGENTS.length - 1)];
    const msgIdx = randomInt(0, USER_MESSAGES.length - 1);
    const outcome = OUTCOMES[randomInt(0, OUTCOMES.length - 1)];
    const toolCount = randomInt(0, 3);
    const createdAt = randomCreatedAt(now);
    const id = demoChatLogId(i);
    const riskLevel = outcome === "error" ? "low" : RISK_LEVELS[randomInt(0, RISK_LEVELS.length - 1)];
    const riskStatus = riskLevel === "none" ? "new" : RISK_STATUSES[randomInt(0, RISK_STATUSES.length - 1)];
    const [browser, deviceInfo] = BROWSERS[randomInt(0, BROWSERS.length - 1)];

    chatLogs.push({
      id,
      user_id: user.userId,
      role_id: role.roleId,
      agent_id: agentId.startsWith(DEMO_AGENT_PREFIX) ? agentId : agentId,
      user_message: `[DemoSeed] ${USER_MESSAGES[msgIdx]}`,
      assistant_message: outcome === "error" ? "" : ASSISTANT_MESSAGES[msgIdx],
      tool_calls: toolCount
        ? Array.from({ length: toolCount }, (_, t) => ({ name: `demo_tool_${t}`, args: {} }))
        : [],
      created_at: iso(createdAt),
    });

    metaRows.push({
      chat_log_id: id,
      session_id: `us-demo-${String(randomInt(0, 4999)).padStart(5, "0")}`,
      user_name: user.userName,
      role_name: role.roleName,
      agent_name: agentName,
      query_type: toolCount ? "tool_call" : "chat",
      outcome,
      duration_ms: randomInt(500, 12000),
      ip_address: IPS[randomInt(0, IPS.length - 1)],
      browser,
      device_info: deviceInfo,
      user_agent: `DemoSeed/1.0 (${browser}; ${deviceInfo})`,
      risk_level: riskLevel,
      risk_status: riskStatus,
      created_at: iso(createdAt),
      updated_at: iso(createdAt),
    });

    if (riskLevel !== "none") {
      risks.push({
        id: `aqr-demo-${String(i).padStart(5, "0")}`,
        chat_log_id: id,
        indicator_code: "demo_risk",
        indicator_label: "Demo risk indicator",
        severity: riskLevel,
        detail: "Generated for dashboard testing",
        created_at: iso(createdAt),
      });
    }
  }

  return { chatLogs, metaRows, risks };
}

function buildDailyStats(chatLogs, metaRows) {
  const metaById = Object.fromEntries(metaRows.map((m) => [m.chat_log_id, m]));
  const byDate = new Map();

  for (const chat of chatLogs) {
    const meta = metaById[chat.id];
    const date = chat.created_at.slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, {
        stat_date: date,
        total_queries: 0,
        successful_queries: 0,
        error_queries: 0,
        blocked_queries: 0,
        unique_users: new Set(),
        tool_calls: 0,
        risk_events: 0,
        high_risk_events: 0,
        agent_counts: new Map(),
        user_counts: new Map(),
        updated_at: new Date().toISOString(),
      });
    }
    const row = byDate.get(date);
    row.total_queries += 1;
    if (meta.outcome === "success") row.successful_queries += 1;
    else if (meta.outcome === "blocked") row.blocked_queries += 1;
    else row.error_queries += 1;
    row.unique_users.add(chat.user_id);
    row.tool_calls += Array.isArray(chat.tool_calls) ? chat.tool_calls.length : 0;
    if (meta.risk_level !== "none") {
      row.risk_events += 1;
      if (meta.risk_level === "high" || meta.risk_level === "critical") row.high_risk_events += 1;
    }
    row.agent_counts.set(chat.agent_id, (row.agent_counts.get(chat.agent_id) ?? 0) + 1);
    row.user_counts.set(chat.user_id, (row.user_counts.get(chat.user_id) ?? 0) + 1);
  }

  return [...byDate.values()].map((row) => {
    let mostAgentId = "";
    let mostAgentCount = 0;
    for (const [aid, c] of row.agent_counts) {
      if (c > mostAgentCount) {
        mostAgentCount = c;
        mostAgentId = aid;
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
    const sampleChat = chatLogs.find((c) => c.agent_id === mostAgentId);
    const sampleMeta = metaRows.find((m) => m.chat_log_id === sampleChat?.id);
    const sampleUserMeta = metaRows.find((m) => chatLogs.find((c) => c.user_id === mostUserId && c.id === m.chat_log_id));
    return {
      stat_date: row.stat_date,
      total_queries: row.total_queries,
      successful_queries: row.successful_queries,
      error_queries: row.error_queries,
      blocked_queries: row.blocked_queries,
      unique_users: row.unique_users.size,
      tool_calls: row.tool_calls,
      risk_events: row.risk_events,
      high_risk_events: row.high_risk_events,
      most_active_agent_id: mostAgentId,
      most_active_agent_name: sampleMeta?.agent_name ?? "",
      most_active_agent_count: mostAgentCount,
      most_active_user_id: mostUserId,
      most_active_user_name: sampleUserMeta?.user_name ?? "",
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
  console.log("Clearing existing demo AI query rows…");
  const ids = new Set();
  for (let i = 0; i < COUNT; i++) {
    ids.add(demoChatLogId(i));
  }
  const { data: byMessage } = await supabase
    .from("app_ai_chat_log")
    .select("id")
    .like("user_message", "[DemoSeed]%");
  for (const row of byMessage ?? []) {
    ids.add(row.id);
  }
  const idList = [...ids];
  if (!idList.length) {
    console.log("  No demo rows found (skipping clear).");
    return;
  }
  for (let i = 0; i < idList.length; i += BATCH) {
    const chunk = idList.slice(i, i + BATCH);
    await supabase.from("ai_query_risk").delete().in("chat_log_id", chunk);
    await supabase.from("ai_query_audit_meta").delete().in("chat_log_id", chunk);
    await supabase.from("app_ai_chat_log").delete().in("id", chunk);
  }
  console.log(`  Removed up to ${idList.length} demo chat logs.`);
}

async function hasDemoData(supabase) {
  const { data: marker, error: markerErr } = await supabase
    .from("app_ai_chat_log")
    .select("id")
    .eq("id", DEMO_MARKER_ID)
    .maybeSingle();
  if (markerErr) throw markerErr;
  if (marker) return true;
  const { data: legacy, error: legacyErr } = await supabase
    .from("app_ai_chat_log")
    .select("id")
    .like("user_message", "[DemoSeed]%")
    .limit(1)
    .maybeSingle();
  if (legacyErr) throw legacyErr;
  return Boolean(legacy);
}

async function insertDailyStatsIfMissing(supabase, statsRows) {
  for (const row of statsRows) {
    const { data: existing } = await supabase
      .from("ai_query_daily_stats")
      .select("stat_date")
      .eq("stat_date", row.stat_date)
      .maybeSingle();
    if (!existing) {
      await supabase.from("ai_query_daily_stats").insert(row);
    }
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

  if (!clear && (await hasDemoData(supabase))) {
    console.log(`Demo AI query audit already seeded (${DEMO_MARKER_ID}). Skipping.`);
    console.log("  Live AI queries will continue to append rows. Use --clear to replace demo data.");
    return;
  }

  console.log("Loading users…");
  const users = await fetchUsersWithRoles(supabase);
  if (!users.length) throw new Error("No active users found");

  console.log(`Building ${COUNT} AI query records…`);
  const { chatLogs, metaRows, risks } = buildRecords(users, now);
  const statsRows = buildDailyStats(chatLogs, metaRows);

  console.log("Inserting…");
  await insertBatched(supabase, "app_ai_chat_log", chatLogs);
  await insertBatched(supabase, "ai_query_audit_meta", metaRows);
  if (risks.length) await insertBatched(supabase, "ai_query_risk", risks);
  console.log("Inserting daily stats (missing dates only)…");
  await insertDailyStatsIfMissing(supabase, statsRows);

  console.log(`Done — ${COUNT} AI query records seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
