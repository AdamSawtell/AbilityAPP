-- AB-0040: Organisation-level idle workspace timeout.

alter table public.app_organization
  add column if not exists idle_timeout_minutes integer not null default 15;

alter table public.app_organization
  drop constraint if exists app_organization_idle_timeout_minutes_check;

alter table public.app_organization
  add constraint app_organization_idle_timeout_minutes_check
  check (idle_timeout_minutes between 5 and 120);

comment on column public.app_organization.idle_timeout_minutes is
  'Idle workspace timeout in minutes before the 2-minute inactivity warning appears.';
