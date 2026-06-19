-- Per-window read vs write access on role grants.
alter table public.app_role_window
  add column if not exists access_level text not null default 'write'
  check (access_level in ('read', 'write'));

update public.app_role_window
set access_level = 'write'
where access_level is null or access_level = '';
