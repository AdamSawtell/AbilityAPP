-- Audit log for AI assistant database operations (session-scoped access layer)

create table if not exists public.app_ai_db_access_log (
  id bigserial primary key,
  user_id text not null references public.app_user (id) on delete cascade,
  role_id text not null references public.app_role (id) on delete cascade,
  tool_name text not null default '',
  action text not null default '',
  target text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists app_ai_db_access_log_user_id_idx on public.app_ai_db_access_log (user_id);
create index if not exists app_ai_db_access_log_created_at_idx on public.app_ai_db_access_log (created_at desc);

alter table public.app_ai_db_access_log enable row level security;

drop policy if exists app_ai_db_access_log_all on public.app_ai_db_access_log;
create policy app_ai_db_access_log_all on public.app_ai_db_access_log for all using (true) with check (true);
