-- Organisation structure: positions (tree) and time-bound assignments.
-- Drives workforce planning, manager resolution, and future task automations.

create table if not exists public.org_position (
  id text primary key,
  title text not null default '',
  department text not null default '',
  parent_position_id text references public.org_position (id) on delete set null,
  sort_order integer not null default 0,
  status text not null default 'vacant',
  site text not null default '',
  cost_centre text not null default '',
  primary_employee_id text references public.employee (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_position_status_check check (
    status in ('filled', 'vacant', 'under_recruitment', 'frozen')
  )
);

create index if not exists org_position_parent_idx on public.org_position (parent_position_id);
create index if not exists org_position_primary_employee_idx on public.org_position (primary_employee_id)
  where primary_employee_id is not null;

create table if not exists public.position_assignment (
  id text primary key,
  position_id text not null references public.org_position (id) on delete cascade,
  employee_id text not null references public.employee (id) on delete cascade,
  assignment_type text not null default 'primary',
  effective_from date,
  effective_to date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint position_assignment_type_check check (
    assignment_type in ('primary', 'acting', 'temporary')
  )
);

create index if not exists position_assignment_position_idx on public.position_assignment (position_id);
create index if not exists position_assignment_employee_idx on public.position_assignment (employee_id);
create index if not exists position_assignment_active_idx on public.position_assignment (position_id, assignment_type, effective_to);

drop trigger if exists org_position_updated_at on public.org_position;
create trigger org_position_updated_at
  before update on public.org_position
  for each row execute function public.set_updated_at();

drop trigger if exists position_assignment_updated_at on public.position_assignment;
create trigger position_assignment_updated_at
  before update on public.position_assignment
  for each row execute function public.set_updated_at();

alter table public.org_position enable row level security;
alter table public.position_assignment enable row level security;

drop policy if exists org_position_select on public.org_position;
drop policy if exists org_position_write on public.org_position;
create policy org_position_select on public.org_position for select to anon, authenticated using (true);
create policy org_position_write on public.org_position for all to anon, authenticated using (true) with check (true);

drop policy if exists position_assignment_select on public.position_assignment;
drop policy if exists position_assignment_write on public.position_assignment;
create policy position_assignment_select on public.position_assignment for select to anon, authenticated using (true);
create policy position_assignment_write on public.position_assignment for all to anon, authenticated using (true) with check (true);
