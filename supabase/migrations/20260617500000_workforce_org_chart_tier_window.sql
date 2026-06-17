-- Admin-only permission to change manual org-chart tier bands.

insert into public.app_role_window (role_id, window_key)
values ('role-admin', 'workforce-org-chart-tier')
on conflict do nothing;
