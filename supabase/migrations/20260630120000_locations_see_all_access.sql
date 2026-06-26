-- Location-based security: org-wide location visibility for leadership and manager roles.
-- Frontline roles (support worker, coordinator, team leader, officers) stay location-scoped.

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'locations-see-all', arw.access_level
from public.app_role_window arw
where arw.window_key = 'incidents-see-all'
  and arw.role_id not in ('role-coordinator', 'role-team-leader')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;

insert into public.app_role_window (role_id, window_key, access_level)
values ('role-admin', 'locations-see-all', 'write')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;
