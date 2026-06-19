import type { SupabaseClient } from "@supabase/supabase-js";
import { auditNewId } from "@/lib/audit-monitoring/shared";

const DEFAULT_BATCH = 5000;

export async function archiveRows(
  supabase: SupabaseClient,
  recordType: string,
  rows: Record<string, unknown>[]
): Promise<number> {
  if (!rows.length) return 0;
  const archives = rows.map((row) => ({
    id: auditNewId("aa"),
    record_type: recordType,
    source_id: String(row.id ?? row.chat_log_id ?? ""),
    payload: row,
  }));
  const { error } = await supabase.from("audit_archive").insert(archives);
  if (error) throw error;
  return archives.length;
}

/** Delete rows older than cutoff in batches; archive each batch first. */
export async function archiveAndDeleteBeforeCutoff(input: {
  supabase: SupabaseClient;
  table: string;
  recordType: string;
  dateColumn: string;
  idColumn?: string;
  cutoff: string;
  batchSize?: number;
  extraDelete?: (ids: string[]) => Promise<void>;
}): Promise<number> {
  const batchSize = input.batchSize ?? DEFAULT_BATCH;
  const idColumn = input.idColumn ?? "id";
  let totalDeleted = 0;

  for (;;) {
    const { data: batch, error } = await input.supabase
      .from(input.table)
      .select("*")
      .lt(input.dateColumn, input.cutoff)
      .order(input.dateColumn, { ascending: true })
      .limit(batchSize);
    if (error) throw error;
    if (!batch?.length) break;

    await archiveRows(input.supabase, input.recordType, batch as Record<string, unknown>[]);
    const ids = batch.map((r) => String((r as Record<string, unknown>)[idColumn]));
    if (input.extraDelete) await input.extraDelete(ids);
    const { error: delErr } = await input.supabase.from(input.table).delete().in(idColumn, ids);
    if (delErr) throw delErr;
    totalDeleted += ids.length;
    if (batch.length < batchSize) break;
  }

  return totalDeleted;
}
