import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import { fetchRoles } from "@/lib/supabase/access-api";
import {
  deleteAgent,
  fetchAgents,
  fetchRoleAgentMap,
  saveAgent,
  saveRoleAgents,
} from "@/lib/ai/agents-api";
import { AI_MODEL_OPTIONS, AI_TOOL_CATALOG } from "@/lib/ai/catalog";
import { SEED_AGENTS, SEED_ROLE_AGENTS } from "@/lib/ai/seed";
import type { AiAgentRecord } from "@/lib/ai/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function canManageAi(session: NonNullable<Awaited<ReturnType<typeof getAuthSessionFromRequest>>>) {
  return sessionHasWindow(session, "admin-ai-agents") || sessionHasWindow(session, "admin-roles");
}

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAi(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  let agents = SEED_AGENTS;
  let roleAgents: Record<string, string[]> = { ...SEED_ROLE_AGENTS };
  let roles: Awaited<ReturnType<typeof fetchRoles>> = [];

  if (supabase) {
    try {
      const [dbAgents, map, dbRoles] = await Promise.all([
        fetchAgents(supabase),
        fetchRoleAgentMap(supabase),
        fetchRoles(supabase),
      ]);
      if (dbAgents.length) agents = dbAgents;
      if (Object.keys(map).length) roleAgents = map;
      roles = dbRoles;
    } catch (err) {
      console.error("AI agents GET failed", err);
      return NextResponse.json({ error: "Could not load AI agents" }, { status: 500 });
    }
  }

  return NextResponse.json({
    agents,
    roleAgents,
    roles: roles.map((r) => ({ id: r.id, name: r.name, active: r.active })),
    tools: AI_TOOL_CATALOG,
    models: AI_MODEL_OPTIONS,
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
}

type SaveAgentBody = { action: "save-agent"; agent: AiAgentRecord };
type SaveRoleAgentsBody = { action: "save-role-agents"; roleId: string; agentIds: string[] };
type SeedDefaultsBody = { action: "seed-defaults" };
type DeleteAgentBody = { action: "delete-agent"; agentId: string };

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAi(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is required to save AI agents." }, { status: 503 });
  }

  let body: SaveAgentBody | SaveRoleAgentsBody | SeedDefaultsBody | DeleteAgentBody;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    if (body.action === "save-agent") {
      const agent = body.agent;
      if (!agent?.id?.trim() || !agent.agentKey?.trim() || !agent.name?.trim()) {
        return NextResponse.json({ error: "Agent id, key, and name are required" }, { status: 400 });
      }
      await saveAgent(supabase, {
        ...agent,
        capabilities: agent.capabilities?.length
          ? agent.capabilities
          : [{ type: "tool", key: "help_search" }],
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "save-role-agents") {
      if (!body.roleId?.trim()) {
        return NextResponse.json({ error: "roleId is required" }, { status: 400 });
      }
      await saveRoleAgents(supabase, body.roleId, body.agentIds ?? []);
      return NextResponse.json({ ok: true, note: "Users must sign out and back in for assistant access to update." });
    }

    if (body.action === "seed-defaults") {
      for (const agent of SEED_AGENTS) {
        await saveAgent(supabase, agent);
      }
      for (const [roleId, agentIds] of Object.entries(SEED_ROLE_AGENTS)) {
        await saveRoleAgents(supabase, roleId, agentIds);
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete-agent") {
      if (!body.agentId?.trim()) {
        return NextResponse.json({ error: "agentId is required" }, { status: 400 });
      }
      await deleteAgent(supabase, body.agentId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("AI agents POST failed", err);
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
