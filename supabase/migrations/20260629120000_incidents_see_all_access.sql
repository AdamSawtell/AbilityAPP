-- Incidents list visibility: roles with incidents-dashboard become incidents-see-all.
-- Support workers keep incidents module access but lose org-wide dashboard/compliance/override grants.

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'incidents-see-all', arw.access_level
from public.app_role_window arw
where arw.window_key = 'incidents-dashboard'
on conflict (role_id, window_key) do update set access_level = excluded.access_level;

delete from public.app_role_window
where role_id = 'role-support-worker'
  and window_key in (
    'incidents-dashboard',
    'incidents-compliance',
    'incident-manager-override',
    'incidents-see-all'
  );
