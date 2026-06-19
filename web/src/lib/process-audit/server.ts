import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { processById } from "@/lib/access/catalog";
import { auditContextFromSession, auditNewId, maxSeverity } from "@/lib/audit-monitoring/shared";
import { HIGH_PRIVILEGE_PROCESS_IDS } from "@/lib/process-audit/constants";
import type {
  ProcessAuditFilters,
  ProcessAuditRecord,
  ProcessDashboardMetrics,
  ProcessInvestigationDetail,
  ProcessOutcome,
  ProcessStatus,
} from "@/lib/process-audit/types";
import { serviceClient } from "@/lib/session-audit/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { RiskSeverity, RiskStatus, RetentionJobRun } from "@/lib/session-audit/types";

function mapRow(row: Record<string, unknown>): ProcessAuditRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    userName: String(row.user_name ?? ""),
    roleId: String(row.role_id ?? ""),
    roleName: String(row.role_name ?? ""),
    sessionId: String(row.session_id ?? ""),
    processId: String(row.process_id),
    processLabel: String(row.process_label ?? ""),
    entityType: String(row.entity_type ?? ""),
    entityId: String(row.entity_id ?? ""),
    entityLabel: String(row.entity_label ?? ""),
    outcome: row.outcome as ProcessOutcome,
    status: row.status as ProcessStatus,
    ipAddress: String(row.ip_address ?? ""),
    browser: String(row.browser ?? ""),
    deviceInfo: String(row.device_info ?? ""),
    userAgent: String(row.user_agent ?? ""),
    detail: String(row.detail ?? ""),
    failureReason: String(row.failure_reason ?? ""),
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    riskLevel: (row.risk_level as ProcessAuditRecord["riskLevel"]) ?? "none",
    riskStatus: row.risk_status as RiskStatus,
    startedAt: String(row.started_at),
    completedAt: String(row.completed_at ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function appendRisk(
  supabase: SupabaseClient,
  auditId: string,
  code: string,
  label: string,
  severity: RiskSeverity,
  detail: string
) {
  await supabase.from("process_audit_risk").insert({
    id: auditNewId("par"),
    process_audit_id: auditId,
    indicator_code: code,
    indicator_label: label,
    severity,
    detail,
  });
  const { data } = await supabase.from("process_audit").select("risk_level").eq("id", auditId).maybeSingle();
  const current = (data?.risk_level as RiskSeverity | "none") ?? "none";
  const next = maxSeverity(current, severity);
  if (next !== current) {
    await supabase.from("process_audit").update({ risk_level: next, updated_at: new Date().toISOString() }).eq("id", auditId);
  }
}

async function bumpDailyStats(supabase: SupabaseClient, startedAt: string, patch: Record<string, number>) {
  const statDate = startedAt.slice(0, 10);
  const { data: existing } = await supabase.from("process_audit_daily_stats").select("*").eq("stat_date", statDate).maybeSingle();
  if (!existing) {
    await supabase.from("process_audit_daily_stats").insert({ stat_date: statDate, ...patch, updated_at: new Date().toISOString() });
    return;
  }
  const next: Record<string, number | string> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    next[k] = Number(existing[k as keyof typeof existing] ?? 0) + v;
  }
  await supabase.from("process_audit_daily_stats").update(next).eq("stat_date", statDate);
}

async function assessRisk(
  supabase: SupabaseClient,
  auditId: string,
  processId: string,
  outcome: ProcessOutcome,
  userId: string,
  startedAt: string
) {
  if (outcome === "denied") {
    await appendRisk(supabase, auditId, "denied_execution", "Process denied", "medium", processId);
  }
  if (HIGH_PRIVILEGE_PROCESS_IDS.has(processId)) {
    await appendRisk(supabase, auditId, "high_privilege_process", "High privilege process", "medium", processId);
  }
  const hour = new Date(startedAt).getUTCHours();
  if (hour < 7 || hour >= 19) {
    await appendRisk(supabase, auditId, "after_hours", "Process outside business hours", "low", startedAt);
  }
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("process_audit")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("process_id", processId)
    .gte("started_at", since)
    .neq("id", auditId);
  if ((count ?? 0) >= 10) {
    await appendRisk(supabase, auditId, "high_volume", "High process volume", "high", `${(count ?? 0) + 1} in 5 minutes`);
  }
}

