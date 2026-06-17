-- Configurable org-chart tier bands (managed in System setup).

create table if not exists public.org_chart_tier_config (
  tier integer primary key,
  label text not null,
  hint text not null default '',
  sort_order integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.org_chart_tier_config is
  'Tenant org-chart band definitions — labels and order. Position assignment uses org_position.chart_tier.';

insert into public.org_chart_tier_config (tier, label, hint, sort_order, active) values
  (1, 'Tier 1 — Governance', 'Board / governance container', 10, true),
  (2, 'Tier 2 — Board members', 'Individual board seats', 20, true),
  (3, 'Tier 3 — Chief executive', 'CEO', 30, true),
  (4, 'Tier 4 — Executive council', 'C-suite and executives', 40, true),
  (5, 'Tier 5 — Management', 'Managers and senior officers', 50, true),
  (6, 'Tier 6 — Team leadership', 'Site / team leaders', 60, true),
  (7, 'Tier 7 — Delivery staff', 'Support workers and frontline', 70, true)
on conflict (tier) do update set
  label = excluded.label,
  hint = excluded.hint,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

alter table public.org_chart_tier_config enable row level security;

drop policy if exists org_chart_tier_config_select on public.org_chart_tier_config;
drop policy if exists org_chart_tier_config_write on public.org_chart_tier_config;
create policy org_chart_tier_config_select on public.org_chart_tier_config for select to anon, authenticated using (true);
create policy org_chart_tier_config_write on public.org_chart_tier_config for all to anon, authenticated using (true) with check (true);
