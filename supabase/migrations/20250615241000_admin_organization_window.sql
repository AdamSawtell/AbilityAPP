-- Ensure Organisation admin window exists for AbilityAPP Admin.

insert into public.app_role_window (role_id, window_key)
select 'role-admin', 'admin-organization'
where exists (select 1 from public.app_role where id = 'role-admin')
  and not exists (
    select 1 from public.app_role_window
    where role_id = 'role-admin' and window_key = 'admin-organization'
  );
