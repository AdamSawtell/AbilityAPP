-- Configurable task types and role-based access (see / select / create)

create table if not exists public.app_task_type (
  id text primary key,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order integer not null default 99,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_task_type (id, name, description, active, sort_order)
values
  ('tt-review', 'Review', 'Review information or a record before proceeding.', true, 10),
  ('tt-approve', 'Approve', 'Approve terms, funding, or a decision.', true, 20),
  ('tt-check', 'Check', 'Verify details, documents, or compliance.', true, 30),
  ('tt-develop', 'Develop', 'Prepare or develop plans, paperwork, or content.', true, 40),
  ('tt-decide', 'Decide', 'Make a decision on options or next steps.', true, 50),
  ('tt-other', 'Other', 'General task not covered by other types.', true, 99)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  sort_order = excluded.sort_order;

create table if not exists public.app_role_task_type (
  role_id text not null references public.app_role (id) on delete cascade,
  task_type_id text not null references public.app_task_type (id) on delete cascade,
  can_see boolean not null default false,
  can_select boolean not null default false,
  can_create boolean not null default false,
  primary key (role_id, task_type_id)
);

alter table public.app_task
  add column if not exists task_type_id text references public.app_task_type (id) on delete set null;

update public.app_task
set task_type_id = case action_type
  when 'Review' then 'tt-review'
  when 'Approve' then 'tt-approve'
  when 'Check' then 'tt-check'
  when 'Develop' then 'tt-develop'
  when 'Decide' then 'tt-decide'
  else 'tt-other'
end
where task_type_id is null;

create index if not exists app_task_task_type_id_idx on public.app_task (task_type_id);
create index if not exists app_role_task_type_role_idx on public.app_role_task_type (role_id);

drop trigger if exists app_task_type_updated_at on public.app_task_type;
create trigger app_task_type_updated_at
  before update on public.app_task_type
  for each row execute function public.set_updated_at();

alter table public.app_task_type enable row level security;
alter table public.app_role_task_type enable row level security;

drop policy if exists app_task_type_select on public.app_task_type;
drop policy if exists app_task_type_write on public.app_task_type;
create policy app_task_type_select on public.app_task_type for select to anon, authenticated using (true);
create policy app_task_type_write on public.app_task_type for all to anon, authenticated using (true) with check (true);

drop policy if exists app_role_task_type_select on public.app_role_task_type;
drop policy if exists app_role_task_type_write on public.app_role_task_type;
create policy app_role_task_type_select on public.app_role_task_type for select to anon, authenticated using (true);
create policy app_role_task_type_write on public.app_role_task_type for all to anon, authenticated using (true) with check (true);
