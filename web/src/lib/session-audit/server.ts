import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { HIGH_PRIVILEGE_ROLE_IDS, DEFAULT_TIMEZONE } from "@/lib/session-audit/constants";
import { parseUserAgent } from "@/lib/session-audit/parse-user-agent";
import type {
  ConcurrentSessionsMode,
  LoginResult,
  RetentionJobRun,
  RetentionPolicyRecord,
  RiskSeverity,
  RiskStatus,
  SessionAuditFilters,
  SessionDashboardMetrics,
  SessionEventType,
  SessionInvestigationDetail,
  SessionStatus,
  UserSessionEvent,
  UserSessionRecord,
  UserSessionRisk,
  UserSessionRiskNote,
} from "@/lib/session-audit/types";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function mapSession(row: Record<string, unknown>): UserSessionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userName: String(row.user_name ?? ""),
    roleId: String(row.role_id ?? ""),
    roleName: String(row.role_name ?? ""),
    loginAt: String(row.login_at),
    logoutAt: String(row.logout_at ?? ""),
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    status: row.status as SessionStatus,
    ipAddress: String(row.ip_address ?? ""),
    browser: String(row.browser ?? ""),
    deviceInfo: String(row.device_info ?? ""),
    userAgent: String(row.user_agent ?? ""),
    authMethod: (row.auth_method as UserSessionRecord["authMethod"]) ?? "password",
    mfaStatus: String(row.mfa_status ?? "not_configured"),
    loginResult: row.login_result as LoginResult,
    failureReason: String(row.failure_reason ?? ""),
    riskLevel: (row.risk_level as UserSessionRecord["riskLevel"]) ?? "none",
    riskStatus: row.risk_status as RiskStatus,
    transactionCount: Number(row.transaction_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function severityRank(s: RiskSeverity | "none"): number {
  if (s === "critical") return 4;
  if (s === "high") return 3;
  if (s === "medium") return 2;
  if (s === "low") return 1;
  return 0;
}

function maxSeverity(a: RiskSeverity | "none", b: RiskSeverity): RiskSeverity | "none" {
  return severityRank(a) >= severityRank(b) ? a : b;
}

async function getSetting(supabase: SupabaseClient, key: string, fallback: string): Promise<string> {
  const { data } = await supabase.from("system_setting").select("value").eq("key", key).maybeSingle();
  return data?.value?.trim() ? String(data.value) : fallback;
}

async function appendEvent(
  supabase: SupabaseClient,
  sessionId: string,
  eventType: SessionEventType,
  detail = ""
) {
  await supabase.from("user_session_event").insert({
    id: newId("use"),
    session_id: sessionId,
    event_type: eventType,
    detail,
  });
}

async function appendRisk(
  supabase: SupabaseClient,
  sessionId: string,
  code: string,
  label: string,
  severity: RiskSeverity,
  detail: string
) {
  await supabase.from("user_session_risk").insert({
    id: newId("usr"),
    session_id: sessionId,
    indicator_code: code,
    indicator_label: label,
    severity,
    detail,
  });
  await appendEvent(supabase, sessionId, "risk_flagged", label);
  const { data: session } = await supabase.from("user_session").select("risk_level").eq("id", sessionId).maybeSingle();
  const current = (session?.risk_level as RiskSeverity | "none") ?? "none";
  const next = maxSeverity(current, severity);
  if (next !== current) {
    await supabase.from("user_session").update({ risk_level: next, updated_at: new Date().toISOString() }).eq("id", sessionId);
  }
}

async function bumpDailyStats(
  supabase: SupabaseClient,
  loginAt: string,
  patch: Partial<{
    total_logins: number;
    failed_logins: number;
    risk_events: number;
    high_risk_events: number;
    total_duration_seconds: number;
    session_count_for_avg: number;
    longest_session_seconds: number;
  }>
) {
  const statDate = loginAt.slice(0, 10);
  const { data: existing } = await supabase.from("user_session_daily_stats").select("*").eq("stat_date", statDate).maybeSingle();
  if (!existing) {
    await supabase.from("user_session_daily_stats").insert({
      stat_date: statDate,
      ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v])),
      updated_at: new Date().toISOString(),
    });
    return;
  }
  const next: Record<string, number> = {};
  for (const [k, v] of Object.entries(patch)) {
    next[k] = Number(existing[k as keyof typeof existing] ?? 0) + (v ?? 0);
  }
  if (patch.longest_session_seconds != null) {
    next.longest_session_seconds = Math.max(
      Number(existing.longest_session_seconds ?? 0),
      patch.longest_session_seconds
    );
  }
  await supabase
    .from("user_session_daily_stats")
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq("stat_date", statDate);
}

