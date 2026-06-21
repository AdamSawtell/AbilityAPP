import { createEnquiry, emptyEnquiry, initialRecords, normalizeEnquiry, type EnquiryRecord } from "@/lib/enquiry";
import {
  enquiryAfterHubSpotSync,
  syncEnquiryToHubSpot,
  type HubSpotSyncResponse,
} from "@/lib/integrations/hubspot-crm";
import {
  mapWebToLeadBody,
  validateWebToLeadPayload,
  webToLeadToEnquiryPartial,
  type WebToLeadPayload,
} from "@/lib/integrations/web-to-lead";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveEnquiry } from "@/lib/supabase/data-api";
import { enquiryFromRow, enquiryToRow, type EnquiryRow } from "@/lib/supabase/mappers";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
  // eslint-disable-next-line no-var
  var __webToLeadEnquiries: EnquiryRecord[] | undefined;
}

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function localEnquiries(): EnquiryRecord[] {
  if (!globalThis.__webToLeadEnquiries) {
    globalThis.__webToLeadEnquiries = [...initialRecords];
  }
  return globalThis.__webToLeadEnquiries;
}

async function loadAllEnquiries(): Promise<EnquiryRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase.from("enquiry").select("*").order("id");
    return (data ?? []).map((row) => enquiryFromRow(row as EnquiryRow));
  }
  return localEnquiries();
}

async function loadEnquiryById(id: string): Promise<EnquiryRecord | null> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: row } = await supabase.from("enquiry").select("*").eq("id", id).maybeSingle();
    if (!row) return localEnquiries().find((e) => e.id === id) ?? null;
    const { data: activityRows } = await supabase
      .from("enquiry_activity")
      .select("*")
      .eq("enquiry_id", id)
      .order("line_no");
    return enquiryFromRow(row as EnquiryRow, activityRows ?? []);
  }
  return localEnquiries().find((e) => e.id === id) ?? null;
}

async function persistEnquiry(record: EnquiryRecord): Promise<EnquiryRecord> {
  const normalized = normalizeEnquiry(record);
  if (isSupabaseConfigured()) {
    await saveEnquiry(serviceClient(), normalized);
    return normalized;
  }
  const list = localEnquiries();
  const index = list.findIndex((e) => e.id === normalized.id);
  if (index >= 0) list[index] = normalized;
  else list.unshift(normalized);
  return normalized;
}

async function insertEnquiryWithRetry(partial: Partial<EnquiryRecord>): Promise<EnquiryRecord> {
  if (!isSupabaseConfigured()) {
    const existing = await loadAllEnquiries();
    return persistEnquiry(
      normalizeEnquiry(createEnquiry({ ...emptyEnquiry(), ...partial }, existing))
    );
  }

  const supabase = serviceClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await loadAllEnquiries();
    const created = normalizeEnquiry(
      createEnquiry({ ...emptyEnquiry(), ...partial }, existing)
    );
    const { error } = await supabase.from("enquiry").insert(enquiryToRow(created));
    if (!error) {
      if (created.activity.length) {
        const { error: activityError } = await supabase.from("enquiry_activity").insert(
          created.activity.map((a) => ({
            id: a.id,
            enquiry_id: created.id,
            line_no: a.lineNo,
            activity_date: a.date || null,
            activity_type: a.activityType,
            subject: a.subject,
            description: a.description,
            created_by: a.createdBy,
          }))
        );
        if (activityError) throw activityError;
      }
      return created;
    }
    if (error.code !== "23505") throw error;
  }

  throw new Error("Could not allocate a unique enquiry id. Try again.");
}

export async function createEnquiryFromWebLead(body: Record<string, unknown>): Promise<EnquiryRecord> {
  const payload: WebToLeadPayload = mapWebToLeadBody(body);
  const validationError = validateWebToLeadPayload(payload);
  if (validationError) throw new Error(validationError);

  return insertEnquiryWithRetry(webToLeadToEnquiryPartial(payload));
}

export async function syncEnquiryToExternalCrm(
  enquiryId: string,
  actorName: string
): Promise<{ enquiry: EnquiryRecord; result: HubSpotSyncResponse }> {
  const enquiry = await loadEnquiryById(enquiryId);
  if (!enquiry) throw new Error("Enquiry not found.");

  const result = await syncEnquiryToHubSpot(enquiry);
  if (!result.ok) throw new Error(result.message);

  const updated = await persistEnquiry(enquiryAfterHubSpotSync(enquiry, result, actorName));
  return { enquiry: updated, result };
}
