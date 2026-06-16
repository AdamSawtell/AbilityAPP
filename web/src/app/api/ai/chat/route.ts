import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { fetchAgents } from "@/lib/ai/agents-api";
import { runChatTurn, isAiConfigured } from "@/lib/ai/runtime";
import { SEED_AGENTS } from "@/lib/ai/seed";
import type { ChatMessage, ChatRequestBody, ChatThreadState } from "@/lib/ai/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m === "object")
    .map((m) => {
      const row = m as Record<string, unknown>;
      const role = row.role;
      if (role !== "user" && role !== "assistant") return null;
      const content = String(row.content ?? "").trim();
      if (!content) return null;
      return { role, content } as ChatMessage;
    })
    .filter(Boolean) as ChatMessage[];
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI chat is not configured. Set OPENAI_API_KEY in Amplify environment variables (or .env.local for development).",
      },
      { status: 503 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const agentId = body.agentId?.trim() ?? "";
  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }
  if (!session.agentIds.includes(agentId)) {
    return NextResponse.json({ error: "You do not have access to this assistant" }, { status: 403 });
  }

  const messages = sanitizeMessages(body.messages);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "At least one user message is required" }, { status: 400 });
  }

  let agents = SEED_AGENTS;
  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  if (supabase) {
    try {
      const dbAgents = await fetchAgents(supabase);
      if (dbAgents.length) agents = dbAgents;
    } catch {
      // seed fallback
    }
  }

  const agent = agents.find((a) => a.id === agentId && a.active);
  if (!agent) {
    return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  }

  const threadState: ChatThreadState = body.threadState ?? {};

  try {
    const result = await runChatTurn({
      agent,
      session,
      messages,
      threadState,
      supabase,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI chat failed", err);
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
