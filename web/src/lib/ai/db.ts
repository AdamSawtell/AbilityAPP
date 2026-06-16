import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";

/**
 * Session-scoped database access for AI tools.
 * Uses the service role key server-side only; every call is tied to the signed-in
 * user/role and logged to app_ai_db_access_log. Tools must still enforce window/process checks.
 */
export type AiDatabase = {
  client: SupabaseClient;
  session: AuthSession;
  logAccess: (entry: { tool: string; action: string; target?: string }) => Promise<void>;
};

export function createAiDatabase(session: AuthSession): AiDatabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  const client = createClient(url, key, { auth: { persistSession: false } });

  return {
    client,
    session,
    async logAccess(entry) {
      try {
        await client.from("app_ai_db_access_log").insert({
          user_id: session.userId,
          role_id: session.activeRoleId,
          tool_name: entry.tool,
          action: entry.action,
          target: entry.target ?? "",
        });
      } catch {
        // non-blocking audit
      }
    },
  };
}
