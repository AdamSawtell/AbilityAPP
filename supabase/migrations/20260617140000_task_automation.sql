-- Task automation rules: trigger → template → role assignment.
-- Scales via indexed dedupe keys (no full task table scans per incident).

create table if not exists public.app_task_automation (
  id text primary key,
  name text not null default '',
  active boolean not null default true,
  module text not null default 'incidents',
  trigger_event text not null,
  conditions jsonb not null default '{}'::jsonb,
  task_type_id text not null references public.app_task_type (id) on delete restrict,
  title_template text not null default '',
  description_template text not null default '',
  priority text not null default 'Normal',
  due_offset_hours integer,
  due_offset_days integer,
  due_from_field text,
  assignee_role_id text not null references public.app_role (id) on delete restrict,
  dedupe_policy text not null default 'one_open_per_entity',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_task_automation_module_trigger_idx
  on public.app_task_automation (module, trigger_event)
  where active = true;

alter table public.app_task
  add column if not exists task_type_id text references public.app_task_type (id) on delete set null,
  add column if not exists automation_rule_id text references public.app_task_automation (id) on delete set null,
  add column if not exists automation_dedupe_key text;

create index if not exists app_task_automation_rule_id_idx
  on public.app_task (automation_rule_id)
  where automation_rule_id is not null;

-- O(1) dedupe lookup: at most one open/in-progress task per automation key.
create unique index if not exists app_task_automation_dedupe_open_uidx
  on public.app_task (automation_dedupe_key)
  where automation_dedupe_key is not null
    and status in ('Open', 'In progress');

-- Incident overdue scans (scheduled automations query candidates in SQL later).
create index if not exists incident_ndis_overdue_candidate_idx
  on public.incident (report_deadline_at)
  where is_reportable = true
    and ndis_notified_at is null;

create index if not exists incident_open_status_idx
  on public.incident (status)
  where status <> 'Closed';

drop trigger if exists app_task_automation_updated_at on public.app_task_automation;
create trigger app_task_automation_updated_at
  before update on public.app_task_automation
  for each row execute function public.set_updated_at();

alter table public.app_task_automation enable row level security;

drop policy if exists app_task_automation_select on public.app_task_automation;
drop policy if exists app_task_automation_write on public.app_task_automation;
create policy app_task_automation_select on public.app_task_automation for select to anon, authenticated using (true);
create policy app_task_automation_write on public.app_task_automation for all to anon, authenticated using (true) with check (true);