export async function recordFailedLogin(input: {
  userId?: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  failureReason: string;
}) {
  if (!isSupabaseConfigured()) return null;
  const supabase = serviceClient();
  const { browser, deviceInfo } = parseUserAgent(input.userAgent);
  const id = newId("us");
  const now = new Date().toISOString();
  await supabase.from("user_session").insert({
    id,
    user_id: input.userId ?? null,
    user_name: input.userName,
    login_at: now,
    status: "failed_login",
    ip_address: input.ipAddress,
    browser,
    device_info: deviceInfo,
    user_agent: input.userAgent,
    login_result: "failed",
    failure_reason: input.failureReason,
    created_at: now,
    updated_at: now,
  });
  await appendEvent(supabase, id, "failed_login", input.failureReason);
  await bumpDailyStats(supabase, now, { failed_logins: 1 });
  return id;
}

export async function recordSuccessfulLogin(input: {
  sessionId: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  ipAddress: string;
  userAgent: string;
  authMethod?: UserSessionRecord["authMethod"];
}) {
  if (!isSupabaseConfigured()) return input.sessionId;
  const supabase = serviceClient();
  const { browser, deviceInfo } = parseUserAgent(input.userAgent);
  const now = new Date().toISOString();
  const mode = (await getSetting(supabase, "concurrent_sessions_mode", "warn")) as ConcurrentSessionsMode;

  const { data: activeSessions } = await supabase
    .from("user_session")
    .select("id")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .eq("login_result", "success");

  if (mode === "prevent" && (activeSessions?.length ?? 0) > 0) {
    throw new Error("Concurrent sessions are not allowed for this account");
  }

  await supabase.from("user_session").insert({
    id: input.sessionId,
    user_id: input.userId,
    user_name: input.userName,
    role_id: input.roleId,
    role_name: input.roleName,
    login_at: now,
    status: "active",
    ip_address: input.ipAddress,
    browser,
    device_info: deviceInfo,
    user_agent: input.userAgent,
    auth_method: input.authMethod ?? "password",
    login_result: "success",
    created_at: now,
    updated_at: now,
  });
  await appendEvent(supabase, input.sessionId, "successful_login", `${input.userName} signed in as ${input.roleName}`);
  await bumpDailyStats(supabase, now, { total_logins: 1 });

  if ((activeSessions?.length ?? 0) > 0 && mode !== "allow") {
    await appendRisk(
      supabase,
      input.sessionId,
      "concurrent_sessions",
      "Concurrent sessions",
      "medium",
      `${(activeSessions?.length ?? 0) + 1} active sessions for this user`
    );
    await appendEvent(supabase, input.sessionId, "concurrent_session_detected", "Another session was already active");
  }

  await runRiskAssessment(supabase, input.sessionId, input.userId, input.roleId, input.ipAddress, now);
  return input.sessionId;
}

async function runRiskAssessment(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  roleId: string,
  ipAddress: string,
  loginAt: string
) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: failCount } = await supabase
    .from("user_session")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("login_result", "failed")
    .gte("login_at", since);

  if ((failCount ?? 0) >= 3) {
    await appendRisk(supabase, sessionId, "multiple_failed_logins", "Multiple failed login attempts", "high", `${failCount} failures in 15 minutes`);
  }

  const { data: priorIps } = await supabase
    .from("user_session")
    .select("ip_address")
    .eq("user_id", userId)
    .eq("login_result", "success")
    .neq("id", sessionId)
    .limit(50);
  const knownIps = new Set((priorIps ?? []).map((r) => r.ip_address).filter(Boolean));
  if (knownIps.size > 0 && ipAddress && !knownIps.has(ipAddress)) {
    await appendRisk(supabase, sessionId, "unusual_ip", "Login from new IP address", "medium", ipAddress);
  }

  const tz = await getSetting(supabase, "timezone", DEFAULT_TIMEZONE);
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date(loginAt))
  );
  const start = (await getSetting(supabase, "business_hours_start", "07:00")).slice(0, 2);
  const end = (await getSetting(supabase, "business_hours_end", "19:00")).slice(0, 2);
  const startH = Number(start);
  const endH = Number(end);
  if (hour < startH || hour >= endH) {
    await appendRisk(supabase, sessionId, "after_hours", "Login outside business hours", "low", `Login at ${hour}:00 ${tz}`);
  }

  if (HIGH_PRIVILEGE_ROLE_IDS.has(roleId)) {
    await appendRisk(supabase, sessionId, "high_privilege", "High privilege account login", "medium", roleId);
  }
}

