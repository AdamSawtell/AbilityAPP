-- Workforce planning: organisation structure windows
insert into public.app_role_window (role_id, window_key)
values
  ('role-admin', 'workforce-organisation'),
  ('role-admin', 'workforce-org-edit'),
  ('role-coordinator', 'workforce-organisation'),
  ('role-coordinator', 'workforce-planning')
on conflict do nothing;
