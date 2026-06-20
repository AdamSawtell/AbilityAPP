-- NDIS plan budget lines per client (Core / Capacity building / Capital categories).

create table if not exists public.client_plan_budget_line (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  support_budget text not null default '',
  support_category text not null default '',
  description text not null default '',
  ndis_line_item_ref text not null default '',
  allocated_amount numeric(12, 2) not null default 0,
  claimed_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_plan_budget_line_client_id_idx on public.client_plan_budget_line (client_id);

alter table public.client_plan_budget_line enable row level security;

create policy "client_plan_budget_line_all" on public.client_plan_budget_line for all using (true) with check (true);

-- Sample budget lines for demo client Bernadette Rose
insert into public.client_plan_budget_line (
  id,
  client_id,
  line_no,
  support_budget,
  support_category,
  description,
  ndis_line_item_ref,
  allocated_amount,
  claimed_amount
)
values
  (
    'budget-bern-core-daily',
    'bp-bern',
    1,
    'Core',
    'Assistance with Daily Life',
    'Personal care and daily living supports',
    '01_011_0107_1_1',
    45000.00,
    12800.00
  ),
  (
    'budget-bern-core-community',
    'bp-bern',
    2,
    'Core',
    'Social and Community Participation',
    'Community access and social activities',
    '04_104_0125_6_1',
    18000.00,
    4200.00
  ),
  (
    'budget-bern-cb-coord',
    'bp-bern',
    3,
    'Capacity building',
    'Support Coordination',
    'Level 2 support coordination',
    '07_002_0106_8_3',
    6000.00,
    1800.00
  )
on conflict (id) do nothing;
