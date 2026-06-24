-- Agency staffing access — windows and processes (AB-0019)

insert into public.app_role_window (role_id, window_key, access_level) values
  ('role-admin', 'agency-workers', 'write'),
  ('role-ceo', 'agency-workers', 'write'),
  ('role-exec-operations', 'agency-workers', 'write'),
  ('role-rostering-manager', 'agency-workers', 'write'),
  ('role-rostering-officer', 'agency-workers', 'write'),
  ('role-coordinator', 'agency-workers', 'write')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;

insert into public.app_role_process (role_id, process_id) values
  ('role-admin', 'request-agency-coverage'),
  ('role-admin', 'send-agency-shift-pack'),
  ('role-admin', 'confirm-agency-shift'),
  ('role-admin', 'complete-agency-shift'),
  ('role-ceo', 'request-agency-coverage'),
  ('role-ceo', 'send-agency-shift-pack'),
  ('role-ceo', 'confirm-agency-shift'),
  ('role-ceo', 'complete-agency-shift'),
  ('role-exec-operations', 'request-agency-coverage'),
  ('role-exec-operations', 'send-agency-shift-pack'),
  ('role-exec-operations', 'confirm-agency-shift'),
  ('role-exec-operations', 'complete-agency-shift'),
  ('role-rostering-manager', 'request-agency-coverage'),
  ('role-rostering-manager', 'send-agency-shift-pack'),
  ('role-rostering-manager', 'confirm-agency-shift'),
  ('role-rostering-manager', 'complete-agency-shift'),
  ('role-rostering-officer', 'request-agency-coverage'),
  ('role-rostering-officer', 'send-agency-shift-pack'),
  ('role-rostering-officer', 'confirm-agency-shift'),
  ('role-rostering-officer', 'complete-agency-shift'),
  ('role-coordinator', 'request-agency-coverage'),
  ('role-coordinator', 'send-agency-shift-pack'),
  ('role-coordinator', 'confirm-agency-shift'),
  ('role-coordinator', 'complete-agency-shift')
on conflict (role_id, process_id) do nothing;
