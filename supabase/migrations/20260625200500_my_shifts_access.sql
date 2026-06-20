-- Grant my-shifts to every role that already has my-open-shifts (WP-D.8)

insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'my-shifts', arw.access_level
from public.app_role_window arw
where arw.window_key = 'my-open-shifts'
and not exists (
  select 1 from public.app_role_window existing
  where existing.role_id = arw.role_id and existing.window_key = 'my-shifts'
);
