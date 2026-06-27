-- AB-0033 — Pay period definitions and generated instances (organisation-scoped).

create table if not exists public.pay_period_definition (
  id text primary key,
  organization_id text not null default 'org-default',
  name text not null default '',
  frequency text not null default 'fortnightly',
  period_length_days integer not null default 14,
  start_day integer not null default 0,
  anchor_date date not null,
  label_pattern text not null default 'PP {start}–{end}',
  edit_grace_days integer not null default 0,
  is_active boolean not null default true,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pay_period_definition_start_day check (start_day >= 0 and start_day <= 6),
  constraint pay_period_definition_length check (period_length_days > 0)
);

create index if not exists pay_period_definition_org_idx on public.pay_period_definition (organization_id);

create table if not exists public.pay_period_instance (
  id text primary key,
  definition_id text not null references public.pay_period_definition (id) on delete cascade,
  period_number text not null default '',
  period_index integer not null default 0,
  start_date date not null,
  end_date date not null,
  status text not null default 'open',
  closed_at timestamptz,
  closed_by text not null default '',
  close_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pay_period_instance_range check (end_date >= start_date),
  constraint pay_period_instance_status check (status in ('open', 'locked', 'closed')),
  unique (definition_id, period_index)
);

create index if not exists pay_period_instance_dates_idx on public.pay_period_instance (start_date, end_date);
create index if not exists pay_period_instance_definition_idx on public.pay_period_instance (definition_id);

comment on table public.pay_period_definition is 'Organisation pay cycle configuration — length, start day, anchor date.';
comment on table public.pay_period_instance is 'Generated pay period buckets — open, locked, or closed for edits.';

alter table public.pay_period_definition enable row level security;
alter table public.pay_period_instance enable row level security;

drop policy if exists pay_period_definition_select on public.pay_period_definition;
drop policy if exists pay_period_definition_write on public.pay_period_definition;
create policy pay_period_definition_select on public.pay_period_definition for select to anon, authenticated using (true);
create policy pay_period_definition_write on public.pay_period_definition for all to anon, authenticated using (true) with check (true);

drop policy if exists pay_period_instance_select on public.pay_period_instance;
drop policy if exists pay_period_instance_write on public.pay_period_instance;
create policy pay_period_instance_select on public.pay_period_instance for select to anon, authenticated using (true);
create policy pay_period_instance_write on public.pay_period_instance for all to anon, authenticated using (true) with check (true);

drop trigger if exists pay_period_definition_updated_at on public.pay_period_definition;
create trigger pay_period_definition_updated_at
  before update on public.pay_period_definition
  for each row execute function public.set_updated_at();

drop trigger if exists pay_period_instance_updated_at on public.pay_period_instance;
create trigger pay_period_instance_updated_at
  before update on public.pay_period_instance
  for each row execute function public.set_updated_at();

-- Demo fortnightly pay period (Wednesday start — common SCHADS alignment).
insert into public.pay_period_definition (
  id, organization_id, name, frequency, period_length_days, start_day, anchor_date, label_pattern, edit_grace_days, is_active, created_by, updated_by
)
values (
  'ppd-default',
  'org-default',
  'Fortnightly pay period',
  'fortnightly',
  14,
  2,
  '2025-10-01',
  'PP {start}–{end}',
  1,
  true,
  'System',
  'System'
)
on conflict (id) do nothing;
