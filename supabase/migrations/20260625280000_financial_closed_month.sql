-- Financial month close records (WP-J.5)

create table if not exists public.financial_closed_month (
  id text primary key,
  close_month text not null,
  period_start date not null,
  period_end date not null,
  closed_at timestamptz not null default now(),
  closed_by text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_closed_month_range check (period_end >= period_start),
  unique (close_month)
);

drop trigger if exists financial_closed_month_updated_at on public.financial_closed_month;
create trigger financial_closed_month_updated_at
  before update on public.financial_closed_month
  for each row execute function public.set_updated_at();

alter table public.financial_closed_month enable row level security;

drop policy if exists financial_closed_month_select on public.financial_closed_month;
drop policy if exists financial_closed_month_write on public.financial_closed_month;
create policy financial_closed_month_select on public.financial_closed_month for select to anon, authenticated using (true);
create policy financial_closed_month_write on public.financial_closed_month for all to anon, authenticated using (true) with check (true);

comment on table public.financial_closed_month is 'Month-end financial close lock — checklist sign-off per calendar month';
