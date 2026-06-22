-- External business partners (plan managers, vendors, referrers) + client billing/communication prefs

create table if not exists public.business_partner (
  id text primary key,
  search_key text not null default '',
  name text not null default '',
  partner_type text not null default '',
  status text not null default 'Active',
  email text not null default '',
  phone text not null default '',
  mobile text not null default '',
  abn text not null default '',
  address1 text not null default '',
  address2 text not null default '',
  city text not null default '',
  state text not null default '',
  postcode text not null default '',
  country text not null default 'Australia',
  preferred_communication_method text not null default '',
  invoice_delivery_method text not null default '',
  statement_delivery_method text not null default '',
  payment_terms text not null default '',
  bank_bsb text not null default '',
  bank_account_number text not null default '',
  bank_account_name text not null default '',
  remittance_email text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_partner_search_key_idx on public.business_partner (search_key);
create index if not exists business_partner_partner_type_idx on public.business_partner (partner_type);

alter table public.client
  add column if not exists preferred_communication_method text not null default '',
  add column if not exists plan_management_type text not null default '',
  add column if not exists plan_manager_partner_id text references public.business_partner (id) on delete set null,
  add column if not exists invoice_delivery_method text not null default '',
  add column if not exists statement_delivery_method text not null default '';

alter table public.client_bp_association
  add column if not exists partner_id text references public.business_partner (id) on delete set null;

alter table public.business_partner enable row level security;
create policy "business_partner_all" on public.business_partner for all using (true) with check (true);

insert into public.business_partner (
  id, search_key, name, partner_type, status, email, phone, abn,
  city, state, postcode, preferred_communication_method, invoice_delivery_method,
  statement_delivery_method, payment_terms, remittance_email, notes, created_by, updated_by
) values
  (
    'bp-myplan-manager',
    'MyPlan Manager',
    'MyPlan Manager Pty Ltd',
    'Plan manager',
    'Active',
    'invoices@myplanmanager.example',
    '08 8100 1100',
    '12 345 678 901',
    'Adelaide',
    'SA',
    '5000',
    'Email',
    'Email',
    'Email',
    '14 days',
    'invoices@myplanmanager.example',
    'Default plan manager for plan-managed participants.',
    'SuperUser',
    'SuperUser'
  ),
  (
    'bp-ndis-hub',
    'NDIS Hub SA',
    'NDIS Hub South Australia',
    'Referrer',
    'Active',
    'referrals@ndishub.example',
    '08 8200 2200',
    '',
    'Adelaide',
    'SA',
    '5000',
    'Phone Call',
    'Email',
    'Email',
    '',
    '',
    'Community referral partner.',
    'SuperUser',
    'SuperUser'
  ),
  (
    'bp-adelaide-clean',
    'Adelaide Clean Co',
    'Adelaide Cleaning Cooperative',
    'Vendor',
    'Active',
    'accounts@adelclean.example',
    '08 8300 3300',
    '98 765 432 109',
    'Adelaide',
    'SA',
    '5000',
    'Email',
    'Email',
    'Post',
    '30 days',
    'accounts@adelclean.example',
    'Facility cleaning vendor.',
    'SuperUser',
    'SuperUser'
  )
on conflict (id) do nothing;

update public.client
set
  plan_management_type = 'Plan managed',
  plan_manager_partner_id = 'bp-myplan-manager'
where id = 'bp-bern' and (plan_manager_partner_id is null or plan_management_type = '');
