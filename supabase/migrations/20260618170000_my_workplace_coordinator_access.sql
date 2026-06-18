-- Grant My workplace self-service to coordinator roles that were missing it

insert into public.app_role_window (role_id, window_key)
select r.id, w.window_key
from public.app_role r
cross join (
  values
    ('my-workplace'),
    ('my-leave'),
    ('my-profile'),
    ('my-availability'),
    ('my-contracts'),
    ('my-credentials')
) as w(window_key)
where r.role_key in ('Support_Coordinator', 'Intake_Coordinator')
and not exists (
  select 1 from public.app_role_window arw
  where arw.role_id = r.id and arw.window_key = w.window_key
);
