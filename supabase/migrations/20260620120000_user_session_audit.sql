-- User Session Audit — enterprise session tracking, risk detection, retention framework

create table if not exists public.user_session (
  id text primary key,
  user_id text references public.app_user (id) on delete set null,
  user_name text not null default '',
  role_id text not null default '',
  role_name text not null default '',
  login_at timestamptz not null,
  logout_at timestamptz,
  duration_seconds integer,
  status text not null default 'active'
    check (status in ('active', 'logged_out', 'timed_out', 'expired', 'failed_login', 'system_terminated')),
  ip_address text not null default '',
  browser text not null default '',
  device_info text not null default '',
  user_agent text not null default '',
  auth_method text not null default 'password',
  mfa_status text not null default 'not_configured',
  login_result text not null default 'success' check (login_result in ('success', 'failed')),
  failure_reason text not null default '',
  risk_level text not null default 'none' check (risk_level in ('none', 'low', 'medium', 'high', 'critical')),
  risk_status text not null default 'new' check (risk_status in ('new', 'under_review', 'accepted', 'resolved')),
  transaction_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_session_user_id_idx on public.user_session (user_id);
create index if not exists user_session_login_at_idx on public.user_session (login_at desc);
create index if not exists user_session_status_idx on public.user_session (status);
create index if not exists user_session_risk_level_idx on public.user_session (risk_level);
create index if not exists user_session_role_id_idx on public.user_session (role_id);

create table if not exists public.user_session_event (
  id text primary key,
  session_id text not null references public.user_session (id) on delete cascade,
  event_type text not null check (event_type in (
    'successful_login',
    'failed_login',
    'logout',
    'session_timeout',
    'session_expiry',
    'password_reset_login',
    'sso_login',
    'account_locked',
    'account_disabled',
    'role_change_during_session',
    'concurrent_session_detected',
    'risk_flagged'
  )),
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists user_session_event_session_id_idx on public.user_session_event (session_id);
create index if not exists user_session_event_created_at_idx on public.user_session_event (created_at desc);

-- Risk indicators are append-only — never updated or deleted
create table if not exists public.user_session_risk (
  id text primary key,
  session_id text not null references public.user_session (id) on delete cascade,
  indicator_code text not null,
  indicator_label text not null default '',
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists user_session_risk_session_id_idx on public.user_session_risk (session_id);

-- Investigation notes are append-only
create table if not exists public.user_session_risk_note (
  id text primary key,
  session_id text not null references public.user_session (id) on delete cascade,
  note text not null,
  author_user_id text not null default '',
  author_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists user_session_risk_note_session_id_idx on public.user_session_risk_note (session_id);

-- Pre-aggregated dashboard metrics (updated on session events — no full-table scans)
create table if not exists public.user_session_daily_stats (
  stat_date date primary key,
  total_logins integer not null default 0,
  failed_logins integer not null default 0,
  unique_users integer not null default 0,
  active_sessions_end_of_day integer not null default 0,
  total_duration_seconds bigint not null default 0,
  session_count_for_avg integer not null default 0,
  longest_session_seconds integer not null default 0,
  risk_events integer not null default 0,
  high_risk_events integer not null default 0,
  most_active_user_id text not null default '',
  most_active_user_name text not null default '',
  most_active_user_count integer not null default 0,
  most_active_role_id text not null default '',
  most_active_role_name text not null default '',
  most_active_role_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Extensible retention policy framework
create table if not exists public.retention_policy (
  record_type text primary key,
  label text not null default '',
  retention_days integer not null default 90 check (retention_days > 0),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'System'
);

insert into public.retention_policy (record_type, label, retention_days, active, updated_by)
values ('user_session', 'User session data', 90, true, 'System')
on conflict (record_type) do nothing;

-- System settings (concurrent sessions, session timeout, business hours)
create table if not exists public.system_setting (
  key text primary key,
  value text not null default '',
  label text not null default '',
  description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text not null default 'System'
);

insert into public.system_setting (key, value, label, description)
values
  ('concurrent_sessions_mode', 'warn', 'Allow multiple concurrent sessions per user', 'allow | warn | prevent'),
  ('session_timeout_minutes', '480', 'Session idle timeout (minutes)', 'Sessions without logout close after this idle period'),
  ('business_hours_start', '07:00', 'Business hours start (local)', 'Used for after-hours login risk detection'),
  ('business_hours_end', '19:00', 'Business hours end (local)', 'Used for after-hours login risk detection'),
  ('timezone', 'Australia/Sydney', 'Organisation timezone', 'Display timestamps in this timezone')
on conflict (key) do nothing;

-- Retention job run log
create table if not exists public.retention_job_run (
  id text primary key,
  record_type text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_deleted integer not null default 0,
  duration_ms integer,
  errors text not null default '',
  status text not null default 'running' check (status in ('running', 'completed', 'failed'))
);

create index if not exists retention_job_run_started_at_idx on public.retention_job_run (started_at desc);

-- Audit log for access to session audit data itself
create table if not exists public.session_audit_access_log (
  id text primary key,
  actor_user_id text not null default '',
  actor_name text not null default '',
  action text not null default '',
  target_session_id text not null default '',
  detail text not null default '',
  ip_address text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists session_audit_access_log_created_at_idx on public.session_audit_access_log (created_at desc);

-- Optional roles for session audit access
insert into public.app_role (id, role_key, name, description, active)
values
  ('role-security-admin', 'Security_Administrator', 'Security Administrator', 'Full session audit and investigation access', true),
  ('role-audit-viewer', 'Audit_Viewer', 'Audit Viewer', 'Read-only session audit access without sensitive fields', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

alter table public.user_session enable row level security;
alter table public.user_session_event enable row level security;
alter table public.user_session_risk enable row level security;
alter table public.user_session_risk_note enable row level security;
alter table public.user_session_daily_stats enable row level security;
alter table public.retention_policy enable row level security;
alter table public.system_setting enable row level security;
alter table public.retention_job_run enable row level security;
alter table public.session_audit_access_log enable row level security;

drop policy if exists user_session_all on public.user_session;
create policy user_session_all on public.user_session for all using (true) with check (true);

drop policy if exists user_session_event_all on public.user_session_event;
create policy user_session_event_all on public.user_session_event for all using (true) with check (true);

drop policy if exists user_session_risk_all on public.user_session_risk;
create policy user_session_risk_all on public.user_session_risk for all using (true) with check (true);

drop policy if exists user_session_risk_note_all on public.user_session_risk_note;
create policy user_session_risk_note_all on public.user_session_risk_note for all using (true) with check (true);

drop policy if exists user_session_daily_stats_all on public.user_session_daily_stats;
create policy user_session_daily_stats_all on public.user_session_daily_stats for all using (true) with check (true);

drop policy if exists retention_policy_all on public.retention_policy;
create policy retention_policy_all on public.retention_policy for all using (true) with check (true);

drop policy if exists system_setting_all on public.system_setting;
create policy system_setting_all on public.system_setting for all using (true) with check (true);

drop policy if exists retention_job_run_all on public.retention_job_run;
create policy retention_job_run_all on public.retention_job_run for all using (true) with check (true);

drop policy if exists session_audit_access_log_all on public.session_audit_access_log;
create policy session_audit_access_log_all on public.session_audit_access_log for all using (true) with check (true);