export async function recordLogout(sessionId: string, status: SessionStatus = "logged_out") {
  if (!isSupabaseConfigured() || !sessionId) return;
  const supabase = serviceClient();
  const { data: row } = await supabase.from("user_session").select("*").eq("id", sessionId).maybeSingle();
  if (!row || row.status !== "active") return;
  const logoutAt = new Date().toISOString();
  const duration = Math.max(0, Math.floor((Date.parse(logoutAt) - Date.parse(String(row.login_at))) / 1000));
  await supabase
    .from("user_session")
    .update({
      logout_at: logoutAt,
      duration_seconds: duration,
      status,
      updated_at: logoutAt,
    })
    .eq("id", sessionId);
  const eventType: SessionEventType =
    status === "timed_out" ? "session_timeout" : status === "expired" ? "session_expiry" : "logout";
  await appendEvent(supabase, sessionId, eventType);
  await bumpDailyStats(supabase, String(row.login_at), {
    total_duration_seconds: duration,
    session_count_for_avg: 1,
    longest_session_seconds: duration,
  });
  const timeoutMin = Number(await getSetting(supabase, "session_timeout_minutes", "480"));
  if (duration > timeoutMin * 60 * 1.5) {
    await appendRisk(
      supabase,
      sessionId,
      "extended_duration",
      "Extended session duration",
      "low",
      `${Math.round(duration / 3600)} hours`
    );
  }
}

