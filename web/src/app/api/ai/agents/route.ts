import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { fetchAgents } from "@/lib/ai/agents-api";
import { SEED_AGENTS } from "@/lib/ai/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isAiConfigured } from "@/lib/ai/runtime";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let agents = SEED_AGENTS;
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      if (supabase) {
        const dbAgents = await fetchAgents(supabase);
        if (dbAgents.length) agents = dbAgents;
      }
    } catch {
      // use seed agents
    }
  }

  const allowed = agents.filter((a) => a.active && session.agentIds.includes(a.id));

  return NextResponse.json({
    agents: allowed.map((a) => ({
      id: a.id,
      agentKey: a.agentKey,
      name: a.name,
      description: a.description,
    })),
    configured: isAiConfigured(),
  });
}
