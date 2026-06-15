-- Reference lists and options (configurable dropdowns across the app)

create table if not exists public.reference_list (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  "group" text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_option (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.reference_list (id) on delete cascade,
  value text not null,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, value)
);

create index if not exists reference_option_list_id_idx on public.reference_option (list_id);
create index if not exists reference_option_active_idx on public.reference_option (list_id, active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reference_list_updated_at on public.reference_list;
create trigger reference_list_updated_at
  before update on public.reference_list
  for each row execute function public.set_updated_at();

drop trigger if exists reference_option_updated_at on public.reference_option;
create trigger reference_option_updated_at
  before update on public.reference_option
  for each row execute function public.set_updated_at();

alter table public.reference_list enable row level security;
alter table public.reference_option enable row level security;

-- MVP: open read/write for reference data until auth is added.
-- Tighten these policies when you introduce Supabase Auth + org roles.
create policy "reference_list_select_anon"
  on public.reference_list for select
  to anon, authenticated
  using (true);

create policy "reference_list_write_anon"
  on public.reference_list for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "reference_option_select_anon"
  on public.reference_option for select
  to anon, authenticated
  using (true);

create policy "reference_option_write_anon"
  on public.reference_option for all
  to anon, authenticated
  using (true)
  with check (true);
