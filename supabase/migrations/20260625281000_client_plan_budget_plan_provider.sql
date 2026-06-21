-- Plan provider label on budget lines (WP-E.4 multi-provider budget)

alter table public.client_plan_budget_line
  add column if not exists plan_provider text not null default 'This organisation';

comment on column public.client_plan_budget_line.plan_provider is 'NDIS plan manager or provider label for multi-provider budget reporting';
