-- Employee extended: emergency contacts, alerts, skills, documents, activity, leave,
-- employment/payroll/work-rights fields, linked manager

alter table public.employee
  add column if not exists reports_to_id text references public.employee (id) on delete set null,
  add column if not exists employment_type text not null default '',
  add column if not exists probation_end_date date,
  add column if not exists confirmation_date date,
  add column if not exists notice_days int,
  add column if not exists site_branch text not null default '',
  add column if not exists cost_centre text not null default '',
  add column if not exists driver_licence_class text not null default '',
  add column if not exists driver_licence_expiry date,
  add column if not exists visa_subclass text not null default '',
  add column if not exists visa_expiry date,
  add column if not exists work_rights_notes text not null default '',
  add column if not exists bank_name text not null default '',
  add column if not exists bank_bsb text not null default '',
  add column if not exists bank_account_number text not null default '',
  add column if not exists pay_method text not null default '',
  add column if not exists tfn text not null default '',
  add column if not exists tax_declaration text not null default '',
  add column if not exists super_fund text not null default '',
  add column if not exists super_member_number text not null default '',
  add column if not exists standard_hours_per_week numeric(5,2),
  add column if not exists fte numeric(4,2),
  add column if not exists leave_policy text not null default '',
  add column if not exists medical_restrictions_notes text not null default '';

create table if not exists public.employee_emergency_contact (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  contact_type text not null default 'Emergency',
  name text not null default '',
  relationship text not null default '',
  phone text not null default '',
  mobile text not null default '',
  email text not null default '',
  call_order int not null default 1,
  primary_contact text not null default 'No',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_alert (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  alert_type text not null default '',
  show_as_alert text not null default 'Yes',
  name text not null default '',
  description text not null default '',
  valid_from date,
  valid_to date,
  source text not null default 'Manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_skill (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  skill_type text not null default 'Skill',
  name text not null default '',
  proficiency text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_document (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  document_type text not null default '',
  name text not null default '',
  document_ref text not null default '',
  issue_date date,
  expiry_date date,
  status text not null default 'Current',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_activity (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  activity_date date,
  activity_type text not null default '',
  subject text not null default '',
  description text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_leave_entitlement (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  leave_type text not null default '',
  entitlement_days numeric(8,2) not null default 0,
  balance_days numeric(8,2) not null default 0,
  accrual_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrate legacy single emergency contact into line table
insert into public.employee_emergency_contact (
  id, employee_id, line_no, contact_type, name, relationship, phone, mobile, email, call_order, primary_contact, notes
)
select
  'ec-' || e.id,
  e.id,
  1,
  'Emergency',
  e.emergency_contact_name,
  '',
  e.emergency_contact_phone,
  '',
  '',
  1,
  'Yes',
  'Migrated from employee header'
from public.employee e
where coalesce(e.emergency_contact_name, '') <> ''
  and not exists (
    select 1 from public.employee_emergency_contact ec where ec.employee_id = e.id
  );

-- Link manager by name where possible (Michael Smith -> emp-michael)
update public.employee e
set reports_to_id = m.id
from public.employee m
where coalesce(e.manager_name, '') <> ''
  and e.reports_to_id is null
  and lower(m.name) = lower(e.manager_name);

create index if not exists employee_emergency_contact_employee_id_idx on public.employee_emergency_contact (employee_id);
create index if not exists employee_alert_employee_id_idx on public.employee_alert (employee_id);
create index if not exists employee_skill_employee_id_idx on public.employee_skill (employee_id);
create index if not exists employee_document_employee_id_idx on public.employee_document (employee_id);
create index if not exists employee_activity_employee_id_idx on public.employee_activity (employee_id);
create index if not exists employee_leave_entitlement_employee_id_idx on public.employee_leave_entitlement (employee_id);
create index if not exists employee_reports_to_id_idx on public.employee (reports_to_id);

drop trigger if exists employee_emergency_contact_updated_at on public.employee_emergency_contact;
create trigger employee_emergency_contact_updated_at
  before update on public.employee_emergency_contact
  for each row execute function public.set_updated_at();

drop trigger if exists employee_alert_updated_at on public.employee_alert;
create trigger employee_alert_updated_at
  before update on public.employee_alert
  for each row execute function public.set_updated_at();

drop trigger if exists employee_skill_updated_at on public.employee_skill;
create trigger employee_skill_updated_at
  before update on public.employee_skill
  for each row execute function public.set_updated_at();

drop trigger if exists employee_document_updated_at on public.employee_document;
create trigger employee_document_updated_at
  before update on public.employee_document
  for each row execute function public.set_updated_at();

drop trigger if exists employee_activity_updated_at on public.employee_activity;
create trigger employee_activity_updated_at
  before update on public.employee_activity
  for each row execute function public.set_updated_at();

drop trigger if exists employee_leave_entitlement_updated_at on public.employee_leave_entitlement;
create trigger employee_leave_entitlement_updated_at
  before update on public.employee_leave_entitlement
  for each row execute function public.set_updated_at();

alter table public.employee_emergency_contact enable row level security;
alter table public.employee_alert enable row level security;
alter table public.employee_skill enable row level security;
alter table public.employee_document enable row level security;
alter table public.employee_activity enable row level security;
alter table public.employee_leave_entitlement enable row level security;

drop policy if exists employee_emergency_contact_all on public.employee_emergency_contact;
create policy employee_emergency_contact_all on public.employee_emergency_contact for all to anon, authenticated using (true) with check (true);

drop policy if exists employee_alert_all on public.employee_alert;
create policy employee_alert_all on public.employee_alert for all to anon, authenticated using (true) with check (true);

drop policy if exists employee_skill_all on public.employee_skill;
create policy employee_skill_all on public.employee_skill for all to anon, authenticated using (true) with check (true);

drop policy if exists employee_document_all on public.employee_document;
create policy employee_document_all on public.employee_document for all to anon, authenticated using (true) with check (true);

drop policy if exists employee_activity_all on public.employee_activity;
create policy employee_activity_all on public.employee_activity for all to anon, authenticated using (true) with check (true);

drop policy if exists employee_leave_entitlement_all on public.employee_leave_entitlement;
create policy employee_leave_entitlement_all on public.employee_leave_entitlement for all to anon, authenticated using (true) with check (true);