export async function recordProcessExecution(input: {
  session: AuthSession;
  processId: string;
  outcome: ProcessOutcome;
  request?: Request;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  detail?: string;
  failureReason?: string;
  durationMs?: number;
  startedAt?: string;
}) {
  if (!isSupabaseConfigured()) return null;
  const supabase = serviceClient();
  const ctx = auditContextFromSession(input.session, input.request);
  const proc = processById(input.processId);
  const id = auditNewId("pa");
  const startedAt = input.startedAt ?? new Date().toISOString();
  const completedAt = new Date().toISOString();
  const status: ProcessStatus =
    input.outcome === "success" ? "completed" : input.outcome === "denied" ? "denied" : "failed";

  await supabase.from("process_audit").insert({
    id,
    user_id: ctx.userId,
    user_name: ctx.userName,
    role_id: ctx.roleId,
    role_name: ctx.roleName,
    session_id: ctx.sessionId,
    process_id: input.processId,
    process_label: proc?.label ?? input.processId,
    entity_type: input.entityType ?? "",
    entity_id: input.entityId ?? "",
    entity_label: input.entityLabel ?? "",
    outcome: input.outcome,
    status,
    ip_address: ctx.ipAddress,
    browser: ctx.browser,
    device_info: ctx.deviceInfo,
    user_agent: ctx.userAgent,
    detail: input.detail ?? "",
    failure_reason: input.failureReason ?? "",
    duration_ms: input.durationMs ?? null,
    started_at: startedAt,
    completed_at: completedAt,
    created_at: startedAt,
    updated_at: completedAt,
  });

  await supabase.from("process_audit_event").insert({
    id: auditNewId("pae"),
    process_audit_id: id,
    event_type: status,
    detail: input.detail ?? proc?.label ?? input.processId,
  });

  const statsPatch: Record<string, number> = { total_executions: 1 };
  if (input.outcome === "success") statsPatch.successful_executions = 1;
  else if (input.outcome === "denied") statsPatch.denied_executions = 1;
  else statsPatch.failed_executions = 1;
  await bumpDailyStats(supabase, startedAt, statsPatch);
  await assessRisk(supabase, id, input.processId, input.outcome, ctx.userId, startedAt);
  return id;
}

export async function listProcessAudits(filters: ProcessAuditFilters) {
  if (!isSupabaseConfigured()) return { records: [], total: 0 };
  const supabase = serviceClient();
  let query = supabase.from("process_audit").select("*", { count: "exact" }).order("started_at", { ascending: false });
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.roleId) query = query.eq("role_id", filters.roleId);
  if (filters.processId) query = query.eq("process_id", filters.processId);
  if (filters.dateFrom) query = query.gte("started_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("started_at", filters.dateTo);
  if (filters.outcome) query = query.eq("outcome", filters.outcome);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.riskLevel && filters.riskLevel !== "none") query = query.eq("risk_level", filters.riskLevel);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.search?.trim()) {
    const s = `%${filters.search.trim()}%`;
    query = query.or(`user_name.ilike.${s},process_label.ilike.${s},entity_label.ilike.${s},detail.ilike.${s}`);
  }
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 50;
  query = query.range(offset, offset + limit - 1);
  const { data, count, error } = await query;
  if (error) throw error;
  return { records: (data ?? []).map(mapRow), total: count ?? 0 };
}

