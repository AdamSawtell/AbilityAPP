-- Shift check-in monitoring — centrally managed escalation timing and variance.

insert into public.system_setting (key, value, label, description)
values
  ('shift_late_checkin_grace_minutes', '10', 'Shift late check-in grace (minutes)', 'Minutes after shift start before a worker is flagged as a late check-in.'),
  ('shift_missed_checkin_minutes', '20', 'Shift missed check-in escalation (minutes)', 'Minutes after shift start with no check-in before escalation to the manager.'),
  ('shift_missed_checkout_grace_minutes', '30', 'Shift missed check-out grace (minutes)', 'Minutes after shift end with no check-out before a forgotten check-out is flagged.'),
  ('shift_hours_variance_threshold', '0.25', 'Shift hours variance threshold (hours)', 'Actual vs rostered hours difference that blocks timesheet approval.')
on conflict (key) do nothing;

-- System setup page access for roles that already manage workforce planning or rostering.
-- A role may hold both source windows, so collapse to one row per role.
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'system-shift-monitoring', max(arw.access_level)
from public.app_role_window arw
where arw.window_key in ('workforce-planning', 'rostering')
group by arw.role_id
on conflict (role_id, window_key) do nothing;

insert into public.app_role_window (role_id, window_key, access_level)
values ('role-admin', 'system-shift-monitoring', 'write')
on conflict (role_id, window_key) do nothing;
