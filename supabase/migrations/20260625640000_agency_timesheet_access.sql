-- Agency timesheet access (WP-AG.4)

insert into public.app_role_window (role_id, window_key, access_level) values
  ('role-admin', 'agency-timesheets', 'write'),
  ('role-admin', 'generate-agency-timesheets', 'write'),
  ('role-ceo', 'agency-timesheets', 'write'),
  ('role-ceo', 'generate-agency-timesheets', 'write'),
  ('role-exec-operations', 'agency-timesheets', 'write'),
  ('role-exec-operations', 'generate-agency-timesheets', 'write'),
  ('role-rostering-manager', 'agency-timesheets', 'write'),
  ('role-rostering-manager', 'generate-agency-timesheets', 'write'),
  ('role-rostering-officer', 'agency-timesheets', 'write'),
  ('role-rostering-officer', 'generate-agency-timesheets', 'write'),
  ('role-coordinator', 'agency-timesheets', 'write'),
  ('role-coordinator', 'generate-agency-timesheets', 'write'),
  ('role-finance-manager', 'agency-timesheets', 'write'),
  ('role-finance-manager', 'generate-agency-timesheets', 'write'),
  ('role-finance-officer', 'agency-timesheets', 'write'),
  ('role-finance-officer', 'generate-agency-timesheets', 'write')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;
