import type { SupabaseClient } from "@supabase/supabase-js";
import { auditNewId, maxSeverity } from "@/lib/audit-monitoring/shared";
import { HIGH_PRIVILEGE_PROCESS_IDS } from "@/lib/process-audit/constants";
import { SENSITIVE_QUERY_PATTERNS } from "@/lib/ai-query-audit/constants";
import type { ProcessOutcome } from "@/lib/process-audit/types";
import { serviceClient } from "@/lib/session-audit/server";
import { HIGH_PRIVILEGE_ROLE_IDS, DEFAULT_TIMEZONE } from "@/lib/session-audit/constants";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { RiskSeverity } from "@/lib/session-audit/types";

export type RiskQueueType = "session" | "process" | "ai_query";

export type ProcessRiskPayload = {
  processId: string;
  outcome: ProcessOutcome;
  userId: string;
  startedAt: string;
};

export type SessionRiskPayload = {
  sessionId: string;
  userId: string;
  roleId: string;
  ipAddress: string;
  loginResult: string;
  loginAt: string;
};

export type AiQueryRiskPayload = {
  chatLogId: string;
  userId: string;
  userMessage: string;
  createdAt: string;
};

export async function enqueueRiskAssessment(
  auditType: RiskQueueType,
  targetId: string,
  payload: ProcessRiskPayload | SessionRiskPayload | AiQueryRiskPayload
) {
  if (!isSupabaseConfigured()) return;
  const supabase = serviceClient();
  await supabase.from("audit_risk_queue").insert({
    id: auditNewId("arq"),
    audit_type: auditType,
    target_id: targetId,
    payload,
    status: "pending",
  });
}

async function appendProcessRisk(
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

async function processProcessRisk(supabase: SupabaseClient, targetId: string, payload: ProcessRiskPayload) {
  const { processId, outcome, userId, startedAt } = payload;
  if (outcome === "denied") {
    await appendProcessRisk(supabase, targetId, "denied_execution", "Process denied", "medium", processId);
  }
  if (HIGH_PRIVILEGE_PROCESS_IDS.has(processId)) {
    await appendProcessRisk(supabase, targetId, "high_privilege_process", "High privilege process", "medium", processId);
  }
  const hour = new Date(startedAt).getUTCHours();
  if (hour < 7 || hour >= 19) {
    await appendProcessRisk(supabase, targetId, "after_hours", "Process outside business hours", "low", startedAt);
  }
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("process_audit")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("process_id", processId)
    .gte("started_at", since)
    .neq("id", targetId);
  if ((count ?? 0) >= 10) {
    await appendProcessRisk(
      supabase,
      targetId,
      "high_volume",
      "High process volume",
      "high",
      `${(count ?? 0) + 1} in 5 minutes`
    );
  }
}

async function appendSessionRisk(
  supabase: SupabaseClient,
  sessionId: string,
  code: string,
  label: string,
  severity: RiskSeverity,
  detail: string
) {
  await supabase.from("user_session_risk").insert({
    id: auditNewId("usr"),
    session_id: sessionId,
    indicator_code: code,
    indicator_label: label,
    severity,
    detail,
  });
  const { data } = await supabase.from("user_session").select("risk_level").eq("id", sessionId).maybeSingle();
  const current = (data?.risk_level as RiskSeverity | "none") ?? "none";
  const next = maxSeverity(current, severity);
  if (next !== current) {
    await supabase.from("user_session").update({ risk_level: next, updated_at: new Date().toISOString() }).eq("id", sessionId);
  }
}

async function processSessionRisk(supabase: SupabaseClient, targetId: string, payload: SessionRiskPayload) {
  const { sessionId, userId, roleId, ipAddress, loginResult, loginAt } = payload;
  if (loginResult === "failed") {
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("user_session")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("login_result", "failed")
      .gte("login_at", since);
    if ((count ?? 0) >= 3) {
      await appendSessionRisk(supabase, sessionId, "multiple_failed_logins", "Multiple failed login attempts", "high", `${count} failures in 15 minutes`);
    }
    return;
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
    await appendSessionRisk(supabase, sessionId, "unusual_ip", "Login from new IP address", "medium", ipAddress);
  }

  const { data: tzRow } = await supabase.from("system_setting").select("value").eq("key", "timezone").maybeSingle();
  const tz = String(tzRow?.value ?? DEFAULT_TIMEZONE);
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date(loginAt))
  );
  const { data: startRow } = await supabase.from("system_setting").select("value").eq("key", "business_hours_start").maybeSingle();
  const { data: endRow } = await supabase.from("system_setting").select("value").eq("key", "business_hours_end").maybeSingle();
  const startH = Number(String(startRow?.value ?? "07:00").slice(0, 2));
  const endH = Number(String(endRow?.value ?? "19:00").slice(0, 2));
  if (hour < startH || hour >= endH) {
    await appendSessionRisk(supabase, sessionId, "after_hours", "Login outside business hours", "low", `Login at ${hour}:00 ${tz}`);
  }

  if (HIGH_PRIVILEGE_ROLE_IDS.has(roleId)) {
    await appendSessionRisk(supabase, sessionId, "high_privilege", "High privilege account login", "medium", roleId);
  }
  void targetId;
}

