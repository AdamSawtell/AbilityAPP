-- Leave self-service minimum notice (hours before shift) — centrally managed system setting.

insert into public.system_setting (key, value, label, description)
values (
  'leave_self_service_minimum_hours',
  '76',
  'Leave self-service minimum notice (hours)',
  'Staff can submit leave online until this many hours before their first affected roster shift. Inside the window they must phone HR or their manager. Set to 0 to disable.'
)
on conflict (key) do nothing;

-- System setup page for HR / admin roles with workforce planning access.
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'system-leave-policy', arw.access_level
from public.app_role_window arw
where arw.window_key = 'workforce-planning'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'system-leave-policy'
  );

insert into public.app_role_window (role_id, window_key, access_level)
select 'role-admin', 'system-leave-policy', 'write'
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-admin'
    and existing.window_key = 'system-leave-policy'
);
