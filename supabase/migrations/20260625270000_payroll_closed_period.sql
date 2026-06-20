-- Payroll period close records (WP-F.2)

create table if not exists public.payroll_closed_period (
  id text primary key,
  period_start date not null,
  period_end date not null,
  closed_at timestamptz not null default now(),
  closed_by text not null default '',
  pay_run_ref text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_closed_period_range check (period_end >= period_start),
  unique (period_start, period_end)
);

drop trigger if exists payroll_closed_period_updated_at on public.payroll_closed_period;
create trigger payroll_closed_period_updated_at
  before update on public.payroll_closed_period
  for each row execute function public.set_updated_at();

alter table public.payroll_closed_period enable row level security;

drop policy if exists payroll_closed_period_select on public.payroll_closed_period;
drop policy if exists payroll_closed_period_write on public.payroll_closed_period;
create policy payroll_closed_period_select on public.payroll_closed_period for select to anon, authenticated using (true);
create policy payroll_closed_period_write on public.payroll_closed_period for all to anon, authenticated using (true) with check (true);

comment on table public.payroll_closed_period is 'Archived pay periods — blocks timesheet generation for overlapping ranges';
