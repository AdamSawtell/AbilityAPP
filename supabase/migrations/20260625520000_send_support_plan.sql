-- Send support plan process — same roles as print-support-plan

insert into public.app_role_process (role_id, process_id)
select r.role_id, 'send-support-plan'
from (values
  ('role-admin'),
  ('role-coordinator'),
  ('role-intake'),
  ('role-quality-manager'),
  ('role-quality-officer'),
  ('role-team-leader')
) as r(role_id)
on conflict (role_id, process_id) do nothing;
