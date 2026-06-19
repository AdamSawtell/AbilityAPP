/** Smoke test: login + session + Supabase-backed APIs */
const base = "http://localhost:3000";

async function loginAndSession() {
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "SuperUser", password: "flamingo" }),
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok) throw new Error(`login ${loginRes.status}: ${JSON.stringify(loginBody)}`);

  const roleId = loginBody.user.roleIds[0];
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: loginBody.user.id, roleId }),
  });
  const setCookie = sessionRes.headers.getSetCookie?.() ?? [];
  const sessionBody = await sessionRes.json();
  if (!sessionRes.ok) throw new Error(`session ${sessionRes.status}: ${JSON.stringify(sessionBody)}`);
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function get(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 200);
  }
  return { status: res.status, json };
}

const cookie = await loginAndSession();
console.log("login: ok");

const sessionDash = await get("/api/system/session-audit?mode=dashboard&range=30d", cookie);
console.log("session-audit dashboard:", sessionDash.status, {
  totalSessions: sessionDash.json?.totalSessions,
  activeSessions: sessionDash.json?.activeSessions,
});

const processDash = await get("/api/system/process-audit?mode=dashboard&range=30d", cookie);
console.log("process-audit dashboard:", processDash.status, {
  totalEvents: processDash.json?.totalEvents,
});

const aiDash = await get("/api/system/ai-query-audit?mode=dashboard&range=30d", cookie);
console.log("ai-query-audit dashboard:", aiDash.status, {
  totalQueries: aiDash.json?.totalQueries,
});

const sessionList = await get("/api/system/session-audit?limit=5", cookie);
console.log("session-audit list:", sessionList.status, {
  count: sessionList.json?.sessions?.length,
  total: sessionList.json?.total,
});
