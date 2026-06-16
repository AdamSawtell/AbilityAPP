-- Support Location (AbilityERP Support Location window)

create table if not exists public.support_location (
  id text primary key,
  search_key text not null default '',
  name text not null default '',
  description text not null default '',
  location_type text not null default '',
  status text not null default 'Active',
  address1 text not null default '',
  address2 text not null default '',
  address3 text not null default '',
  city text not null default '',
  state text not null default '',
  postcode text not null default '',
  country text not null default 'Australia',
  phone text not null default '',
  mobile text not null default '',
  email text not null default '',
  access_notes text not null default '',
  picture_url text not null default '',
  capacity integer,
  valid_from date,
  valid_to date,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_location_alert (
  id text primary key,
  location_id text not null references public.support_location (id) on delete cascade,
  line_no integer not null default 1,
  alert_type text not null default '',
  show_as_alert text not null default 'Yes',
  name text not null default '',
  description text not null default '',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_location_client (
  id text primary key,
  location_id text not null references public.support_location (id) on delete cascade,
  line_no integer not null default 1,
  client_id text not null references public.client (id) on delete cascade,
  assignment_role text not null default '',
  primary_assignment text not null default 'No',
  valid_from date,
  valid_to date,
  notes text not null default ''
);

create table if not exists public.support_location_employee (
  id text primary key,
  location_id text not null references public.support_location (id) on delete cascade,
  line_no integer not null default 1,
  employee_id text not null references public.employee (id) on delete cascade,
  assignment_role text not null default '',
  primary_assignment text not null default 'No',
  valid_from date,
  valid_to date,
  notes text not null default ''
);

create table if not exists public.support_location_activity (
  id text primary key,
  location_id text not null references public.support_location (id) on delete cascade,
  line_no integer not null default 1,
  activity_date date,
  activity_type text not null default '',
  subject text not null default '',
  description text not null default '',
  created_by text not null default ''
);

create index if not exists support_location_search_key_idx on public.support_location (search_key);
create index if not exists support_location_status_idx on public.support_location (status);
create index if not exists support_location_alert_location_id_idx on public.support_location_alert (location_id);
create index if not exists support_location_client_location_id_idx on public.support_location_client (location_id);
create index if not exists support_location_client_client_id_idx on public.support_location_client (client_id);
create index if not exists support_location_employee_location_id_idx on public.support_location_employee (location_id);
create index if not exists support_location_employee_employee_id_idx on public.support_location_employee (employee_id);
create index if not exists support_location_activity_location_id_idx on public.support_location_activity (location_id);

drop trigger if exists support_location_updated_at on public.support_location;
create trigger support_location_updated_at
  before update on public.support_location
  for each row execute function public.set_updated_at();

drop trigger if exists support_location_alert_updated_at on public.support_location_alert;
create trigger support_location_alert_updated_at
  before update on public.support_location_alert
  for each row execute function public.set_updated_at();

alter table public.support_location enable row level security;
alter table public.support_location_alert enable row level security;
alter table public.support_location_client enable row level security;
alter table public.support_location_employee enable row level security;
alter table public.support_location_activity enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'support_location',
    'support_location_alert',
    'support_location_client',
    'support_location_employee',
    'support_location_activity'
  ]
  loop
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format(
      'create policy %I_all on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
