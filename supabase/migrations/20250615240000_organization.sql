-- Organisation profile (singleton) — provider identity for NDIS and branding.

create table if not exists public.app_organization (
  id text primary key default 'org-default',
  trading_name text not null default '',
  legal_name text not null default '',
  search_key text not null default '',
  abn text not null default '',
  ndis_registration_number text not null default '',
  ndis_provider_outcome_id text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  logo_url text not null default '',
  address1 text not null default '',
  address2 text not null default '',
  city text not null default '',
  state text not null default '',
  postcode text not null default '',
  country text not null default 'Australia',
  primary_contact_name text not null default '',
  primary_contact_email text not null default '',
  primary_contact_phone text not null default '',
  registration_groups text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists app_organization_updated_at on public.app_organization;
create trigger app_organization_updated_at
  before update on public.app_organization
  for each row execute function public.set_updated_at();

alter table public.app_organization enable row level security;

drop policy if exists app_organization_select on public.app_organization;
drop policy if exists app_organization_write on public.app_organization;
create policy app_organization_select on public.app_organization for select to anon, authenticated using (true);
create policy app_organization_write on public.app_organization for all to anon, authenticated using (true) with check (true);

insert into public.app_organization (
  id, trading_name, legal_name, search_key, abn, ndis_registration_number,
  email, phone, website, address1, city, state, postcode, country,
  primary_contact_name, primary_contact_email, registration_groups, created_by, updated_by
)
values (
  'org-default',
  'AbilityAPP Community Services',
  'AbilityAPP Pty Ltd',
  'AbilityAPP',
  '',
  '',
  'admin@abilityapp.local',
  '08 8294 1100',
  '',
  '100 King William Street',
  'Adelaide',
  'SA',
  '5000',
  'Australia',
  'Super User',
  'superuser@abilityapp.local',
  E'Assistance With Daily Life Tasks In A Group Or Shared Living\nParticipation In Community And Social And Civic Activities\nSupport Coordination',
  'SuperUser',
  'SuperUser'
)
on conflict (id) do nothing;
