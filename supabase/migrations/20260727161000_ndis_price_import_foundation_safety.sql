-- AB-0011 safety follow-up.
-- Existing tenants may already have duplicate product support item mappings while the importer is introduced.
-- Keep lookup performance without blocking migration/application; importer validation will surface duplicates.

drop index if exists public.product_ndis_support_item_unique_idx;

create index if not exists product_ndis_support_item_nonempty_idx
  on public.product (ndis_support_item)
  where ndis_support_item <> '';
