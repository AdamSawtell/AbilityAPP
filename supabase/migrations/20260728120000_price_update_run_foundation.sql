-- AB-0012 — Price Dependant Updater foundation.
-- Stores impact analysis runs and row-level decisions from AB-0011 import batches.

create table if not exists public.price_update_run (
  id text primary key,
  source_import_batch_id text not null references public.ndis_price_import_batch (id) on delete restrict,
  status text not null default 'draft',
  effective_start date,
  guide_year text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  applied_by text not null default '',
  applied_at timestamptz,
  closed_by text not null default '',
  closed_at timestamptz,
  scanned_count integer not null default 0,
  impact_count integer not null default 0,
  safe_count integer not null default 0,
  review_count integer not null default 0,
  consent_count integer not null default 0,
  protected_count integer not null default 0,
  blocked_count integer not null default 0,
  applied_count integer not null default 0,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.price_update_impact (
  id text primary key,
  run_id text not null references public.price_update_run (id) on delete cascade,
  entity_type text not null default '',
  entity_id text not null default '',
  entity_line_id text not null default '',
  client_id text not null default '',
  client_name text not null default '',
  product_id text not null default '',
  support_item_number text not null default '',
  region text not null default '',
  record_label text not null default '',
  record_status text not null default '',
  old_price numeric,
  new_price numeric,
  delta_amount numeric,
  delta_percent numeric,
  effective_start date,
  classification text not null default '',
  recommended_action text not null default '',
  decision text not null default 'pending',
  decision_reason text not null default '',
  approved_by text not null default '',
  approved_at timestamptz,
  evidence_ref text not null default '',
  apply_status text not null default 'pending',
  apply_message text not null default '',
  task_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists price_update_run_batch_idx on public.price_update_run (source_import_batch_id);
create index if not exists price_update_impact_run_id_idx on public.price_update_impact (run_id);
create index if not exists price_update_impact_entity_idx on public.price_update_impact (entity_type, entity_id);

alter table public.price_update_run enable row level security;
alter table public.price_update_impact enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'price_update_run' and policyname = 'price_update_run_all'
  ) then
    create policy price_update_run_all on public.price_update_run for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'price_update_impact' and policyname = 'price_update_impact_all'
  ) then
    create policy price_update_impact_all on public.price_update_impact for all to anon, authenticated using (true) with check (true);
  end if;
end $$;