export async function getProcessAuditDetail(id: string): Promise<ProcessInvestigationDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = serviceClient();
  const { data: row } = await supabase.from("process_audit").select("*").eq("id", id).maybeSingle();
  if (!row) return null;
  const [events, risks, notes] = await Promise.all([
    supabase.from("process_audit_event").select("*").eq("process_audit_id", id).order("created_at"),
    supabase.from("process_audit_risk").select("*").eq("process_audit_id", id).order("created_at"),
    supabase.from("process_audit_risk_note").select("*").eq("process_audit_id", id).order("created_at"),
  ]);
  return {
    record: mapRow(row),
    events: (events.data ?? []).map((e) => ({
      id: String(e.id),
      eventType: String(e.event_type),
      detail: String(e.detail ?? ""),
      createdAt: String(e.created_at),
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

export async function addProcessRiskNote(id: string, note: string, authorUserId: string, authorName: string) {
  if (!isSupabaseConfigured()) return;
  await serviceClient().from("process_audit_risk_note").insert({
    id: auditNewId("pan"),
    process_audit_id: id,
    note,
    author_user_id: authorUserId,
    author_name: authorName,
  });
}

export async function updateProcessRiskStatus(id: string, riskStatus: RiskStatus) {
  if (!isSupabaseConfigured()) return;
  await serviceClient()
    .from("process_audit")
    .update({ risk_status: riskStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function getProcessDashboardMetrics(dateFrom: string, dateTo: string): Promise<ProcessDashboardMetrics> {
  if (!isSupabaseConfigured()) {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      deniedExecutions: 0,
      uniqueUsers: 0,
      riskEvents: 0,
      highRiskEvents: 0,
      mostActiveProcess: null,
      mostActiveUser: null,
    };
  }
  const supabase = serviceClient();
  const { data: statsRows } = await supabase
    .from("process_audit_daily_stats")
    .select("*")
    .gte("stat_date", dateFrom.slice(0, 10))
    .lte("stat_date", dateTo.slice(0, 10));

  let totalExecutions = 0;
  let successfulExecutions = 0;
  let failedExecutions = 0;
  let deniedExecutions = 0;
  let riskEvents = 0;
  let highRiskEvents = 0;
  let mostActiveProcess: ProcessDashboardMetrics["mostActiveProcess"] = null;
  let mostActiveUser: ProcessDashboardMetrics["mostActiveUser"] = null;

  for (const row of statsRows ?? []) {
    totalExecutions += Number(row.total_executions ?? 0);
    successfulExecutions += Number(row.successful_executions ?? 0);
    failedExecutions += Number(row.failed_executions ?? 0);
    deniedExecutions += Number(row.denied_executions ?? 0);
    riskEvents += Number(row.risk_events ?? 0);
    highRiskEvents += Number(row.high_risk_events ?? 0);
    if (Number(row.most_active_process_count ?? 0) > (mostActiveProcess?.count ?? 0)) {
      mostActiveProcess = {
        processId: String(row.most_active_process_id ?? ""),
        processLabel: String(row.most_active_process_label ?? ""),
        count: Number(row.most_active_process_count ?? 0),
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
    .from("process_audit")
    .select("user_id")
    .gte("started_at", dateFrom)
    .lte("started_at", dateTo);
  const uniqueUsers = new Set((uniqueUsersData ?? []).map((r) => r.user_id)).size;

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    deniedExecutions,
    uniqueUsers,
    riskEvents,
    highRiskEvents,
    mostActiveProcess,
    mostActiveUser,
  };
}

export async function logProcessAuditAccess(input: {
  actorUserId: string;
  actorName: string;
  action: string;
  targetProcessAuditId?: string;
  detail?: string;
  ipAddress?: string;
}) {
  if (!isSupabaseConfigured()) return;
  await serviceClient().from("process_audit_access_log").insert({
    id: auditNewId("pal"),
    actor_user_id: input.actorUserId,
    actor_name: input.actorName,
    action: input.action,
    target_process_audit_id: input.targetProcessAuditId ?? "",
    detail: input.detail ?? "",
    ip_address: input.ipAddress ?? "",
  });
}

export async function runProcessRetentionJob(): Promise<RetentionJobRun> {
  const id = auditNewId("rjr");
  const startedAt = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    return {
      id,
      recordType: "process_audit",
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
    record_type: "process_audit",
    started_at: startedAt,
    status: "running",
  });
  try {
    const { data: policy } = await supabase
      .from("retention_policy")
      .select("retention_days")
      .eq("record_type", "process_audit")
      .eq("active", true)
      .maybeSingle();
    const days = Number(policy?.retention_days ?? 90);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const { data: old } = await supabase.from("process_audit").select("id").lt("started_at", cutoff);
    const ids = (old ?? []).map((r) => r.id);
    if (ids.length) await supabase.from("process_audit").delete().in("id", ids);
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
      recordType: "process_audit",
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

/** @deprecated Use runProcessRetentionJob */
export async function runProcessRetention(): Promise<number> {
  const run = await runProcessRetentionJob();
  return run.recordsDeleted;
}
