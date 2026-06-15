-- Ensure Task management admin window exists for AbilityERP Admin (catalog additions after initial deploy).

insert into public.app_role_window (role_id, window_key)
values ('role-admin', 'admin-task-management')
on conflict do nothing;