async function appendAiQueryRisk(
  supabase: SupabaseClient,
  chatLogId: string,
  code: string,
  label: string,
  severity: RiskSeverity,
  detail: string
) {
  await supabase.from("ai_query_risk").insert({
    id: auditNewId("aqr"),
    chat_log_id: chatLogId,
    indicator_code: code,
    indicator_label: label,
    severity,
    detail,
  });
  const { data } = await supabase.from("ai_query_audit_meta").select("risk_level").eq("chat_log_id", chatLogId).maybeSingle();
  const current = (data?.risk_level as RiskSeverity | "none") ?? "none";
  const next = maxSeverity(current, severity);
  if (next !== current) {
    await supabase.from("ai_query_audit_meta").update({ risk_level: next, updated_at: new Date().toISOString() }).eq("chat_log_id", chatLogId);
  }
}

async function processAiQueryRisk(supabase: SupabaseClient, targetId: string, payload: AiQueryRiskPayload) {
  const { chatLogId, userId, userMessage, createdAt } = payload;
  if (SENSITIVE_QUERY_PATTERNS.some((p) => p.test(userMessage))) {
    await appendAiQueryRisk(supabase, chatLogId, "sensitive_content", "Sensitive content in query", "high", userMessage.slice(0, 120));
  }
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("app_ai_chat_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= 20) {
    await appendAiQueryRisk(supabase, chatLogId, "high_volume", "High AI query volume", "medium", `${count} queries in 10 minutes`);
  }
  const hour = new Date(createdAt).getUTCHours();
  if (hour < 7 || hour >= 19) {
    await appendAiQueryRisk(supabase, chatLogId, "after_hours", "AI query outside business hours", "low", createdAt);
  }
  void targetId;
}

export async function processRiskQueueBatch(limit = 100): Promise<{ processed: number; failed: number }> {
  if (!isSupabaseConfigured()) return { processed: 0, failed: 0 };
  const supabase = serviceClient();
  const { data: pending } = await supabase
    .from("audit_risk_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  let processed = 0;
  let failed = 0;

  for (const row of pending ?? []) {
    const id = String(row.id);
    await supabase.from("audit_risk_queue").update({ status: "processing", attempts: Number(row.attempts ?? 0) + 1 }).eq("id", id);
    try {
      const auditType = String(row.audit_type) as RiskQueueType;
      const payload = row.payload as ProcessRiskPayload | SessionRiskPayload | AiQueryRiskPayload;
      const targetId = String(row.target_id);
      if (auditType === "process") await processProcessRisk(supabase, targetId, payload as ProcessRiskPayload);
      else if (auditType === "session") await processSessionRisk(supabase, targetId, payload as SessionRiskPayload);
      else await processAiQueryRisk(supabase, targetId, payload as AiQueryRiskPayload);

      await supabase
        .from("audit_risk_queue")
        .update({ status: "completed", processed_at: new Date().toISOString(), last_error: "" })
        .eq("id", id);
      processed += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Risk processing failed";
      await supabase
        .from("audit_risk_queue")
        .update({ status: "failed", processed_at: new Date().toISOString(), last_error: message })
        .eq("id", id);
    }
  }

  return { processed, failed };
}
