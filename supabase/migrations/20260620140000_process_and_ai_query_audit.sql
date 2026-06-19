-- Process Audit + AI Query Audit (enterprise monitoring)

-- ─── Process Audit ───────────────────────────────────────────────────────────

create table if not exists public.process_audit (
  id text primary key,
  user_id text references public.app_user (id) on delete set null,
  user_name text not null default '',
  role_id text not null default '',
  role_name text not null default '',
  session_id text not null default '',
  process_id text not null,
  process_label text not null default '',
  entity_type text not null default '',
  entity_id text not null default '',
  entity_label text not null default '',
  outcome text not null check (outcome in ('success', 'failed', 'denied')),
  status text not null check (status in ('completed', 'failed', 'denied')),
  ip_address text not null default '',
  browser text not null default '',
  device_info text not null default '',
  user_agent text not null default '',
  detail text not null default '',
  failure_reason text not null default '',
  duration_ms integer,
  risk_level text not null default 'none' check (risk_level in ('none', 'low', 'medium', 'high', 'critical')),
  risk_status text not null default 'new' check (risk_status in ('new', 'under_review', 'accepted', 'resolved')),
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists process_audit_user_id_idx on public.process_audit (user_id);
create index if not exists process_audit_process_id_idx on public.process_audit (process_id);
create index if not exists process_audit_started_at_idx on public.process_audit (started_at desc);
create index if not exists process_audit_risk_level_idx on public.process_audit (risk_level);
create index if not exists process_audit_session_id_idx on public.process_audit (session_id);

create table if not exists public.process_audit_event (
  id text primary key,
  process_audit_id text not null references public.process_audit (id) on delete cascade,
  event_type text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists process_audit_event_process_id_idx on public.process_audit_event (process_audit_id);

create table if not exists public.process_audit_risk (
  id text primary key,
  process_audit_id text not null references public.process_audit (id) on delete cascade,
  indicator_code text not null,
  indicator_label text not null default '',
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.process_audit_risk_note (
  id text primary key,
  process_audit_id text not null references public.process_audit (id) on delete cascade,
  note text not null,
  author_user_id text not null default '',
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.process_audit_daily_stats (
  stat_date date primary key,
  total_executions integer not null default 0,
  successful_executions integer not null default 0,
  failed_executions integer not null default 0,
  denied_executions integer not null default 0,
  unique_users integer not null default 0,
  risk_events integer not null default 0,
  high_risk_events integer not null default 0,
  most_active_process_id text not null default '',
  most_active_process_label text not null default '',
  most_active_process_count integer not null default 0,
  most_active_user_id text not null default '',
  most_active_user_name text not null default '',
  most_active_user_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.process_audit_access_log (
  id text primary key,
  actor_user_id text not null default '',
  actor_name text not null default '',
  action text not null default '',
  target_process_audit_id text not null default '',
  detail text not null default '',
  ip_address text not null default '',
  created_at timestamptz not null default now()
);

-- ─── AI Query Audit (enrichment — chat content stays in app_ai_chat_log) ─────

create table if not exists public.ai_query_audit_meta (
  chat_log_id uuid primary key references public.app_ai_chat_log (id) on delete cascade,
  session_id text not null default '',
  user_name text not null default '',
  role_name text not null default '',
  agent_name text not null default '',
  query_type text not null default 'chat' check (query_type in ('chat', 'tool_call')),
  outcome text not null default 'success' check (outcome in ('success', 'error', 'blocked')),
  duration_ms integer,
  ip_address text not null default '',
  browser text not null default '',
  device_info text not null default '',
  user_agent text not null default '',
  risk_level text not null default 'none' check (risk_level in ('none', 'low', 'medium', 'high', 'critical')),
  risk_status text not null default 'new' check (risk_status in ('new', 'under_review', 'accepted', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_query_audit_meta_risk_level_idx on public.ai_query_audit_meta (risk_level);
create index if not exists ai_query_audit_meta_created_at_idx on public.ai_query_audit_meta (created_at desc);

create table if not exists public.ai_query_risk (
  id text primary key,
  chat_log_id uuid not null references public.app_ai_chat_log (id) on delete cascade,
  indicator_code text not null,
  indicator_label text not null default '',
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ai_query_risk_chat_log_id_idx on public.ai_query_risk (chat_log_id);

create table if not exists public.ai_query_risk_note (
  id text primary key,
  chat_log_id uuid not null references public.app_ai_chat_log (id) on delete cascade,
  note text not null,
  author_user_id text not null default '',
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_query_daily_stats (
  stat_date date primary key,
  total_queries integer not null default 0,
  successful_queries integer not null default 0,
  error_queries integer not null default 0,
  blocked_queries integer not null default 0,
  unique_users integer not null default 0,
  tool_calls integer not null default 0,
  risk_events integer not null default 0,
  high_risk_events integer not null default 0,
  most_active_agent_id text not null default '',
  most_active_agent_name text not null default '',
  most_active_agent_count integer not null default 0,
  most_active_user_id text not null default '',
  most_active_user_name text not null default '',
  most_active_user_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_query_access_log (
  id text primary key,
  actor_user_id text not null default '',
  actor_name text not null default '',
  action text not null default '',
  target_chat_log_id text not null default '',
  detail text not null default '',
  ip_address text not null default '',
  created_at timestamptz not null default now()
);

-- Retention policies
insert into public.retention_policy (record_type, label, retention_days, active, updated_by)
values
  ('process_audit', 'Process audit data', 90, true, 'System'),
  ('ai_query_meta', 'AI query audit metadata', 90, true, 'System')
on conflict (record_type) do update set
  label = excluded.label,
  active = excluded.active;

alter table public.process_audit enable row level security;
alter table public.process_audit_event enable row level security;
alter table public.process_audit_risk enable row level security;
alter table public.process_audit_risk_note enable row level security;
alter table public.process_audit_daily_stats enable row level security;
alter table public.process_audit_access_log enable row level security;
alter table public.ai_query_audit_meta enable row level security;
alter table public.ai_query_risk enable row level security;
alter table public.ai_query_risk_note enable row level security;
alter table public.ai_query_daily_stats enable row level security;
alter table public.ai_query_access_log enable row level security;

drop policy if exists process_audit_all on public.process_audit;
create policy process_audit_all on public.process_audit for all using (true) with check (true);
drop policy if exists process_audit_event_all on public.process_audit_event;
create policy process_audit_event_all on public.process_audit_event for all using (true) with check (true);
drop policy if exists process_audit_risk_all on public.process_audit_risk;
create policy process_audit_risk_all on public.process_audit_risk for all using (true) with check (true);
drop policy if exists process_audit_risk_note_all on public.process_audit_risk_note;
create policy process_audit_risk_note_all on public.process_audit_risk_note for all using (true) with check (true);
drop policy if exists process_audit_daily_stats_all on public.process_audit_daily_stats;
create policy process_audit_daily_stats_all on public.process_audit_daily_stats for all using (true) with check (true);
drop policy if exists process_audit_access_log_all on public.process_audit_access_log;
create policy process_audit_access_log_all on public.process_audit_access_log for all using (true) with check (true);
drop policy if exists ai_query_audit_meta_all on public.ai_query_audit_meta;
create policy ai_query_audit_meta_all on public.ai_query_audit_meta for all using (true) with check (true);
drop policy if exists ai_query_risk_all on public.ai_query_risk;
create policy ai_query_risk_all on public.ai_query_risk for all using (true) with check (true);
drop policy if exists ai_query_risk_note_all on public.ai_query_risk_note;
create policy ai_query_risk_note_all on public.ai_query_risk_note for all using (true) with check (true);
drop policy if exists ai_query_daily_stats_all on public.ai_query_daily_stats;
create policy ai_query_daily_stats_all on public.ai_query_daily_stats for all using (true) with check (true);
drop policy if exists ai_query_access_log_all on public.ai_query_access_log;
create policy ai_query_access_log_all on public.ai_query_access_log for all using (true) with check (true);
