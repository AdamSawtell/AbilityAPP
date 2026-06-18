-- Workforce review processes for HR and manager roles

insert into public.app_role_process (role_id, process_id)
select r.id, p.process_id
from public.app_role r
cross join (values
  ('review-employee-credential'),
  ('approve-leave-request')
) as p(process_id)
where r.id in (
  'role-exec-hr',
  'role-hr-manager',
  'role-hr-officer',
  'role-ceo',
  'role-rostering-manager',
  'role-team-leader',
  'role-exec-operations'
)
on conflict do nothing;

insert into public.app_role_window (role_id, window_key)
select 'role-hr-officer', 'employee-credentials-assigned'
where exists (select 1 from public.app_role where id = 'role-hr-officer')
  and not exists (
    select 1 from public.app_role_window arw
    where arw.role_id = 'role-hr-officer' and arw.window_key = 'employee-credentials-assigned'
  );
