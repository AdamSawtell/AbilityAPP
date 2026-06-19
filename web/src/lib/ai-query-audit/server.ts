import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { auditContextFromSession, auditNewId } from "@/lib/audit-monitoring/shared";
import { decodeAuditCursor, encodeAuditCursor } from "@/lib/audit-monitoring/pagination";
import { archiveAndDeleteBeforeCutoff } from "@/lib/audit-monitoring/retention-batch";
import { enqueueRiskAssessment, type AiQueryRiskPayload } from "@/lib/audit-monitoring/risk-queue";
import type {
  AiQueryAuditFilters,
  AiQueryAuditRecord,
  AiQueryDashboardMetrics,
  AiQueryInvestigationDetail,
  AiQueryOutcome,
} from "@/lib/ai-query-audit/types";
import { serviceClient } from "@/lib/session-audit/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { RiskSeverity, RiskStatus, RetentionJobRun } from "@/lib/session-audit/types";

function mapRecord(
  chat: Record<string, unknown>,
  meta: Record<string, unknown> | null
): AiQueryAuditRecord {
  const toolCalls = chat.tool_calls;
  const toolCount = Array.isArray(toolCalls) ? toolCalls.length : 0;
  return {
    id: String(chat.id),
    userId: String(chat.user_id ?? ""),
    userName: String(meta?.user_name ?? ""),
    roleId: String(chat.role_id ?? ""),
    roleName: String(meta?.role_name ?? ""),
    sessionId: String(meta?.session_id ?? ""),
    agentId: String(chat.agent_id ?? ""),
    agentName: String(meta?.agent_name ?? chat.agent_id ?? ""),
    queryType: (meta?.query_type as AiQueryAuditRecord["queryType"]) ?? (toolCount ? "tool_call" : "chat"),
    userMessage: String(chat.user_message ?? ""),
    assistantMessage: String(chat.assistant_message ?? ""),
    toolCallCount: toolCount,
    outcome: (meta?.outcome as AiQueryOutcome) ?? "success",
    ipAddress: String(meta?.ip_address ?? ""),
    browser: String(meta?.browser ?? ""),
    deviceInfo: String(meta?.device_info ?? ""),
    userAgent: String(meta?.user_agent ?? ""),
    durationMs: meta?.duration_ms == null ? null : Number(meta.duration_ms),
    riskLevel: (meta?.risk_level as AiQueryAuditRecord["riskLevel"]) ?? "none",
    riskStatus: (meta?.risk_status as RiskStatus) ?? "new",
    createdAt: String(chat.created_at ?? meta?.created_at ?? ""),
  };
}

async function bumpDailyStats(supabase: SupabaseClient, createdAt: string, patch: Record<string, number>) {
  const statDate = createdAt.slice(0, 10);
  const { data: existing } = await supabase.from("ai_query_daily_stats").select("*").eq("stat_date", statDate).maybeSingle();
  if (!existing) {
    await supabase.from("ai_query_daily_stats").insert({ stat_date: statDate, ...patch, updated_at: new Date().toISOString() });
    return;
  }
  const next: Record<string, number | string> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    next[k] = Number(existing[k as keyof typeof existing] ?? 0) + v;
  }
  await supabase.from("ai_query_daily_stats").update(next).eq("stat_date", statDate);
}

function queueAiQueryRisk(chatLogId: string, payload: AiQueryRiskPayload) {
  void enqueueRiskAssessment("ai_query", chatLogId, payload);
}

export async function enrichAiQueryAudit(input: {
  chatLogId: string;
  session: AuthSession;
  agentName: string;
  userMessage: string;
  toolCallCount?: number;
  outcome?: AiQueryOutcome;
  durationMs?: number;
  request?: Request;
}) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  const ctx = auditContextFromSession(input.session, input.request);
  const now = new Date().toISOString();
  await supabase.from("ai_query_audit_meta").upsert({
    chat_log_id: input.chatLogId,
    session_id: ctx.sessionId,
    user_name: ctx.userName,
    role_name: ctx.roleName,
    agent_name: input.agentName,
    query_type: (input.toolCallCount ?? 0) > 0 ? "tool_call" : "chat",
    outcome: input.outcome ?? "success",
    duration_ms: input.durationMs ?? null,
    ip_address: ctx.ipAddress,
    browser: ctx.browser,
    device_info: ctx.deviceInfo,
    user_agent: ctx.userAgent,
    created_at: now,
    updated_at: now,
  });
  const statsPatch: Record<string, number> = {
    total_queries: 1,
    successful_queries: input.outcome === "success" || !input.outcome ? 1 : 0,
    error_queries: input.outcome === "error" ? 1 : 0,
    blocked_queries: input.outcome === "blocked" ? 1 : 0,
    tool_calls: input.toolCallCount ?? 0,
  };
  await bumpDailyStats(supabase, now, statsPatch);
  queueAiQueryRisk(input.chatLogId, {
    chatLogId: input.chatLogId,
    userId: ctx.userId,
    userMessage: input.userMessage,
    createdAt: now,
  });
}

