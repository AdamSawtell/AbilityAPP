-- Admin window for task automation rules UI
insert into public.app_role_window (role_id, window_key)
values ('role-admin', 'admin-task-automations')
on conflict do nothing;
