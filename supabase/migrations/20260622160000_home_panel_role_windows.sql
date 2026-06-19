-- Home dashboard panel windows (dependent on home) — role-configurable landing sections

delete from public.app_role_window
where window_key like 'home-%' and window_key <> 'home';

-- Core panels for every role with Home access
insert into public.app_role_window (role_id, window_key)
select distinct role_id, panel.key
from public.app_role_window arw
cross join (
  values
    ('home-prompt'),
    ('home-needs-attention'),
    ('home-today')
) as panel(key)
where arw.window_key = 'home'
on conflict do nothing;

-- Module-linked panels (only when the role has the parent module)
insert into public.app_role_window (role_id, window_key)
select distinct arw.role_id, panel.key
from public.app_role_window arw
cross join (
  values
    ('enquiries', 'home-module-enquiries'),
    ('enquiries', 'home-recent-enquiries'),
    ('enquiries', 'home-quick-new-enquiry'),
    ('clients', 'home-module-clients'),
    ('clients', 'home-recent-clients'),
    ('incidents', 'home-module-incidents'),
    ('incidents', 'home-recent-incidents'),
    ('incidents', 'home-quick-report-incident'),
    ('employees', 'home-module-employees')
) as panel(module_key, key)
where arw.window_key = panel.module_key
on conflict do nothing;
