-- Employee addresses (1..n with one primary) and additional BP fields

alter table public.employee
  add column if not exists gender text not null default '',
  add column if not exists birthday date,
  add column if not exists employee_number text not null default '',
  add column if not exists manager_name text not null default '',
  add column if not exists emergency_contact_name text not null default '',
  add column if not exists emergency_contact_phone text not null default '',
  add column if not exists notes text not null default '';

create table if not exists public.employee_location (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  name text not null default '',
  address_type text not null default '',
  address1 text not null default '',
  address2 text not null default '',
  address3 text not null default '',
  city text not null default '',
  state text not null default '',
  postcode text not null default '',
  country text not null default '',
  phone text not null default '',
  mobile text not null default '',
  email text not null default '',
  primary_address text not null default 'No',
  active text not null default 'Yes',
  valid_from date,
  valid_to date,
  access_notes text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_location_employee_id_idx on public.employee_location (employee_id);
create index if not exists employee_location_primary_idx on public.employee_location (employee_id, primary_address);

drop trigger if exists employee_location_updated_at on public.employee_location;
create trigger employee_location_updated_at
  before update on public.employee_location
  for each row execute function public.set_updated_at();

alter table public.employee_location enable row level security;

drop policy if exists employee_location_select on public.employee_location;
drop policy if exists employee_location_write on public.employee_location;
create policy employee_location_select on public.employee_location for select to anon, authenticated using (true);
create policy employee_location_write on public.employee_location for all to anon, authenticated using (true) with check (true);
