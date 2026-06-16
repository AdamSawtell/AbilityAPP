-- Simple password on app_user for staff login (replaced by Microsoft SSO later).
-- Never select this column from the browser client.

alter table public.app_user
  add column if not exists password text not null default '';

comment on column public.app_user.password is 'Plain-text dev password; migrate to Supabase Auth / SSO later.';
