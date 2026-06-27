-- Rostering communication task type — employee messages to rostering as governed task conversations.

insert into public.app_task_type (id, name, description, active, sort_order)
values (
  'tt-rostering-communication',
  'Rostering communication',
  'Employee message to the rostering team, tracked as a task conversation.',
  true,
  60
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- Any staff role can create/view its own communication; the task itself is assigned to Rostering Officer.
insert into public.app_role_task_type (role_id, task_type_id, can_see, can_select, can_create)
select id, 'tt-rostering-communication', true, true, true
from public.app_role
where active = true
on conflict (role_id, task_type_id) do update set
  can_see = excluded.can_see,
  can_select = excluded.can_select,
  can_create = excluded.can_create;
