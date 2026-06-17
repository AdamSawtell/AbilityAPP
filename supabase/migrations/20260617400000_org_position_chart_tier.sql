-- Manual chart tier — which horizontal band a position appears on (independent of solid reporting).

alter table public.org_position
  add column if not exists chart_tier integer not null default 5;

comment on column public.org_position.chart_tier is
  'Manual org-chart band (1=governance, 2=board, 3=CEO, 4=exec, 5=management, 6=team lead, 7=delivery). Solid parent_position_id still drives escalation.';

create index if not exists org_position_chart_tier_idx on public.org_position (chart_tier);
