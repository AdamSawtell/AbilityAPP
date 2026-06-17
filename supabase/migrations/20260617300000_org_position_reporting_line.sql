-- Secondary (dotted) reporting lines — visual / matrix accountability; solid parent drives escalation.

create table if not exists public.org_position_reporting_line (
  id text primary key,
  position_id text not null references public.org_position (id) on delete cascade,
  reports_to_position_id text not null references public.org_position (id) on delete cascade,
  line_type text not null default 'dotted' check (line_type in ('dotted')),
  label text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_position_reporting_line_distinct unique (position_id, reports_to_position_id, line_type),
  constraint org_position_reporting_line_not_self check (position_id <> reports_to_position_id)
);

create index if not exists org_position_reporting_line_position_idx
  on public.org_position_reporting_line (position_id);

create index if not exists org_position_reporting_line_reports_to_idx
  on public.org_position_reporting_line (reports_to_position_id);

comment on table public.org_position_reporting_line is
  'Secondary reporting lines (dotted on org chart). Solid parent_position_id remains the escalation path.';

alter table public.org_position_reporting_line enable row level security;

drop policy if exists org_position_reporting_line_select on public.org_position_reporting_line;
drop policy if exists org_position_reporting_line_write on public.org_position_reporting_line;
create policy org_position_reporting_line_select on public.org_position_reporting_line for select to anon, authenticated using (true);
create policy org_position_reporting_line_write on public.org_position_reporting_line for all to anon, authenticated using (true) with check (true);

drop trigger if exists org_position_reporting_line_updated_at on public.org_position_reporting_line;
create trigger org_position_reporting_line_updated_at
  before update on public.org_position_reporting_line
  for each row execute function public.set_updated_at();
