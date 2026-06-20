-- Monthly service plan — participant utilisation planning from NDIS plan budget (WP-E.1)

create table if not exists public.monthly_service_plan (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  plan_month text not null check (plan_month ~ '^\d{4}-\d{2}$'),
  status text not null default 'Draft',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, plan_month)
);

create table if not exists public.monthly_service_plan_line (
  id text primary key,
  monthly_service_plan_id text not null references public.monthly_service_plan (id) on delete cascade,
  line_no integer not null default 1,
  support_budget text not null default '',
  support_category text not null default '',
  description text not null default '',
  planned_hours numeric(10, 2) not null default 0,
  planned_amount numeric(12, 2) not null default 0,
  plan_budget_line_id text,
  notes text not null default ''
);

create index if not exists monthly_service_plan_client_id_idx on public.monthly_service_plan (client_id);
create index if not exists monthly_service_plan_month_idx on public.monthly_service_plan (plan_month);
create index if not exists monthly_service_plan_line_parent_idx on public.monthly_service_plan_line (monthly_service_plan_id);

comment on table public.monthly_service_plan is 'Monthly service plan per participant — planned hours and spend from NDIS plan budget.';
comment on column public.monthly_service_plan.plan_month is 'Calendar month YYYY-MM';

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'service-planning', arw.access_level
from public.app_role_window arw
where arw.window_key = 'service-bookings'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'service-planning'
  );

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'client-monthly-service-plan', arw.access_level
from public.app_role_window arw
where arw.window_key = 'client-plan-budget'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'client-monthly-service-plan'
  );