export async function listAiQueryAudits(filters: AiQueryAuditFilters) {
  if (!isSupabaseConfigured()) return { records: [], total: 0, nextCursor: null };
  const supabase = serviceClient();
  let query = supabase.from("app_ai_chat_log").select("*", { count: "exact" }).order("created_at", { ascending: false }).order("id", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.roleId) query = query.eq("role_id", filters.roleId);
  if (filters.agentId) query = query.eq("agent_id", filters.agentId);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.search?.trim()) {
    query = query.textSearch("user_message", filters.search.trim(), { type: "websearch", config: "english" });
  }

  const cursor = decodeAuditCursor(filters.cursor);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.startedAt},and(created_at.eq.${cursor.startedAt},id.lt.${cursor.id})`);
  }
  const limit = filters.limit ?? 50;
  query = query.limit(limit);
  const { data, count, error } = await query;
  if (error) throw error;

  const ids = (data ?? []).map((r) => r.id);
  const metaById = new Map<string, Record<string, unknown>>();
  if (ids.length) {
    const { data: metaRows } = await supabase.from("ai_query_audit_meta").select("*").in("chat_log_id", ids);
    for (const m of metaRows ?? []) metaById.set(String(m.chat_log_id), m as Record<string, unknown>);
  }

  let records = (data ?? []).map((row) =>
    mapRecord(row as Record<string, unknown>, metaById.get(String(row.id)) ?? null)
  );

  if (filters.outcome) records = records.filter((r) => r.outcome === filters.outcome);
  if (filters.queryType) records = records.filter((r) => r.queryType === filters.queryType);
  if (filters.riskLevel && filters.riskLevel !== "none") {
    records = records.filter((r) => r.riskLevel === filters.riskLevel);
  }

  const last = records[records.length - 1];
  const nextCursor = last && records.length >= limit ? encodeAuditCursor(last.createdAt, last.id) : null;
  return { records, total: count ?? 0, nextCursor };
}

export async function getAiQueryAuditDetail(chatLogId: string): Promise<AiQueryInvestigationDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = serviceClient();
  const { data: chat } = await supabase.from("app_ai_chat_log").select("*").eq("id", chatLogId).maybeSingle();
  if (!chat) return null;
  const { data: meta } = await supabase.from("ai_query_audit_meta").select("*").eq("chat_log_id", chatLogId).maybeSingle();
  const [risks, notes, dbLog] = await Promise.all([
    supabase.from("ai_query_risk").select("*").eq("chat_log_id", chatLogId).order("created_at"),
    supabase.from("ai_query_risk_note").select("*").eq("chat_log_id", chatLogId).order("created_at"),
    supabase
      .from("app_ai_db_access_log")
      .select("*")
      .eq("user_id", chat.user_id)
      .gte("created_at", new Date(Date.parse(String(chat.created_at)) - 60000).toISOString())
      .lte("created_at", new Date(Date.parse(String(chat.created_at)) + 60000).toISOString())
      .order("created_at"),
  ]);

  return {
    record: mapRecord(chat as Record<string, unknown>, meta as Record<string, unknown> | null),
    dbAccessLog: (dbLog.data ?? []).map((r) => ({
      toolName: String(r.tool_name ?? ""),
      action: String(r.action ?? ""),
      target: String(r.target ?? ""),
      createdAt: String(r.created_at),
    })),
    risks: (risks.data ?? []).map((r) => ({
      id: String(r.id),
      indicatorLabel: String(r.indicator_label),
      severity: r.severity as RiskSeverity,
      detail: String(r.detail ?? ""),
      createdAt: String(r.created_at),
    })),
    notes: (notes.data ?? []).map((n) => ({
      id: String(n.id),
      note: String(n.note),
      authorName: String(n.author_name),
      createdAt: String(n.created_at),
    })),
  };
}

export async function addAiQueryRiskNote(chatLogId: string, note: string, authorUserId: string, authorName: string) {
  if (!isSupabaseConfigured()) return;
  await serviceClient().from("ai_query_risk_note").insert({
    id: auditNewId("aqn"),
    chat_log_id: chatLogId,
    note,
    author_user_id: authorUserId,
    author_name: authorName,
  });
}

export async function updateAiQueryRiskStatus(chatLogId: string, riskStatus: RiskStatus) {
  if (!isSupabaseConfigured()) return;
  await serviceClient()
    .from("ai_query_audit_meta")
    .update({ risk_status: riskStatus, updated_at: new Date().toISOString() })
    .eq("chat_log_id", chatLogId);
}

export async function getAiQueryDashboardMetrics(dateFrom: string, dateTo: string): Promise<AiQueryDashboardMetrics> {
  if (!isSupabaseConfigured()) {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      errorQueries: 0,
      blockedQueries: 0,
      uniqueUsers: 0,
      toolCalls: 0,
      riskEvents: 0,
      highRiskEvents: 0,
      mostActiveAgent: null,
      mostActiveUser: null,
    };
  }
  const supabase = serviceClient();
  const { data: statsRows } = await supabase
    .from("ai_query_daily_stats")
    .select("*")
    .gte("stat_date", dateFrom.slice(0, 10))
    .lte("stat_date", dateTo.slice(0, 10));

  let totalQueries = 0;
  let successfulQueries = 0;
  let errorQueries = 0;
  let blockedQueries = 0;
  let toolCalls = 0;
  let riskEvents = 0;
  let highRiskEvents = 0;
  let mostActiveAgent: AiQueryDashboardMetrics["mostActiveAgent"] = null;
  let mostActiveUser: AiQueryDashboardMetrics["mostActiveUser"] = null;

  for (const row of statsRows ?? []) {
    totalQueries += Number(row.total_queries ?? 0);
    successfulQueries += Number(row.successful_queries ?? 0);
    errorQueries += Number(row.error_queries ?? 0);
    blockedQueries += Number(row.blocked_queries ?? 0);
    toolCalls += Number(row.tool_calls ?? 0);
    riskEvents += Number(row.risk_events ?? 0);
    highRiskEvents += Number(row.high_risk_events ?? 0);
    if (Number(row.most_active_agent_count ?? 0) > (mostActiveAgent?.count ?? 0)) {
      mostActiveAgent = {
        agentId: String(row.most_active_agent_id ?? ""),
        agentName: String(row.most_active_agent_name ?? ""),
        count: Number(row.most_active_agent_count ?? 0),
      };
    }
    if (Number(row.most_active_user_count ?? 0) > (mostActiveUser?.count ?? 0)) {
      mostActiveUser = {
        userId: String(row.most_active_user_id ?? ""),
        userName: String(row.most_active_user_name ?? ""),
        count: Number(row.most_active_user_count ?? 0),
      };
    }
  }

  const { data: uniqueUsersData } = await supabase
    .from("app_ai_chat_log")
    .select("user_id")
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo);
  const uniqueUsers = new Set((uniqueUsersData ?? []).map((r) => r.user_id)).size;

  return {
    totalQueries,
    successfulQueries,
    errorQueries,
    blockedQueries,
    uniqueUsers,
    toolCalls,
    riskEvents,
    highRiskEvents,
    mostActiveAgent,
    mostActiveUser,
  };
}

export async function logAiQueryAuditAccess(input: {
  actorUserId: string;
  actorName: string;
  action: string;
  targetChatLogId?: string;
  detail?: string;
  ipAddress?: string;
}) {
  if (!isSupabaseConfigured()) return;
  await serviceClient().from("ai_query_access_log").insert({
    id: auditNewId("aql"),
    actor_user_id: input.actorUserId,
    actor_name: input.actorName,
    action: input.action,
    target_chat_log_id: input.targetChatLogId ?? "",
    detail: input.detail ?? "",
    ip_address: input.ipAddress ?? "",
  });
}

export async function runAiQueryMetaRetentionJob(): Promise<RetentionJobRun> {
  const id = auditNewId("rjr");
  const startedAt = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    return {
      id,
      recordType: "ai_query_meta",
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
    record_type: "ai_query_meta",
    started_at: startedAt,
    status: "running",
  });
  try {
    const { data: policy } = await supabase
      .from("retention_policy")
      .select("retention_days")
      .eq("record_type", "ai_query_meta")
      .eq("active", true)
      .maybeSingle();
    const days = Number(policy?.retention_days ?? 90);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const recordsDeleted = await archiveAndDeleteBeforeCutoff({
      supabase,
      table: "app_ai_chat_log",
      recordType: "ai_query_meta",
      dateColumn: "created_at",
      cutoff,
      extraDelete: async (ids) => {
        await supabase.from("ai_query_audit_meta").delete().in("chat_log_id", ids);
      },
    });
    const completedAt = new Date().toISOString();
    const durationMs = Date.parse(completedAt) - Date.parse(startedAt);
    await supabase
      .from("retention_job_run")
      .update({
        completed_at: completedAt,
        records_deleted: recordsDeleted,
        duration_ms: durationMs,
        status: "completed",
      })
      .eq("id", id);
    return {
      id,
      recordType: "ai_query_meta",
      startedAt,
      completedAt,
      recordsDeleted,
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

/** @deprecated Use runAiQueryMetaRetentionJob */
export async function runAiQueryMetaRetention(): Promise<number> {
  const run = await runAiQueryMetaRetentionJob();
  return run.recordsDeleted;
}
