-- Activity deletion task type — staff request removal; admin reviews and deletes the line.

insert into public.app_task_type (id, name, description, active, sort_order)
values (
  'tt-activity-delete',
  'Activity deletion',
  'Review and remove an activity line when a staff member requests deletion.',
  true,
  55
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- Admin can see, select, and action activity-deletion tasks.
insert into public.app_role_task_type (role_id, task_type_id, can_see, can_select, can_create)
values ('role-admin', 'tt-activity-delete', true, true, true)
on conflict (role_id, task_type_id) do update set
  can_see = excluded.can_see,
  can_select = excluded.can_select,
  can_create = excluded.can_create;
