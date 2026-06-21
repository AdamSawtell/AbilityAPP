-- Grant Timesheet approval window and approve-timesheet process to supervisor roles.

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'timesheet-approval', arw.access_level
from public.app_role_window arw
where arw.window_key = 'timesheets'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'timesheet-approval'
  );

insert into public.app_role_window (role_id, window_key, access_level)
select 'role-team-leader', 'timesheet-approval', 'write'
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-team-leader'
    and existing.window_key = 'timesheet-approval'
);

insert into public.app_role_window (role_id, window_key, access_level)
select 'role-admin', 'timesheet-approval', 'write'
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-admin'
    and existing.window_key = 'timesheet-approval'
);

insert into public.app_role_process (role_id, process_id)
select role_id, 'approve-timesheet'
from (
  values
    ('role-admin'),
    ('role-coordinator'),
    ('role-team-leader'),
    ('role-rostering-manager')
) as roles(role_id)
where not exists (
  select 1
  from public.app_role_process existing
  where existing.role_id = roles.role_id
    and existing.process_id = 'approve-timesheet'
);

insert into public.app_role_window (role_id, window_key, access_level)
select 'role-rostering-manager', w.window_key, 'write'
from (
  values
    ('timesheets'),
    ('timesheet-approval')
) as w(window_key)
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-rostering-manager'
    and existing.window_key = w.window_key
);
