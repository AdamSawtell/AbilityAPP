-- Tasks (AbilityERP Requests): assignable work items linked to records

create table if not exists public.app_task (
  id text primary key,
  document_no text not null,
  title text not null default '',
  description text not null default '',
  status text not null default 'Open',
  action_type text not null default 'Review',
  priority text not null default 'Normal',
  due_date date,
  assignment_type text not null default 'user',
  assignee_user_id text references public.app_user (id) on delete set null,
  assignee_role_id text references public.app_role (id) on delete set null,
  entity_type text not null default '',
  entity_id text not null default '',
  entity_label text not null default '',
  created_by_user_id text references public.app_user (id) on delete set null,
  created_by text not null default '',
  updated_by text not null default '',
  completed_by text not null default '',
  completed_at timestamptz,
  resolution_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_task_assignee_user_id_idx on public.app_task (assignee_user_id);
create index if not exists app_task_assignee_role_id_idx on public.app_task (assignee_role_id);
create index if not exists app_task_entity_idx on public.app_task (entity_type, entity_id);
create index if not exists app_task_status_idx on public.app_task (status);

drop trigger if exists app_task_updated_at on public.app_task;
create trigger app_task_updated_at
  before update on public.app_task
  for each row execute function public.set_updated_at();

alter table public.app_task enable row level security;

drop policy if exists app_task_select on public.app_task;
drop policy if exists app_task_write on public.app_task;
create policy app_task_select on public.app_task for select to anon, authenticated using (true);
create policy app_task_write on public.app_task for all to anon, authenticated using (true) with check (true);
