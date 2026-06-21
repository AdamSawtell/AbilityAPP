import { initialClients, normalizeClient, type ClientRecord } from "@/lib/client";
import { pullPlanFromNdisGateway, type NdisPlanPullResponse } from "@/lib/integrations/ndis-plan-gateway";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { clientFromRow, type ClientRow } from "@/lib/supabase/mappers";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function loadClientById(clientId: string): Promise<ClientRecord | null> {
  if (!isSupabaseConfigured()) {
    return initialClients.find((client) => client.id === clientId) ?? null;
  }

  const supabase = serviceClient();
  const { data: row } = await supabase.from("client").select("*").eq("id", clientId).maybeSingle();
  if (!row) {
    return initialClients.find((client) => client.id === clientId) ?? null;
  }

  return normalizeClient(clientFromRow(row as ClientRow, [], [], []));
}

export async function syncClientPlanFromGateway(
  clientId: string,
  options?: { fundingBodyNumber?: string }
): Promise<{
  client: ClientRecord;
  result: NdisPlanPullResponse;
}> {
  const client = await loadClientById(clientId);
  if (!client) {
    throw new Error("Client not found.");
  }

  const draftNdis = options?.fundingBodyNumber?.trim();
  const clientForPull =
    draftNdis && draftNdis !== (client.fundingBodyNumber?.trim() ?? "")
      ? { ...client, fundingBodyNumber: draftNdis }
      : client;

  const result = await pullPlanFromNdisGateway(clientForPull);
  return { client: clientForPull, result };
}
