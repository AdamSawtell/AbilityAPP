-- Task automations: assign via org position or incident accountable manager (Phase D).

alter table public.app_task_automation
  add column if not exists assignee_mode text not null default 'role',
  add column if not exists assignee_position_id text references public.org_position (id) on delete set null;

comment on column public.app_task_automation.assignee_mode is
  'role | org_position | org_incident_manager — how created tasks are assigned';
comment on column public.app_task_automation.assignee_position_id is
  'When assignee_mode is org_position, resolve holder from this position';

update public.app_task_automation
set
  assignee_mode = 'org_incident_manager',
  assignee_role_id = coalesce(assignee_role_id, 'role-admin')
where id = 'tar-incident-reportable-review';

update public.app_task_automation
set
  assignee_mode = 'org_position',
  assignee_position_id = 'pos-gm-ops',
  assignee_role_id = coalesce(assignee_role_id, 'role-admin')
where id = 'tar-incident-ndis-overdue';

update public.app_task_automation
set
  assignee_mode = 'org_position',
  assignee_position_id = 'pos-gm-ops',
  assignee_role_id = coalesce(assignee_role_id, 'role-coordinator')
where id = 'tar-incident-investigation-sla';
