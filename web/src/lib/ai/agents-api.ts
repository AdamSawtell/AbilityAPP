import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiAgentRecord } from "@/lib/ai/types";

type AgentRow = {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  active: boolean;
};

type CapabilityRow = {
  agent_id: string;
  capability_type: string;
  capability_key: string;
};

function agentFromRow(row: AgentRow, capabilities: CapabilityRow[]): AiAgentRecord {
  return {
    id: row.id,
    agentKey: row.agent_key,
    name: row.name,
    description: row.description,
    systemPrompt: row.system_prompt,
    model: row.model,
    active: row.active,
    capabilities: capabilities
      .filter((c) => c.agent_id === row.id)
      .map((c) => ({ type: c.capability_type, key: c.capability_key })),
  };
}

export async function fetchAgents(supabase: SupabaseClient): Promise<AiAgentRecord[]> {
  const [agentsRes, capsRes] = await Promise.all([
    supabase.from("app_ai_agent").select("*").order("name"),
    supabase.from("app_ai_agent_capability").select("agent_id, capability_type, capability_key"),
  ]);
  if (agentsRes.error?.code === "42P01") return [];
  if (agentsRes.error) throw agentsRes.error;
  if (capsRes.error?.code === "42P01") {
    return ((agentsRes.data ?? []) as AgentRow[]).map((row) => agentFromRow(row, []));
  }
  if (capsRes.error) throw capsRes.error;

  const caps = (capsRes.data ?? []) as CapabilityRow[];
  return ((agentsRes.data ?? []) as AgentRow[]).map((row) => agentFromRow(row, caps));
}

export async function resolveRoleAgentIds(supabase: SupabaseClient, roleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("app_role_agent")
    .select("agent_id")
    .eq("role_id", roleId);
  if (error?.code === "42P01") return [];
  if (error) throw error;
  return (data ?? []).map((r) => r.agent_id);
}

export async function fetchRoleAgentMap(supabase: SupabaseClient): Promise<Record<string, string[]>> {
  const { data, error } = await supabase.from("app_role_agent").select("role_id, agent_id");
  if (error?.code === "42P01") return {};
  if (error) throw error;
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const list = map[row.role_id] ?? [];
    list.push(row.agent_id);
    map[row.role_id] = list;
  }
  return map;
}

export async function saveAgent(supabase: SupabaseClient, agent: AiAgentRecord) {
  const { error } = await supabase.from("app_ai_agent").upsert({
    id: agent.id,
    agent_key: agent.agentKey,
    name: agent.name,
    description: agent.description,
    system_prompt: agent.systemPrompt,
    model: agent.model,
    active: agent.active,
  });
  if (error) throw error;

  await supabase.from("app_ai_agent_capability").delete().eq("agent_id", agent.id);
  if (agent.capabilities.length) {
    const { error: capError } = await supabase.from("app_ai_agent_capability").insert(
      agent.capabilities.map((c) => ({
        agent_id: agent.id,
        capability_type: c.type,
        capability_key: c.key,
      }))
    );
    if (capError) throw capError;
  }
}

export async function saveRoleAgents(supabase: SupabaseClient, roleId: string, agentIds: string[]) {
  const { error: delError } = await supabase.from("app_role_agent").delete().eq("role_id", roleId);
  if (delError?.code !== "42P01" && delError) throw delError;
  if (!agentIds.length) return;
  const { error } = await supabase.from("app_role_agent").insert(
    agentIds.map((agent_id) => ({ role_id: roleId, agent_id }))
  );
  if (error) throw error;
}

export async function deleteAgent(supabase: SupabaseClient, agentId: string) {
  const { error } = await supabase.from("app_ai_agent").delete().eq("id", agentId);
  if (error) throw error;
}

export async function logChatTurn(
  supabase: SupabaseClient,
  entry: {
    userId: string;
    roleId: string;
    agentId: string;
    userMessage: string;
    assistantMessage: string;
    toolCalls: unknown[];
  }
): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_ai_chat_log")
    .insert({
      user_id: entry.userId,
      role_id: entry.roleId,
      agent_id: entry.agentId,
      user_message: entry.userMessage,
      assistant_message: entry.assistantMessage,
      tool_calls: entry.toolCalls,
    })
    .select("id")
    .single();
  if (error?.code === "42P01") return null;
  if (error) {
    console.error("AI chat log failed", error);
    return null;
  }
  return data?.id ? String(data.id) : null;
}
