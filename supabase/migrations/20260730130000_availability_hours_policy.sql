-- Availability hours policy: org maximum, over-max approval role, overnight counting.

insert into public.system_setting (key, value, label, description)
values
  (
    'availability_max_hours_per_period',
    '76',
    'Availability maximum hours per period',
    'Organisation cap for staff weekly availability pattern. Above this requires manager approval.'
  ),
  (
    'availability_max_hours_period',
    'fortnight',
    'Availability maximum hours period',
    'Pay period for the availability maximum (week, fortnight, or month).'
  ),
  (
    'availability_over_max_approval_role_id',
    'role-rostering-manager',
    'Availability over-maximum approval role',
    'App role id that approves availability above the organisation maximum.'
  ),
  (
    'availability_overnight_hours_mode',
    'include',
    'Overnight hours in availability total',
    'How overnight availability spans (end before start) count: include, exclude, or ask.'
  )
on conflict (key) do nothing;

create table if not exists public.employee_availability_over_max_request (
  id text primary key,
  employee_id text not null references public.employee(id) on delete cascade,
  weekly_hours numeric not null,
  max_weekly_hours numeric not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  requested_by_user_id text,
  reviewed_at timestamptz,
  reviewed_by_user_id text,
  review_notes text
);

create index if not exists employee_availability_over_max_request_employee_idx
  on public.employee_availability_over_max_request (employee_id, requested_at desc);

create index if not exists employee_availability_over_max_request_status_idx
  on public.employee_availability_over_max_request (status, requested_at);

alter table public.employee_availability_over_max_request enable row level security;

drop policy if exists employee_availability_over_max_request_all on public.employee_availability_over_max_request;
create policy employee_availability_over_max_request_all
  on public.employee_availability_over_max_request
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- System setup page for workforce planning roles.
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'system-availability-policy', max(arw.access_level)
from public.app_role_window arw
where arw.window_key in ('workforce-planning', 'rostering')
group by arw.role_id
on conflict do nothing;

insert into public.app_role_window (role_id, window_key, access_level)
values ('role-admin', 'system-availability-policy', 'write')
on conflict do nothing;
