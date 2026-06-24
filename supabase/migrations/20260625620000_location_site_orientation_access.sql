-- Site orientation tab on location records (WP-AG.3 / AB-0018)

insert into public.app_role_window (role_id, window_key, access_level)
select role_id, 'location-site-orientation', access_level
from public.app_role_window
where window_key = 'location-incidents'
on conflict (role_id, window_key) do update set access_level = excluded.access_level;
