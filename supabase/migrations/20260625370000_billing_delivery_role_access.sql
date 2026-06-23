-- Grant billing, reconciliation, and delivery windows missing from older role seeds.
-- Mirrors web/src/lib/access/catalog.ts Delivery group + common dependent windows.

-- Invoice reconciliation follows participant invoices access.
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'invoice-reconciliation', arw.access_level
from public.app_role_window arw
where arw.window_key = 'invoices'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'invoice-reconciliation'
  );

-- Multi-provider budget follows service planning access.
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'multi-provider-budget', arw.access_level
from public.app_role_window arw
where arw.window_key = 'service-planning'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = 'multi-provider-budget'
  );

-- My workplace shift and timesheet windows for roles with my-workplace.
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, w.window_key, arw.access_level
from public.app_role_window arw
cross join (
  values
    ('my-open-shifts'),
    ('my-shifts'),
    ('my-timesheets')
) as w(window_key)
where arw.window_key = 'my-workplace'
  and not exists (
    select 1
    from public.app_role_window existing
    where existing.role_id = arw.role_id
      and existing.window_key = w.window_key
  );

-- AbilityVua Admin — ensure write access to catalog windows added after initial seed.
insert into public.app_role_window (role_id, window_key, access_level)
select 'role-admin', w.window_key, 'write'
from (
  values
    ('invoice-reconciliation'),
    ('multi-provider-budget'),
    ('service-planning'),
    ('client-monthly-service-plan'),
    ('client-roster-of-care'),
    ('my-open-shifts'),
    ('my-shifts'),
    ('my-timesheets'),
    ('reports-advance'),
    ('admin-task-management'),
    ('admin-task-automations'),
    ('admin-user-session-audit'),
    ('admin-process-audit'),
    ('admin-ai-query-audit'),
    ('admin-record-retention'),
    ('system-time-and-date')
) as w(window_key)
where not exists (
  select 1
  from public.app_role_window existing
  where existing.role_id = 'role-admin'
    and existing.window_key = w.window_key
);
