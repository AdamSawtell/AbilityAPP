-- My Workplace task automations (tasks, not email).

insert into public.app_task_automation (
  id, name, active, module, trigger_event, conditions, task_type_id,
  title_template, description_template, priority, due_offset_hours, due_offset_days,
  due_from_field, assignee_mode, assignee_position_id, assignee_role_id, dedupe_policy, sort_order
)
values
  (
    'tar-employee-credential-pending-review',
    'Credential pending HR review',
    true,
    'employees',
    'employee.credential_pending_review',
    '{}'::jsonb,
    'tt-review',
    'Review credential — {{employee.name}}',
    '{{employee.name}} ({{employee.searchKey}}) submitted {{credential.type}} for HR sign-off. Review evidence and approve or reject in Workforce planning or the employee record.',
    'Normal',
    24,
    null,
    null,
    'role',
    null,
    'role-hr-officer',
    'one_open_per_entity',
    55
  ),
  (
    'tar-employee-leave-requested',
    'Leave request — manager approval',
    true,
    'employees',
    'employee.leave_requested',
    '{}'::jsonb,
    'tt-approve',
    'Approve leave — {{employee.name}}',
    '{{employee.name}} requested {{leave.type}} from {{leave.startDate}} to {{leave.endDate}} ({{leave.daysRequested}} day(s)). Approve or decline in Workforce planning.',
    'Normal',
    48,
    null,
    null,
    'org_reports_to_manager',
    null,
    'role-hr-manager',
    'one_open_per_entity',
    60
  )
on conflict (id) do update set
  name = excluded.name,
  active = excluded.active,
  module = excluded.module,
  trigger_event = excluded.trigger_event,
  conditions = excluded.conditions,
  task_type_id = excluded.task_type_id,
  title_template = excluded.title_template,
  description_template = excluded.description_template,
  priority = excluded.priority,
  due_offset_hours = excluded.due_offset_hours,
  due_offset_days = excluded.due_offset_days,
  due_from_field = excluded.due_from_field,
  assignee_mode = excluded.assignee_mode,
  assignee_position_id = excluded.assignee_position_id,
  assignee_role_id = excluded.assignee_role_id,
  dedupe_policy = excluded.dedupe_policy,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Correct Isla annual leave balance after pre-deduction approved request (3 days).
update public.employee_leave_entitlement
set balance_days = 11.5
where id = 'leave-isla-annual' and employee_id = 'emp-isla';
