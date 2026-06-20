-- Roster of Care (RoC) — weekly support schedule per participant (WP-D.13)

create table if not exists public.roster_of_care (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  service_agreement_id text references public.service_agreement (id) on delete set null,
  name text not null default '',
  status text not null default 'Active',
  source text not null default 'Manual',
  valid_from date,
  valid_to date,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roster_of_care_line (
  id text primary key,
  roster_of_care_id text not null references public.roster_of_care (id) on delete cascade,
  line_no integer not null default 1,
  weekday integer not null check (weekday >= 0 and weekday <= 6),
  start_time time not null,
  end_time time not null,
  support_type text not null default 'Standard',
  location_id text references public.support_location (id) on delete set null,
  service_agreement_line_id text,
  worker_requirement text not null default '',
  notes text not null default ''
);

create index if not exists roster_of_care_client_id_idx on public.roster_of_care (client_id);
create index if not exists roster_of_care_line_parent_idx on public.roster_of_care_line (roster_of_care_id);

comment on table public.roster_of_care is 'Weekly roster of care per participant — master roster template.';
comment on column public.roster_of_care_line.weekday is '0=Monday through 6=Sunday';
