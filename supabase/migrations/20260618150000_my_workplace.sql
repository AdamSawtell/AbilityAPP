-- My workplace: staff self-service (availability, leave workflow, contract acknowledgements)

alter table public.employee_leave_request
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text not null default '',
  add column if not exists decline_reason text not null default '';

update public.employee_leave_request
set submitted_at = created_at
where submitted_at is null and status = 'Requested';

alter table public.employee_document
  add column if not exists staff_visible boolean not null default true,
  add column if not exists requires_acknowledgement boolean not null default false;

create table if not exists public.employee_availability (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  line_no int not null default 1,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  availability text not null default 'Available',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_availability_employee_id_idx on public.employee_availability (employee_id);

drop trigger if exists employee_availability_updated_at on public.employee_availability;
create trigger employee_availability_updated_at
  before update on public.employee_availability
  for each row execute function public.set_updated_at();

alter table public.employee_availability enable row level security;

drop policy if exists employee_availability_all on public.employee_availability;
create policy employee_availability_all on public.employee_availability for all to anon, authenticated using (true) with check (true);

create table if not exists public.employee_document_acknowledgement (
  id text primary key,
  employee_id text not null references public.employee (id) on delete cascade,
  document_id text not null references public.employee_document (id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  acknowledged_by_user_id text not null default '',
  unique (employee_id, document_id)
);

create index if not exists employee_document_ack_employee_id_idx on public.employee_document_acknowledgement (employee_id);

alter table public.employee_document_acknowledgement enable row level security;

drop policy if exists employee_document_ack_all on public.employee_document_acknowledgement;
create policy employee_document_ack_all on public.employee_document_acknowledgement for all to anon, authenticated using (true) with check (true);

-- My workplace windows for roles with linked employee logins
insert into public.app_role_window (role_id, window_key)
select r.id, w.window_key
from public.app_role r
cross join (
  values
    ('my-workplace'),
    ('my-leave'),
    ('my-profile'),
    ('my-availability'),
    ('my-contracts')
) as w(window_key)
where r.role_key in (
  'Support_Worker',
  'Team_Leader',
  'Support_Coordinator',
  'Intake_Coordinator',
  'HR_Officer',
  'HR_Manager',
  'Rostering_Officer',
  'Rostering_Manager',
  'Operations_Executive',
  'Chief_Executive_Officer',
  'AbilityAPP_Admin'
)
on conflict do nothing;
