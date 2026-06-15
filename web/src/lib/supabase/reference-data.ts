import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferenceDataCatalog } from "@/lib/reference-data";

export async function fetchReferenceCatalog(
  supabase: SupabaseClient
): Promise<ReferenceDataCatalog> {
  const { data: lists, error: listError } = await supabase
    .from("reference_list")
    .select("id, key")
    .order("sort_order");

  if (listError) throw listError;
  if (!lists?.length) return {};

  const keyById = new Map(lists.map((l) => [l.id, l.key]));
  const listIds = lists.map((l) => l.id);

  const { data: options, error: optionError } = await supabase
    .from("reference_option")
    .select("list_id, value, sort_order")
    .in("list_id", listIds)
    .eq("active", true)
    .order("sort_order");

  if (optionError) throw optionError;

  const catalog: ReferenceDataCatalog = {};
  for (const list of lists) {
    catalog[list.key] = [];
  }

  for (const row of options ?? []) {
    const key = keyById.get(row.list_id);
    if (!key) continue;
    catalog[key].push(row.value);
  }

  return catalog;
}

export async function replaceReferenceOptions(
  supabase: SupabaseClient,
  key: string,
  options: string[]
) {
  const { data: list, error: listError } = await supabase
    .from("reference_list")
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (listError) throw listError;
  if (!list) throw new Error(`Unknown reference list: ${key}`);

  const { error: deleteError } = await supabase
    .from("reference_option")
    .delete()
    .eq("list_id", list.id);

  if (deleteError) throw deleteError;

  const trimmed = options.map((o) => o.trim()).filter(Boolean);
  if (!trimmed.length) return;

  const { error: insertError } = await supabase.from("reference_option").insert(
    trimmed.map((value, sort_order) => ({
      list_id: list.id,
      value,
      label: value,
      sort_order,
      active: true,
    }))
  );

  if (insertError) throw insertError;
}
