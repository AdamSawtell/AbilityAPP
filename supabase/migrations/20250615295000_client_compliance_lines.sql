-- Client compliance line tables (AbilityERP: Restrictive Practices, Consents and Legal Orders)

create table if not exists public.client_restrictive_practice (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  practice_type text not null default '',
  show_as_alert text not null default 'No',
  name text not null default '',
  description text not null default '',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_consent (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  consent_type text not null default '',
  show_as_alert text not null default 'No',
  name text not null default '',
  description text not null default '',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_restrictive_practice_client_id_idx on public.client_restrictive_practice (client_id);
create index if not exists client_consent_client_id_idx on public.client_consent (client_id);

alter table public.client_restrictive_practice enable row level security;
alter table public.client_consent enable row level security;

create policy "client_restrictive_practice_all" on public.client_restrictive_practice for all using (true) with check (true);
create policy "client_consent_all" on public.client_consent for all using (true) with check (true);
