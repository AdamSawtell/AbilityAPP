-- AB-0011 — NDIS price-guide import foundation.
-- Adds effective-dated regional pricing metadata and auditable import batch history.

create table if not exists public.ndis_price_import_batch (
  id text primary key,
  source_file_name text not null default '',
  source_document text not null default '',
  guide_year text not null default '',
  format_type text not null default '',
  status text not null default 'draft',
  imported_by text not null default '',
  imported_at timestamptz,
  applied_at timestamptz,
  row_count integer not null default 0,
  add_count integer not null default 0,
  update_count integer not null default 0,
  unchanged_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  warning_count integer not null default 0,
  warnings_json jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ndis_price_import_row (
  id text primary key,
  batch_id text not null references public.ndis_price_import_batch (id) on delete cascade,
  row_no integer not null default 1,
  support_item_number text not null default '',
  action text not null default '',
  status text not null default '',
  message text not null default '',
  raw_json jsonb not null default '{}'::jsonb,
  normalized_json jsonb,
  matched_product_id text references public.product (id) on delete set null,
  matched_price_line_id text,
  row_hash text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product
  add column if not exists registration_group_number text not null default '',
  add column if not exists registration_group_name text not null default '',
  add column if not exists support_category_number text not null default '',
  add column if not exists support_category_name text not null default '',
  add column if not exists support_category_name_pace text not null default '',
  add column if not exists price_type text not null default '',
  add column if not exists claiming_flags jsonb not null default '{}'::jsonb,
  add column if not exists source_import_batch_id text references public.ndis_price_import_batch (id) on delete set null,
  add column if not exists end_dated_at date;

alter table public.price_list
  add column if not exists valid_to date,
  add column if not exists source text not null default '',
  add column if not exists source_import_batch_id text references public.ndis_price_import_batch (id) on delete set null,
  add column if not exists guide_year text not null default '',
  add column if not exists status text not null default 'active';

alter table public.price_list_line
  add column if not exists support_item_number text not null default '',
  add column if not exists region text not null default '',
  add column if not exists jurisdiction text not null default '',
  add column if not exists effective_start date,
  add column if not exists effective_end date,
  add column if not exists price_type text not null default '',
  add column if not exists quote_required boolean not null default false,
  add column if not exists no_specified_price boolean not null default false,
  add column if not exists source_import_batch_id text references public.ndis_price_import_batch (id) on delete set null,
  add column if not exists source_row_hash text not null default '';

create index if not exists ndis_price_import_row_batch_id_idx
  on public.ndis_price_import_row (batch_id);

create index if not exists ndis_price_import_row_support_item_idx
  on public.ndis_price_import_row (support_item_number);

create index if not exists product_ndis_support_item_idx
  on public.product (ndis_support_item);

create index if not exists price_list_line_support_item_date_region_idx
  on public.price_list_line (support_item_number, effective_start, effective_end, region);

create unique index if not exists price_list_line_source_row_unique_idx
  on public.price_list_line (price_list_id, source_row_hash)
  where source_row_hash <> '';

alter table public.ndis_price_import_batch enable row level security;
alter table public.ndis_price_import_row enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ndis_price_import_batch'
      and policyname = 'ndis_price_import_batch_all'
  ) then
    create policy ndis_price_import_batch_all
      on public.ndis_price_import_batch
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ndis_price_import_row'
      and policyname = 'ndis_price_import_row_all'
  ) then
    create policy ndis_price_import_row_all
      on public.ndis_price_import_row
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;
