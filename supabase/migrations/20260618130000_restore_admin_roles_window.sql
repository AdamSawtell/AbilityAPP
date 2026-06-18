-- Roles is a workspace Admin window again (not System-surface).

insert into public.app_role_window (role_id, window_key)
values ('role-admin', 'admin-roles')
on conflict do nothing;
