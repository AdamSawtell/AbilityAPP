-- My workplace: staff credential submissions and HR review workflow

alter table public.employee_credential
  add column if not exists evidence_ref text not null default '',
  add column if not exists staff_submitted boolean not null default false,
  add column if not exists submitted_at timestamptz,
  add column if not exists submitted_by_user_id text not null default '',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text not null default '',
  add column if not exists review_notes text not null default '';

create index if not exists employee_credential_staff_submitted_idx on public.employee_credential (staff_submitted);
create index if not exists employee_credential_submitted_at_idx on public.employee_credential (submitted_at);

insert into public.app_role_window (role_id, window_key)
select r.id, 'my-credentials'
from public.app_role r
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
  'AbilityVua_Admin'
)
and not exists (
  select 1 from public.app_role_window arw
  where arw.role_id = r.id and arw.window_key = 'my-credentials'
);