export async function recordRoleChange(sessionId: string, roleId: string, roleName: string) {
  if (!isSupabaseConfigured() || !sessionId) return;
  const supabase = serviceClient();
  await supabase
    .from("user_session")
    .update({ role_id: roleId, role_name: roleName, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  await appendEvent(supabase, sessionId, "role_change_during_session", roleName);
}

export async function closeTimedOutSessions() {
  if (!isSupabaseConfigured()) return { closed: 0 };
  const supabase = serviceClient();
  const timeoutMin = Number(await getSetting(supabase, "session_timeout_minutes", "480"));
  const cutoff = new Date(Date.now() - timeoutMin * 60 * 1000).toISOString();
  const { data: stale } = await supabase
    .from("user_session")
    .select("id")
    .eq("status", "active")
    .lt("updated_at", cutoff);
  for (const row of stale ?? []) {
    await recordLogout(row.id, "timed_out");
  }
  return { closed: stale?.length ?? 0 };
}

export async function listSessions(filters: SessionAuditFilters): Promise<{ sessions: UserSessionRecord[]; total: number }> {
  if (!isSupabaseConfigured()) return { sessions: [], total: 0 };
  const supabase = serviceClient();
  let query = supabase.from("user_session").select("*", { count: "exact" }).order("login_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.roleId) query = query.eq("role_id", filters.roleId);
  if (filters.dateFrom) query = query.gte("login_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("login_at", filters.dateTo);
  if (filters.ipAddress) query = query.ilike("ip_address", `%${filters.ipAddress}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.loginResult) query = query.eq("login_result", filters.loginResult);
  if (filters.riskLevel && filters.riskLevel !== "none") query = query.eq("risk_level", filters.riskLevel);
  if (filters.authMethod) query = query.eq("auth_method", filters.authMethod);
  if (filters.minDurationSeconds != null) query = query.gte("duration_seconds", filters.minDurationSeconds);
  if (filters.maxDurationSeconds != null) query = query.lte("duration_seconds", filters.maxDurationSeconds);
  if (filters.minTransactionCount != null) query = query.gte("transaction_count", filters.minTransactionCount);
  if (filters.search?.trim()) {
    const s = `%${filters.search.trim()}%`;
    query = query.or(`user_name.ilike.${s},role_name.ilike.${s},ip_address.ilike.${s}`);
  }

  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { sessions: (data ?? []).map(mapSession), total: count ?? 0 };
}

export async function getSessionDetail(sessionId: string): Promise<SessionInvestigationDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = serviceClient();
  const { data: row } = await supabase.from("user_session").select("*").eq("id", sessionId).maybeSingle();
  if (!row) return null;

  const [eventsRes, risksRes, notesRes] = await Promise.all([
    supabase.from("user_session_event").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
    supabase.from("user_session_risk").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
    supabase.from("user_session_risk_note").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
  ]);

  const session = mapSession(row);
  return {
    session,
    events: (eventsRes.data ?? []).map((e) => ({
      id: String(e.id),
      sessionId: String(e.session_id),
      eventType: e.event_type as SessionEventType,
      detail: String(e.detail ?? ""),
      createdAt: String(e.created_at),
    })),
    risks: (risksRes.data ?? []).map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      indicatorCode: String(r.indicator_code),
      indicatorLabel: String(r.indicator_label),
      severity: r.severity as RiskSeverity,
      detail: String(r.detail ?? ""),
      createdAt: String(r.created_at),
    })),
    notes: (notesRes.data ?? []).map((n) => ({
      id: String(n.id),
      sessionId: String(n.session_id),
      note: String(n.note),
      authorUserId: String(n.author_user_id),
      authorName: String(n.author_name),
      createdAt: String(n.created_at),
    })),
    auditSummary: {
      totalEvents: session.transactionCount,
      recordsModified: 0,
      tablesAffected: [],
      actions: {},
      events: [],
    },
  };
}

export async function addRiskNote(sessionId: string, note: string, authorUserId: string, authorName: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  await supabase.from("user_session_risk_note").insert({
    id: newId("usn"),
    session_id: sessionId,
    note,
    author_user_id: authorUserId,
    author_name: authorName,
  });
}

export async function updateRiskStatus(sessionId: string, riskStatus: RiskStatus) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  await supabase
    .from("user_session")
    .update({ risk_status: riskStatus, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function logSessionAuditAccess(input: {
  actorUserId: string;
  actorName: string;
  action: string;
  targetSessionId?: string;
  detail?: string;
  ipAddress?: string;
}) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  await supabase.from("session_audit_access_log").insert({
    id: newId("sal"),
    actor_user_id: input.actorUserId,
    actor_name: input.actorName,
    action: input.action,
    target_session_id: input.targetSessionId ?? "",
    detail: input.detail ?? "",
    ip_address: input.ipAddress ?? "",
  });
}

export async function getDashboardMetrics(dateFrom: string, dateTo: string): Promise<SessionDashboardMetrics> {
  if (!isSupabaseConfigured()) {
    return {
      totalLogins: 0,
      failedLogins: 0,
      uniqueUsers: 0,
      mostActiveUser: null,
      mostActiveRole: null,
      activeSessions: 0,
      averageSessionDurationSeconds: 0,
      longestSessionSeconds: 0,
      riskEvents: 0,
      highRiskEvents: 0,
    };
  }
  const supabase = serviceClient();
  const fromDate = dateFrom.slice(0, 10);
  const toDate = dateTo.slice(0, 10);

  const { data: statsRows } = await supabase
    .from("user_session_daily_stats")
    .select("*")
    .gte("stat_date", fromDate)
    .lte("stat_date", toDate);

  let totalLogins = 0;
  let failedLogins = 0;
  let totalDuration = 0;
  let sessionCountForAvg = 0;
  let longestSessionSeconds = 0;
  let riskEvents = 0;
  let highRiskEvents = 0;
  let mostActiveUser: SessionDashboardMetrics["mostActiveUser"] = null;
  let mostActiveRole: SessionDashboardMetrics["mostActiveRole"] = null;

  for (const row of statsRows ?? []) {
    totalLogins += Number(row.total_logins ?? 0);
    failedLogins += Number(row.failed_logins ?? 0);
    totalDuration += Number(row.total_duration_seconds ?? 0);
    sessionCountForAvg += Number(row.session_count_for_avg ?? 0);
    longestSessionSeconds = Math.max(longestSessionSeconds, Number(row.longest_session_seconds ?? 0));
    riskEvents += Number(row.risk_events ?? 0);
    highRiskEvents += Number(row.high_risk_events ?? 0);
    if (Number(row.most_active_user_count ?? 0) > (mostActiveUser?.count ?? 0)) {
      mostActiveUser = {
        userId: String(row.most_active_user_id ?? ""),
        userName: String(row.most_active_user_name ?? ""),
        count: Number(row.most_active_user_count ?? 0),
      };
    }
    if (Number(row.most_active_role_count ?? 0) > (mostActiveRole?.count ?? 0)) {
      mostActiveRole = {
        roleId: String(row.most_active_role_id ?? ""),
        roleName: String(row.most_active_role_name ?? ""),
        count: Number(row.most_active_role_count ?? 0),
      };
    }
  }

  const { count: activeSessions } = await supabase
    .from("user_session")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("login_result", "success");

  const { data: uniqueUsersData } = await supabase
    .from("user_session")
    .select("user_id")
    .gte("login_at", dateFrom)
    .lte("login_at", dateTo)
    .eq("login_result", "success");
  const uniqueUsers = new Set((uniqueUsersData ?? []).map((r) => r.user_id)).size;

  return {
    totalLogins,
    failedLogins,
    uniqueUsers,
    mostActiveUser,
    mostActiveRole,
    activeSessions: activeSessions ?? 0,
    averageSessionDurationSeconds: sessionCountForAvg ? Math.round(totalDuration / sessionCountForAvg) : 0,
    longestSessionSeconds,
    riskEvents,
    highRiskEvents,
  };
}

export async function getRetentionPolicies(): Promise<RetentionPolicyRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = serviceClient();
  const { data } = await supabase.from("retention_policy").select("*").order("record_type");
  return (data ?? []).map((r) => ({
    recordType: String(r.record_type),
    label: String(r.label ?? ""),
    retentionDays: Number(r.retention_days),
    active: Boolean(r.active),
    updatedAt: String(r.updated_at),
    updatedBy: String(r.updated_by ?? ""),
  }));
}

export async function updateRetentionPolicy(recordType: string, retentionDays: number, updatedBy: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  await supabase
    .from("retention_policy")
    .update({ retention_days: retentionDays, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq("record_type", recordType);
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};
  const supabase = serviceClient();
  const { data } = await supabase.from("system_setting").select("key, value");
  return Object.fromEntries((data ?? []).map((r) => [String(r.key), String(r.value)]));
}

export async function updateSystemSetting(key: string, value: string, updatedBy: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  await supabase
    .from("system_setting")
    .update({ value, updated_at: new Date().toISOString(), updated_by: updatedBy })
    .eq("key", key);
}

export async function runSessionRetention(): Promise<RetentionJobRun> {
  const id = newId("rjr");
  const startedAt = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    return {
      id,
      recordType: "user_session",
      startedAt,
      completedAt: startedAt,
      recordsDeleted: 0,
      durationMs: 0,
      errors: "Supabase not configured",
      status: "failed",
    };
  }
  const supabase = serviceClient();
  await supabase.from("retention_job_run").insert({
    id,
    record_type: "user_session",
    started_at: startedAt,
    status: "running",
  });

  try {
    const policies = await getRetentionPolicies();
    const policy = policies.find((p) => p.recordType === "user_session" && p.active);
    const days = policy?.retentionDays ?? 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldSessions } = await supabase.from("user_session").select("id").lt("login_at", cutoff);
    const ids = (oldSessions ?? []).map((r) => r.id);
    if (ids.length) {
      await supabase.from("user_session").delete().in("id", ids);
    }
    const completedAt = new Date().toISOString();
    const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
    await supabase
      .from("retention_job_run")
      .update({
        completed_at: completedAt,
        records_deleted: ids.length,
        duration_ms: durationMs,
        status: "completed",
      })
      .eq("id", id);
    return {
      id,
      recordType: "user_session",
      startedAt,
      completedAt,
      recordsDeleted: ids.length,
      durationMs,
      errors: "",
      status: "completed",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Retention failed";
    await supabase
      .from("retention_job_run")
      .update({ errors: message, status: "failed", completed_at: new Date().toISOString() })
      .eq("id", id);
    throw err;
  }
}

export async function getRecentRetentionRuns(limit = 10): Promise<RetentionJobRun[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = serviceClient();
  const { data } = await supabase
    .from("retention_job_run")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: String(r.id),
    recordType: String(r.record_type),
    startedAt: String(r.started_at),
    completedAt: String(r.completed_at ?? ""),
    recordsDeleted: Number(r.records_deleted ?? 0),
    durationMs: r.duration_ms == null ? null : Number(r.duration_ms),
    errors: String(r.errors ?? ""),
    status: r.status as RetentionJobRun["status"],
  }));
}

export function generateSessionId() {
  return newId("us");
}

export type { UserSessionEvent, UserSessionRisk, UserSessionRiskNote };
