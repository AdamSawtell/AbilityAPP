-- Grant Board Reporting window to executive and board roles.

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'board-reporting', arw.access_level
from public.app_role_window arw
where arw.window_key = 'ndis-audit-pack'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'board-reporting'
  );

insert into public.app_role_window (role_id, window_key, access_level)
select 'role-board', 'board-reporting', 'read'
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-board'
    and existing.window_key = 'board-reporting'
);

insert into public.app_role_window (role_id, window_key, access_level)
select 'role-admin', 'board-reporting', 'write'
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-admin'
    and existing.window_key = 'board-reporting'
);
