-- Employee records (Business Partner — Employee in AbilityERP)
-- Linked from app_user.employee_bp_id

create table if not exists public.employee (
  id text primary key,
  search_key text not null default '',
  business_partner_group text not null default 'Employee',
  name text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  preferred_name text not null default '',
  middle_name text not null default '',
  email text not null default '',
  phone text not null default '',
  mobile text not null default '',
  job_title text not null default '',
  department text not null default '',
  employment_status text not null default 'Active',
  start_date date,
  end_date date,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_search_key_idx on public.employee (search_key);
create index if not exists employee_name_idx on public.employee (last_name, first_name);
create index if not exists employee_status_idx on public.employee (employment_status);
create index if not exists employee_department_idx on public.employee (department);

drop trigger if exists employee_updated_at on public.employee;
create trigger employee_updated_at
  before update on public.employee
  for each row execute function public.set_updated_at();

alter table public.employee enable row level security;

drop policy if exists employee_select on public.employee;
drop policy if exists employee_write on public.employee;
create policy employee_select on public.employee for select to anon, authenticated using (true);
create policy employee_write on public.employee for all to anon, authenticated using (true) with check (true);

-- Link app users to employee records
update public.app_user set employee_bp_id = null where employee_bp_id = '';

alter table public.app_user
  drop constraint if exists app_user_employee_bp_id_fkey;

alter table public.app_user
  add constraint app_user_employee_bp_id_fkey
  foreign key (employee_bp_id) references public.employee (id) on delete set null;

create index if not exists app_user_employee_bp_id_idx on public.app_user (employee_bp_id);
